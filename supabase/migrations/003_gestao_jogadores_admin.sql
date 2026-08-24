-- QuadraPlay+ — gestão administrativa de jogadores.
-- Execute depois das migrações 001 e 002.

create or replace function public.admin_adicionar_jogador(
  p_grupo_id uuid,
  p_nome text,
  p_email text,
  p_telefone text,
  p_classe text,
  p_perfil text default 'JOGADOR'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
begin
  if not public.admin_do_grupo(p_grupo_id) then
    raise exception 'Somente administradores podem adicionar jogadores.';
  end if;
  if p_classe not in ('A', 'B', 'C', 'D', 'E') then
    raise exception 'Classe inválida.';
  end if;
  if p_perfil not in ('JOGADOR', 'ADMINISTRADOR') then
    raise exception 'Perfil inválido.';
  end if;

  select id into v_usuario_id
  from public.perfis
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_usuario_id is null then
    raise exception 'Nenhuma conta foi encontrada com este e-mail. Crie primeiro o usuário no Supabase Auth.';
  end if;

  update public.perfis
  set nome = trim(p_nome), telefone = nullif(trim(coalesce(p_telefone, '')), '')
  where id = v_usuario_id;

  insert into public.membros_grupo (grupo_id, usuario_id, perfil, classe, aprovado)
  values (p_grupo_id, v_usuario_id, p_perfil::public.perfil_usuario, p_classe, true)
  on conflict (grupo_id, usuario_id) do update
    set perfil = excluded.perfil, classe = excluded.classe, aprovado = true;

  return v_usuario_id;
end;
$$;

create or replace function public.admin_atualizar_jogador(
  p_grupo_id uuid,
  p_usuario_id uuid,
  p_nome text,
  p_telefone text,
  p_classe text,
  p_perfil text default 'JOGADOR'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_do_grupo(p_grupo_id) then
    raise exception 'Somente administradores podem editar jogadores.';
  end if;
  if not exists (
    select 1 from public.membros_grupo
    where grupo_id = p_grupo_id and usuario_id = p_usuario_id
  ) then
    raise exception 'Jogador não pertence a este grupo.';
  end if;
  if p_classe not in ('A', 'B', 'C', 'D', 'E') then
    raise exception 'Classe inválida.';
  end if;
  if p_perfil not in ('JOGADOR', 'ADMINISTRADOR') then
    raise exception 'Perfil inválido.';
  end if;
  if p_usuario_id = auth.uid() and p_perfil <> 'ADMINISTRADOR' then
    raise exception 'Você não pode remover sua própria permissão administrativa.';
  end if;

  update public.perfis
  set nome = trim(p_nome), telefone = nullif(trim(coalesce(p_telefone, '')), '')
  where id = p_usuario_id;

  update public.membros_grupo
  set classe = p_classe,
      perfil = case when perfil = 'PROPRIETARIO' then perfil else p_perfil::public.perfil_usuario end,
      aprovado = true
  where grupo_id = p_grupo_id and usuario_id = p_usuario_id;
end;
$$;

create or replace function public.admin_remover_jogador(
  p_grupo_id uuid,
  p_usuario_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfil_usuario;
begin
  if not public.admin_do_grupo(p_grupo_id) then
    raise exception 'Somente administradores podem remover jogadores.';
  end if;
  if p_usuario_id = auth.uid() then
    raise exception 'Você não pode remover sua própria conta administrativa.';
  end if;

  select perfil into v_perfil
  from public.membros_grupo
  where grupo_id = p_grupo_id and usuario_id = p_usuario_id;

  if v_perfil is null then
    raise exception 'Jogador não pertence a este grupo.';
  end if;
  if v_perfil = 'PROPRIETARIO' then
    raise exception 'O proprietário do grupo não pode ser removido.';
  end if;

  delete from public.membros_grupo
  where grupo_id = p_grupo_id and usuario_id = p_usuario_id;
end;
$$;

revoke all on function public.admin_adicionar_jogador(uuid, text, text, text, text, text) from public;
revoke all on function public.admin_atualizar_jogador(uuid, uuid, text, text, text, text) from public;
revoke all on function public.admin_remover_jogador(uuid, uuid) from public;

grant execute on function public.admin_adicionar_jogador(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.admin_atualizar_jogador(uuid, uuid, text, text, text, text) to authenticated;
grant execute on function public.admin_remover_jogador(uuid, uuid) to authenticated;
