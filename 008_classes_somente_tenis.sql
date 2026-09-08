-- QuadraPlay+ v61 — classes A–E são exclusivas do Tênis.
-- Execute depois das migrações 006 e 007.

create or replace function public.validar_partida()
returns trigger language plpgsql set search_path = public as $$
declare
  classe_1 text;
  classe_2 text;
begin
  if new.data < (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Não é permitido agendar em datas anteriores ao dia atual.';
  end if;
  if new.data = (now() at time zone 'America/Sao_Paulo')::date
     and new.hora_inicio <= (now() at time zone 'America/Sao_Paulo')::time then
    raise exception 'Este horário já transcorreu no dia de hoje.';
  end if;

  if not exists (
    select 1 from public.horarios_agenda h
    where h.grupo_id = new.grupo_id and h.modalidade = new.modalidade and h.ativo
      and h.hora_inicio = new.hora_inicio and h.hora_fim = new.hora_fim
  ) then raise exception 'Este horário não está cadastrado ou está desativado.';
  end if;

  if not exists (
    select 1 from public.quadras q
    where q.id = new.quadra_id and q.grupo_id = new.grupo_id
      and q.modalidade = new.modalidade and q.ativa
  ) then raise exception 'Este espaço não está ativo para agendamentos.';
  end if;

  if new.modalidade = 'tenis' then
    select classe into classe_1 from public.membros_grupo
      where grupo_id = new.grupo_id and usuario_id = new.jogador_1_id and aprovado;
    select classe into classe_2 from public.membros_grupo
      where grupo_id = new.grupo_id and usuario_id = new.jogador_2_id and aprovado;
    if classe_1 is null or classe_2 is null then
      raise exception 'Os dois jogadores precisam estar aprovados e possuir classe.';
    end if;
    if classe_1 <> classe_2 or new.classe <> classe_1 then
      raise exception 'No Tênis, só é permitido agendar entre jogadores da mesma classe.';
    end if;
  else
    if not exists (select 1 from public.membros_grupo where grupo_id = new.grupo_id and usuario_id = new.jogador_1_id and aprovado)
       or not exists (select 1 from public.membros_grupo where grupo_id = new.grupo_id and usuario_id = new.jogador_2_id and aprovado) then
      raise exception 'Os dois participantes precisam estar aprovados.';
    end if;
  end if;

  if exists (
    select 1 from public.bloqueios_agenda b
    where b.grupo_id = new.grupo_id and b.modalidade = new.modalidade and b.data = new.data
      and (b.quadra_id is null or b.quadra_id = new.quadra_id)
      and (b.dia_inteiro or (new.hora_inicio < b.hora_fim and new.hora_fim > b.hora_inicio))
  ) then raise exception 'Este horário está bloqueado pela administração.';
  end if;

  if exists (
    select 1 from public.partidas p
    where p.id <> coalesce(new.id, gen_random_uuid()) and p.data = new.data
      and p.grupo_id = new.grupo_id and p.modalidade = new.modalidade and p.quadra_id = new.quadra_id
      and p.status in ('PENDENTE', 'ACEITA')
      and new.hora_inicio < p.hora_fim and new.hora_fim > p.hora_inicio
  ) then raise exception 'Este espaço já possui um agendamento neste horário.';
  end if;

  if exists (
    select 1 from public.partidas p
    where p.id <> coalesce(new.id, gen_random_uuid()) and p.data = new.data
      and p.grupo_id = new.grupo_id and p.modalidade = new.modalidade
      and p.status in ('PENDENTE', 'ACEITA')
      and new.hora_inicio < p.hora_fim and new.hora_fim > p.hora_inicio
      and (p.jogador_1_id in (new.jogador_1_id, new.jogador_2_id)
        or p.jogador_2_id in (new.jogador_1_id, new.jogador_2_id))
  ) then raise exception 'Um dos participantes já possui agendamento neste horário.';
  end if;
  return new;
end $$;
