-- QuadraPlay+ — banco inicial para o Nosso Tênis
-- Execute no SQL Editor do Supabase em um projeto novo.

create extension if not exists pgcrypto;

do $$ begin
  create type public.perfil_usuario as enum ('JOGADOR', 'ADMINISTRADOR', 'PROPRIETARIO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_partida as enum ('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA');
exception when duplicate_object then null; end $$;

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  clube_nome text not null,
  codigo_convite text not null unique,
  criado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  avatar_url text,
  criado_em timestamptz not null default now()
);

create table if not exists public.membros_grupo (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  perfil public.perfil_usuario not null default 'JOGADOR',
  classe text check (classe in ('A', 'B', 'C', 'D', 'E')),
  aprovado boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (grupo_id, usuario_id)
);

create table if not exists public.quadras (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  nome text not null,
  piso text not null default 'Saibro',
  ativa boolean not null default true,
  ordem integer not null default 1,
  criado_em timestamptz not null default now(),
  unique (grupo_id, nome)
);

create table if not exists public.configuracoes_agenda (
  grupo_id uuid primary key references public.grupos(id) on delete cascade,
  duracao_minutos integer not null default 90 check (duracao_minutos between 30 and 240),
  abre_as time not null default '07:00',
  fecha_as time not null default '17:30',
  dias_ativos smallint[] not null default array[0,1,2,3,4,5,6],
  antecedencia_maxima_dias integer not null default 14 check (antecedencia_maxima_dias between 1 and 365),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.bloqueios_agenda (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  quadra_id uuid references public.quadras(id) on delete cascade,
  data date not null,
  hora_inicio time,
  hora_fim time,
  dia_inteiro boolean not null default false,
  motivo text not null,
  criado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now(),
  check (dia_inteiro or (hora_inicio is not null and hora_fim is not null and hora_fim > hora_inicio))
);

create table if not exists public.partidas (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  quadra_id uuid not null references public.quadras(id),
  jogador_1_id uuid not null references public.perfis(id),
  jogador_2_id uuid not null references public.perfis(id),
  classe text not null check (classe in ('A', 'B', 'C', 'D', 'E')),
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  status public.status_partida not null default 'PENDENTE',
  cancelado_por uuid references public.perfis(id),
  motivo_cancelamento text,
  cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  check (jogador_1_id <> jogador_2_id),
  check (hora_fim > hora_inicio),
  check (hora_fim = hora_inicio + interval '90 minutes'),
  check (hora_inicio in ('07:00','08:30','10:00','11:30','13:00','14:30','16:00'))
);

create unique index if not exists partidas_quadra_horario_ativo_uidx
  on public.partidas (quadra_id, data, hora_inicio)
  where status in ('PENDENTE', 'ACEITA');

create index if not exists partidas_jogador_1_idx on public.partidas (jogador_1_id, data);
create index if not exists partidas_jogador_2_idx on public.partidas (jogador_2_id, data);
create index if not exists partidas_agenda_idx on public.partidas (grupo_id, data, quadra_id);

create or replace function public.no_grupo(p_grupo_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.membros_grupo
  where grupo_id = p_grupo_id and usuario_id = auth.uid() and aprovado
) $$;

create or replace function public.admin_do_grupo(p_grupo_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.membros_grupo
  where grupo_id = p_grupo_id and usuario_id = auth.uid() and aprovado
    and perfil in ('ADMINISTRADOR', 'PROPRIETARIO')
) $$;

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

  if new.hora_fim <> new.hora_inicio + interval '90 minutes'
     or new.hora_inicio not in ('07:00','08:30','10:00','11:30','13:00','14:30','16:00') then
    raise exception 'Horário inválido. Utilize um dos sete períodos oficiais de 1h30.';
  end if;

  if not exists (
    select 1 from public.quadras q
    where q.id = new.quadra_id and q.grupo_id = new.grupo_id and q.ativa
  ) then
    raise exception 'Esta quadra não está ativa para agendamentos.';
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
      and p.status in ('PENDENTE', 'ACEITA')
      and new.hora_inicio < p.hora_fim and new.hora_fim > p.hora_inicio
      and (p.jogador_1_id in (new.jogador_1_id, new.jogador_2_id)
        or p.jogador_2_id in (new.jogador_1_id, new.jogador_2_id))
  ) then raise exception 'Um dos jogadores já possui jogo neste horário.';
  end if;

  return new;
end $$;

