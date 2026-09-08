// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variável ${name} não configurada no servidor.`);
  return value;
};

const findAuthUserByEmail = async (adminClient: ReturnType<typeof createClient>, email: string) => {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found || data.users.length < 1000) return found || null;
  }
  throw new Error('Não foi possível concluir a busca da conta informada.');
};

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ error: 'Sessão administrativa não encontrada.' }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Sessão expirada ou inválida.' }, 401);

    const body = await request.json();
    const groupId = typeof body?.groupId === 'string' ? body.groupId.trim() : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body?.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;
    const tennisClass = typeof body?.tennisClass === 'string' ? body.tennisClass.toUpperCase() : '';
    const isAdmin = body?.isAdmin === true;

    if (!groupId || !name || !email || !email.includes('@') || !['A', 'B', 'C', 'D', 'E'].includes(tennisClass)) {
      return json({ error: 'Nome, e-mail, grupo e classe válidos são obrigatórios.' }, 400);
    }

    const { data: membership, error: membershipError } = await adminClient
      .from('membros_grupo')
      .select('perfil, aprovado')
      .eq('grupo_id', groupId)
      .eq('usuario_id', authData.user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership?.aprovado || !['ADMINISTRADOR', 'PROPRIETARIO'].includes(membership.perfil)) {
      return json({ error: 'Somente administradores aprovados podem convidar jogadores.' }, 403);
    }

    let user = await findAuthUserByEmail(adminClient, email);
    let status: 'created' | 'linked' = 'linked';
    let temporaryPassword: string | undefined;

    if (!user) {
      temporaryPassword = generateTemporaryPassword();
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { nome: name },
      });
      if (createError) throw createError;
      user = createData.user;
      status = 'created';
    }

    const { error: profileError } = await adminClient.from('perfis').upsert({
      id: user.id,
      nome: name,
      email,
      telefone: phone,
      precisa_trocar_senha: status === 'created',
    }, { onConflict: 'id' });
    if (profileError) throw profileError;

    const { error: groupError } = await adminClient.from('membros_grupo').upsert({
      grupo_id: groupId,
      usuario_id: user.id,
      perfil: isAdmin ? 'ADMINISTRADOR' : 'JOGADOR',
      classe: tennisClass,
      aprovado: true,
    }, { onConflict: 'grupo_id,usuario_id' });
    if (groupError) throw groupError;

    return json({
      status,
      userId: user.id,
      temporaryPassword,
      message: status === 'created' ? 'Conta criada sem envio de e-mail.' : 'Conta existente vinculada ao grupo.',
    });
  } catch (error) {
    console.error('admin-invite-player:', error);
    const message = error instanceof Error ? error.message : 'Não foi possível convidar o jogador.';
    return json({ error: message }, 500);
  }
});
