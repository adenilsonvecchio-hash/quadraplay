-- QuadraPlay+ v58 — modalidades sem alterar os dados existentes.
-- Execute depois das migrações 001 a 005.

create table if not exists public.modalidades (
  id text primary key,
  nome text not null,
  ordem integer not null,
  ativa boolean not null default true
);

insert into public.modalidades (id, nome, ordem) values
  ('tenis', 'Tênis', 1),
  ('futsal', 'Futsal', 2),
  ('futebol-campo', 'Futebol de Campo', 3),
  ('beach-tennis', 'Beach Tennis', 4),
  ('handebol', 'Handebol', 5),
  ('volei', 'Vôlei', 6),
  ('basquete', 'Basquete', 7)
on conflict (id) do update set nome = excluded.nome, ordem = excluded.ordem;

alter table public.quadras add column if not exists modalidade text references public.modalidades(id) default 'tenis';
alter table public.configuracoes_agenda add column if not exists modalidade text references public.modalidades(id) default 'tenis';
alter table public.horarios_agenda add column if not exists modalidade text references public.modalidades(id) default 'tenis';
alter table public.bloqueios_agenda add column if not exists modalidade text references public.modalidades(id) default 'tenis';
alter table public.partidas add column if not exists modalidade text references public.modalidades(id) default 'tenis';

update public.quadras set modalidade = 'tenis' where modalidade is null;
update public.configuracoes_agenda set modalidade = 'tenis' where modalidade is null;
update public.horarios_agenda set modalidade = 'tenis' where modalidade is null;
update public.bloqueios_agenda set modalidade = 'tenis' where modalidade is null;
update public.partidas set modalidade = 'tenis' where modalidade is null;

alter table public.quadras alter column modalidade set not null;
alter table public.configuracoes_agenda alter column modalidade set not null;
alter table public.horarios_agenda alter column modalidade set not null;
alter table public.bloqueios_agenda alter column modalidade set not null;
alter table public.partidas alter column modalidade set not null;

alter table public.configuracoes_agenda drop constraint if exists configuracoes_agenda_pkey;
alter table public.configuracoes_agenda add primary key (grupo_id, modalidade);

alter table public.horarios_agenda drop constraint if exists horarios_agenda_grupo_id_hora_inicio_key;
alter table public.horarios_agenda add constraint horarios_agenda_grupo_modalidade_hora_key unique (grupo_id, modalidade, hora_inicio);

alter table public.quadras drop constraint if exists quadras_grupo_id_nome_key;
alter table public.quadras add constraint quadras_grupo_modalidade_nome_key unique (grupo_id, modalidade, nome);

create index if not exists quadras_modalidade_idx on public.quadras (grupo_id, modalidade, ativa);
create index if not exists partidas_modalidade_idx on public.partidas (grupo_id, modalidade, data);
create index if not exists bloqueios_modalidade_idx on public.bloqueios_agenda (grupo_id, modalidade, data);

alter table public.modalidades enable row level security;
drop policy if exists modalidades_ler on public.modalidades;
create policy modalidades_ler on public.modalidades for select to authenticated using (ativa = true);

-- Cria uma configuração inicial para as novas modalidades em cada grupo.
insert into public.configuracoes_agenda
  (grupo_id, modalidade, duracao_minutos, abre_as, fecha_as, dias_ativos, antecedencia_maxima_dias)
select g.id, m.id, 90, '07:00', '17:30', array[0,1,2,3,4,5,6], 14
from public.grupos g
cross join public.modalidades m
on conflict (grupo_id, modalidade) do nothing;

insert into public.horarios_agenda (grupo_id, modalidade, hora_inicio, hora_fim, ordem)
select g.id, m.id, h.inicio::time, h.fim::time, h.ordem
from public.grupos g
cross join public.modalidades m
cross join (values
  ('07:00','08:30',1), ('08:30','10:00',2), ('10:00','11:30',3),
  ('11:30','13:00',4), ('13:00','14:30',5), ('14:30','16:00',6),
  ('16:00','17:30',7)
) as h(inicio,fim,ordem)
on conflict (grupo_id, modalidade, hora_inicio) do nothing;

-- Um espaço inicial inativo por modalidade; o administrador só precisa renomear e ativar.
insert into public.quadras (grupo_id, modalidade, nome, piso, ativa, ordem)
select g.id, m.id,
  case m.id
    when 'futsal' then 'Quadra de Futsal'
    when 'futebol-campo' then 'Campo 1'
    when 'beach-tennis' then 'Arena 1'
    when 'handebol' then 'Quadra de Handebol'
    when 'volei' then 'Quadra de Vôlei'
    when 'basquete' then 'Quadra de Basquete'
  end,
  case when m.id = 'beach-tennis' then 'Areia' when m.id = 'futebol-campo' then 'Grama' else 'Piso esportivo' end,
  false, 1
from public.grupos g
cross join public.modalidades m
where m.id <> 'tenis'
on conflict (grupo_id, modalidade, nome) do nothing;

-- Mantém as validações da agenda, agora isoladas por modalidade.
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

  select classe into classe_1 from public.membros_grupo
    where grupo_id = new.grupo_id and usuario_id = new.jogador_1_id and aprovado;
  select classe into classe_2 from public.membros_grupo
    where grupo_id = new.grupo_id and usuario_id = new.jogador_2_id and aprovado;
  if classe_1 is null or classe_2 is null then
    raise exception 'Os dois participantes precisam estar aprovados e possuir classe.';
  end if;
  if classe_1 <> classe_2 or new.classe <> classe_1 then
    raise exception 'Só é permitido agendar entre participantes da mesma classe.';
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
