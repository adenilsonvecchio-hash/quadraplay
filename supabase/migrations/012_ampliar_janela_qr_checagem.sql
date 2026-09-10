-- Versão 114: amplia a janela de validade do QR de checagem de 5s para 60s.
-- 5 segundos era curto demais para o fluxo real de câmera nativa (abrir a
-- Câmera, apontar, tocar no link, o navegador abrir e o app carregar antes
-- de conseguir validar). Isso fazia toda leitura falhar por "QR expirado",
-- tanto em Android quanto em iPhone.

create or replace function public.checar_partida_qr(
  p_match_id uuid,
  p_qr_player_id uuid,
  p_issued_at_ms bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  partida public.partidas%rowtype;
  agora timestamptz := clock_timestamp();
  emitido timestamptz;
  adversario uuid;
  nome_adversario text;
  v1 timestamptz;
  v2 timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_match_id is null or p_qr_player_id is null or p_issued_at_ms is null then
    raise exception 'QR Code inválido.';
  end if;

  emitido := to_timestamp(p_issued_at_ms / 1000.0);
  if emitido > agora + interval '2 seconds' or agora - emitido > interval '60 seconds' then
    raise exception 'QR Code expirado. Gere um novo código.';
  end if;

  select * into partida
  from public.partidas
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Partida não encontrada.';
  end if;

  if partida.status <> 'ACEITA' then
    raise exception 'A partida não está confirmada.';
  end if;

  if auth.uid() <> partida.jogador_1_id and auth.uid() <> partida.jogador_2_id then
    raise exception 'Você não participa desta partida.';
  end if;

  if p_qr_player_id <> partida.jogador_1_id and p_qr_player_id <> partida.jogador_2_id then
    raise exception 'Este QR não pertence a um jogador desta partida.';
  end if;

  if p_qr_player_id = auth.uid() then
    raise exception 'Não é possível validar seu próprio QR. Escaneie o QR do adversário.';
  end if;

  if partida.jogador_1_id = auth.uid() then
    update public.partidas
      set checagem_jogador_1_em = coalesce(checagem_jogador_1_em, agora)
    where id = partida.id;
    adversario := partida.jogador_2_id;
  else
    update public.partidas
      set checagem_jogador_2_em = coalesce(checagem_jogador_2_em, agora)
    where id = partida.id;
    adversario := partida.jogador_1_id;
  end if;

  select nome into nome_adversario from public.perfis where id = adversario;
  select checagem_jogador_1_em, checagem_jogador_2_em into v1, v2
  from public.partidas where id = partida.id;

  return jsonb_build_object(
    'ok', true,
    'match_id', partida.id,
    'adversario_id', adversario,
    'adversario_nome', coalesce(nome_adversario, 'Adversário'),
    'sua_validacao_em', case when auth.uid() = partida.jogador_1_id then v1 else v2 end,
    'adversario_validou', case when auth.uid() = partida.jogador_1_id then v2 is not null else v1 is not null end,
    'partida_validada_por_ambos', v1 is not null and v2 is not null
  );
end;
$$;

grant execute on function public.checar_partida_qr(uuid, uuid, bigint) to authenticated;
