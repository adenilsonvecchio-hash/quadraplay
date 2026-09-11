-- Versão 114: check-in de presença com um toque ("JOGAMOS"), com localização
-- capturada apenas no momento da confirmação (não é rastreamento contínuo) e
-- visível apenas para administradores do grupo, sob demanda.

alter table public.partidas
  add column if not exists checagem_jogador_1_lat double precision,
  add column if not exists checagem_jogador_1_lng double precision,
  add column if not exists checagem_jogador_2_lat double precision,
  add column if not exists checagem_jogador_2_lng double precision;

comment on column public.partidas.checagem_jogador_1_lat is 'Latitude aproximada do jogador 1 no momento em que apertou JOGAMOS. Visível somente para administradores.';
comment on column public.partidas.checagem_jogador_1_lng is 'Longitude aproximada do jogador 1 no momento em que apertou JOGAMOS. Visível somente para administradores.';
comment on column public.partidas.checagem_jogador_2_lat is 'Latitude aproximada do jogador 2 no momento em que apertou JOGAMOS. Visível somente para administradores.';
comment on column public.partidas.checagem_jogador_2_lng is 'Longitude aproximada do jogador 2 no momento em que apertou JOGAMOS. Visível somente para administradores.';

-- Confirmação de presença com um toque. Cada jogador só grava a própria
-- checagem; o outro lado nunca é retornado para o cliente (fica no banco,
-- só visível para admin via obter_localizacao_partida).
create or replace function public.confirmar_presenca_jogamos(
  p_match_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  partida public.partidas%rowtype;
  agora timestamptz := clock_timestamp();
  sou_jogador_1 boolean;
  ja_confirmou boolean;
  ambos boolean;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_match_id is null then
    raise exception 'Partida inválida.';
  end if;

  -- Coordenadas são opcionais: se o jogador negar a permissão de localização,
  -- ainda assim registramos a presença (sem o sinal extra para o admin).
  select * into partida from public.partidas where id = p_match_id for update;
  if not found then
    raise exception 'Partida não encontrada.';
  end if;

  if partida.status <> 'ACEITA' then
    raise exception 'A partida não está confirmada.';
  end if;

  if auth.uid() <> partida.jogador_1_id and auth.uid() <> partida.jogador_2_id then
    raise exception 'Você não participa desta partida.';
  end if;

  sou_jogador_1 := auth.uid() = partida.jogador_1_id;

  if sou_jogador_1 then
    ja_confirmou := partida.checagem_jogador_1_em is not null;
    update public.partidas set
      checagem_jogador_1_em = coalesce(checagem_jogador_1_em, agora),
      checagem_jogador_1_lat = coalesce(checagem_jogador_1_lat, p_lat),
      checagem_jogador_1_lng = coalesce(checagem_jogador_1_lng, p_lng)
    where id = partida.id;
  else
    ja_confirmou := partida.checagem_jogador_2_em is not null;
    update public.partidas set
      checagem_jogador_2_em = coalesce(checagem_jogador_2_em, agora),
      checagem_jogador_2_lat = coalesce(checagem_jogador_2_lat, p_lat),
      checagem_jogador_2_lng = coalesce(checagem_jogador_2_lng, p_lng)
    where id = partida.id;
  end if;

  select (checagem_jogador_1_em is not null and checagem_jogador_2_em is not null)
  into ambos
  from public.partidas where id = partida.id;

  return jsonb_build_object(
    'ok', true,
    'ja_tinha_confirmado', ja_confirmou,
    'ambos_confirmaram', coalesce(ambos, false)
  );
end;
$$;

grant execute on function public.confirmar_presenca_jogamos(uuid, double precision, double precision) to authenticated;

-- Leitura da localização por um administrador do grupo, somente sob demanda
-- (tela de relatório). Nunca é exposta para os jogadores.
create or replace function public.obter_localizacao_partida(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  partida public.partidas%rowtype;
  distancia_m double precision;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into partida from public.partidas where id = p_match_id;
  if not found then
    raise exception 'Partida não encontrada.';
  end if;

  if not public.admin_do_grupo(partida.grupo_id) then
    raise exception 'Apenas administradores podem ver a localização da partida.';
  end if;

  if partida.checagem_jogador_1_lat is not null and partida.checagem_jogador_2_lat is not null then
    -- Haversine, resultado em metros.
    distancia_m := 6371000 * acos(
      least(1, greatest(-1,
        sin(radians(partida.checagem_jogador_1_lat)) * sin(radians(partida.checagem_jogador_2_lat)) +
        cos(radians(partida.checagem_jogador_1_lat)) * cos(radians(partida.checagem_jogador_2_lat)) *
        cos(radians(partida.checagem_jogador_2_lng) - radians(partida.checagem_jogador_1_lng))
      ))
    );
  else
    distancia_m := null;
  end if;

  return jsonb_build_object(
    'jogador_1_em', partida.checagem_jogador_1_em,
    'jogador_1_lat', partida.checagem_jogador_1_lat,
    'jogador_1_lng', partida.checagem_jogador_1_lng,
    'jogador_2_em', partida.checagem_jogador_2_em,
    'jogador_2_lat', partida.checagem_jogador_2_lat,
    'jogador_2_lng', partida.checagem_jogador_2_lng,
    'distancia_metros', distancia_m
  );
end;
$$;

grant execute on function public.obter_localizacao_partida(uuid) to authenticated;