drop trigger if exists validar_partida_trigger on public.partidas;
create trigger validar_partida_trigger before insert or update of data, hora_inicio, hora_fim, quadra_id, jogador_1_id, jogador_2_id, classe
on public.partidas for each row execute function public.validar_partida();

create or replace function public.criar_perfil_ao_cadastrar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists auth_usuario_criado on auth.users;
create trigger auth_usuario_criado after insert on auth.users
for each row execute function public.criar_perfil_ao_cadastrar();

alter table public.grupos enable row level security;
alter table public.perfis enable row level security;
alter table public.membros_grupo enable row level security;
alter table public.quadras enable row level security;
alter table public.configuracoes_agenda enable row level security;
alter table public.bloqueios_agenda enable row level security;
alter table public.partidas enable row level security;

drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis for select to authenticated
using (id = auth.uid() or exists (
  select 1 from public.membros_grupo meu join public.membros_grupo outro on outro.grupo_id = meu.grupo_id
  where meu.usuario_id = auth.uid() and meu.aprovado and outro.usuario_id = perfis.id and outro.aprovado
));
drop policy if exists perfil_proprio_atualizar on public.perfis;
create policy perfil_proprio_atualizar on public.perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists grupos_ler on public.grupos;
create policy grupos_ler on public.grupos for select to authenticated using (public.no_grupo(id) or criado_por = auth.uid());
drop policy if exists grupos_criar on public.grupos;
create policy grupos_criar on public.grupos for insert to authenticated with check (criado_por = auth.uid());
drop policy if exists grupos_admin_atualizar on public.grupos;
create policy grupos_admin_atualizar on public.grupos for update to authenticated using (public.admin_do_grupo(id));

drop policy if exists membros_ler on public.membros_grupo;
create policy membros_ler on public.membros_grupo for select to authenticated using (public.no_grupo(grupo_id) or usuario_id = auth.uid());
drop policy if exists membro_solicitar_entrada on public.membros_grupo;
create policy membro_solicitar_entrada on public.membros_grupo for insert to authenticated with check (usuario_id = auth.uid());
drop policy if exists membros_admin_atualizar on public.membros_grupo;
create policy membros_admin_atualizar on public.membros_grupo for update to authenticated using (public.admin_do_grupo(grupo_id));
drop policy if exists membros_admin_excluir on public.membros_grupo;
create policy membros_admin_excluir on public.membros_grupo for delete to authenticated using (public.admin_do_grupo(grupo_id));

drop policy if exists quadras_ler on public.quadras;
create policy quadras_ler on public.quadras for select to authenticated using (public.no_grupo(grupo_id));
drop policy if exists quadras_admin on public.quadras;
create policy quadras_admin on public.quadras for all to authenticated using (public.admin_do_grupo(grupo_id)) with check (public.admin_do_grupo(grupo_id));

drop policy if exists configuracao_ler on public.configuracoes_agenda;
create policy configuracao_ler on public.configuracoes_agenda for select to authenticated using (public.no_grupo(grupo_id));
drop policy if exists configuracao_admin on public.configuracoes_agenda;
create policy configuracao_admin on public.configuracoes_agenda for all to authenticated using (public.admin_do_grupo(grupo_id)) with check (public.admin_do_grupo(grupo_id));

drop policy if exists bloqueios_ler on public.bloqueios_agenda;
create policy bloqueios_ler on public.bloqueios_agenda for select to authenticated using (public.no_grupo(grupo_id));
drop policy if exists bloqueios_admin on public.bloqueios_agenda;
create policy bloqueios_admin on public.bloqueios_agenda for all to authenticated using (public.admin_do_grupo(grupo_id)) with check (public.admin_do_grupo(grupo_id));

drop policy if exists partidas_ler on public.partidas;
create policy partidas_ler on public.partidas for select to authenticated using (public.no_grupo(grupo_id));
drop policy if exists partidas_criar on public.partidas;
create policy partidas_criar on public.partidas for insert to authenticated with check (jogador_1_id = auth.uid() and public.no_grupo(grupo_id));
drop policy if exists partidas_responder on public.partidas;
create policy partidas_responder on public.partidas for update to authenticated
using (jogador_1_id = auth.uid() or jogador_2_id = auth.uid() or public.admin_do_grupo(grupo_id));

grant execute on function public.no_grupo(uuid) to authenticated;
grant execute on function public.admin_do_grupo(uuid) to authenticated;

-- Realtime para agenda e convites.
do $$ begin
  alter publication supabase_realtime add table public.partidas;
exception when duplicate_object then null; end $$;
