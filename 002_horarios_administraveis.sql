-- QuadraPlay+ — horários administráveis por grupo.
-- Execute depois da migração 001.

create table if not exists public.horarios_agenda (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  hora_inicio time not null,
  hora_fim time not null,
  ativo boolean not null default true,
  ordem integer not null default 1,
  criado_em timestamptz not null default now(),
  check (hora_fim > hora_inicio),
  unique (grupo_id, hora_inicio)
);

insert into public.horarios_agenda (grupo_id, hora_inicio, hora_fim, ordem)
select g.id, h.inicio::time, h.fim::time, h.ordem
from public.grupos g
cross join (values
  ('07:00','08:30',1), ('08:30','10:00',2), ('10:00','11:30',3),
  ('11:30','13:00',4), ('13:00','14:30',5), ('14:30','16:00',6),
  ('16:00','17:30',7)
) as h(inicio,fim,ordem)
on conflict (grupo_id, hora_inicio) do nothing;

-- Remove somente as duas validações antigas de horários fixos; as novas regras
-- passam a ser controladas por horarios_agenda e pelo trigger abaixo.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'public.partidas'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%90 minutes%'
        or pg_get_constraintdef(oid) ilike '%hora_inicio%07:00%')
  loop
    execute format('alter table public.partidas drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.horarios_agenda enable row level security;
drop policy if exists horarios_ler on public.horarios_agenda;
create policy horarios_ler on public.horarios_agenda for select to authenticated
using (public.no_grupo(grupo_id));
drop policy if exists horarios_admin on public.horarios_agenda;
create policy horarios_admin on public.horarios_agenda for all to authenticated
using (public.admin_do_grupo(grupo_id)) with check (public.admin_do_grupo(grupo_id));

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
    where h.grupo_id = new.grupo_id and h.ativo
      and h.hora_inicio = new.hora_inicio and h.hora_fim = new.hora_fim
  ) then raise exception 'Este horário não está cadastrado ou está desativado.';
  end if;

  if not exists (
    select 1 from public.quadras q
    where q.id = new.quadra_id and q.grupo_id = new.grupo_id and q.ativa
  ) then raise exception 'Esta quadra não está ativa para agendamentos.';
  end if;

  select classe into classe_1 from public.membros_grupo
    where grupo_id = new.grupo_id and usuario_id = new.jogador_1_id and aprovado;
  select classe into classe_2 from public.membros_grupo
    where grupo_id = new.grupo_id and usuario_id = new.jogador_2_id and aprovado;
  if classe_1 is null or classe_2 is null then
    raise exception 'Os dois jogadores precisam estar aprovados e possuir classe.';
  end if;
  if classe_1 <> classe_2 or new.classe <> classe_1 then
    raise exception 'Só é permitido agendar jogos entre jogadores da mesma classe.';
  end if;

  if exists (
    select 1 from public.bloqueios_agenda b
    where b.grupo_id = new.grupo_id and b.data = new.data
      and (b.quadra_id is null or b.quadra_id = new.quadra_id)
      and (b.dia_inteiro or (new.hora_inicio < b.hora_fim and new.hora_fim > b.hora_inicio))
  ) then raise exception 'Este horário está bloqueado pela administração do clube.';
  end if;

  if exists (
    select 1 from public.partidas p
    where p.id <> coalesce(new.id, gen_random_uuid()) and p.data = new.data
      and p.grupo_id = new.grupo_id and p.quadra_id = new.quadra_id
      and p.status in ('PENDENTE', 'ACEITA')
      and new.hora_inicio < p.hora_fim and new.hora_fim > p.hora_inicio
  ) then raise exception 'Esta quadra já possui um jogo neste horário.';
  end if;

  if exists (
    select 1 from public.partidas p
    where p.id <> coalesce(new.id, gen_random_uuid()) and p.data = new.data
      and p.grupo_id = new.grupo_id
      and p.status in ('PENDENTE', 'ACEITA')
      and new.hora_inicio < p.hora_fim and new.hora_fim > p.hora_inicio
      and (p.jogador_1_id in (new.jogador_1_id, new.jogador_2_id)
        or p.jogador_2_id in (new.jogador_1_id, new.jogador_2_id))
  ) then raise exception 'Um dos jogadores já possui jogo neste horário.';
  end if;
  return new;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.quadras;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.bloqueios_agenda;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.horarios_agenda;
exception when duplicate_object then null; end $$;
