-- QuadraPlay+ — generalização para qualquer esporte de quadra + criação de grupo self-service.
-- Execute depois das migrações 001, 002 e 003.
-- Compatível com dados existentes (tênis do Tangará): nada é apagado, tudo é migrado.

-- 1) Catálogo de esportes ---------------------------------------------------

create table if not exists public.esportes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  icone text not null default 'circle',        -- nome do ícone (lucide-react) usado na UI
  jogadores_por_partida integer not null default 2 check (jogadores_por_partida between 2 and 30),
  duracao_padrao_minutos integer not null default 60 check (duracao_padrao_minutos between 15 and 240),
  usa_nivel boolean not null default true,      -- se o esporte usa classificação de nível (A-E, 1-7 etc.)
  ativo boolean not null default true,
  ordem integer not null default 1
);

insert into public.esportes (slug, nome, icone, jogadores_por_partida, duracao_padrao_minutos, ordem) values
  ('tenis',        'Tênis',            'circle-dot',   2, 90, 1),
  ('padel',        'Padel',            'square',       4, 90, 2),
  ('beach-tennis', 'Beach Tennis',     'sun',          4, 60, 3),
  ('squash',       'Squash',           'square-dot',   2, 45, 4),
  ('badminton',    'Badminton',        'feather',      4, 60, 5),
  ('futevolei',    'Futevôlei',        'circle',       4, 60, 6),
  ('volei-praia',  'Vôlei de Praia',   'volleyball',   4, 60, 7),
  ('volei',        'Vôlei',            'volleyball',  12, 60, 8),
  ('basquete',     'Basquete',         'circle',      10, 60, 9),
  ('futsal',       'Futsal',           'circle',      10, 60, 10),
  ('outro',        'Outro esporte',    'square',       2, 60, 99)
on conflict (slug) do nothing;

alter table public.esportes enable row level security;
drop policy if exists esportes_ler on public.esportes;
create policy esportes_ler on public.esportes for select to authenticated using (true);

-- 2) Cada grupo escolhe quais esportes oferece -------------------------------

create table if not exists public.grupo_esportes (
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  esporte_id uuid not null references public.esportes(id),
  ativo boolean not null default true,
  primary key (grupo_id, esporte_id)
);

-- Backfill: todo grupo existente hoje é um grupo de tênis.
insert into public.grupo_esportes (grupo_id, esporte_id)
select g.id, e.id from public.grupos g, public.esportes e where e.slug = 'tenis'
on conflict do nothing;

alter table public.grupo_esportes enable row level security;
drop policy if exists grupo_esportes_ler on public.grupo_esportes;
create policy grupo_esportes_ler on public.grupo_esportes for select to authenticated
using (public.no_grupo(grupo_id));
drop policy if exists grupo_esportes_admin on public.grupo_esportes;
create policy grupo_esportes_admin on public.grupo_esportes for all to authenticated
using (public.admin_do_grupo(grupo_id)) with check (public.admin_do_grupo(grupo_id));

-- 3) Quadra passa a pertencer a um esporte -----------------------------------

alter table public.quadras add column if not exists esporte_id uuid references public.esportes(id);

update public.quadras q
set esporte_id = (select id from public.esportes where slug = 'tenis')
where q.esporte_id is null;

alter table public.quadras alter column esporte_id set not null;

-- 4) "Classe" vira "nível" genérico (texto livre, não só A-E) ----------------

alter table public.membros_grupo rename column classe to nivel;
alter table public.membros_grupo alter column nivel drop not null;
alter table public.membros_grupo drop constraint if exists membros_grupo_classe_check;
alter table public.membros_grupo add constraint membros_grupo_nivel_check check (nivel is null or char_length(nivel) between 1 and 20);

alter table public.partidas rename column classe to nivel;
alter table public.partidas drop constraint if exists partidas_classe_check;
alter table public.partidas add constraint partidas_nivel_check check (nivel is null or char_length(nivel) between 1 and 20);

alter table public.partidas add column if not exists esporte_id uuid references public.esportes(id);
update public.partidas p set esporte_id = (select id from public.esportes where slug = 'tenis') where esporte_id is null;
alter table public.partidas alter column esporte_id set not null;

-- 5) Trigger de validação: nível só precisa bater quando o esporte usa nível --

create or replace function public.validar_partida()
returns trigger language plpgsql set search_path = public as $$
declare
  nivel_1 text;
  nivel_2 text;
  esporte_usa_nivel boolean;
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
      and q.esporte_id = new.esporte_id
  ) then raise exception 'Esta quadra não está ativa para este esporte.';
  end if;

  select usa_nivel into esporte_usa_nivel from public.esportes where id = new.esporte_id;

  select nivel into nivel_1 from public.membros_grupo
    where grupo_id = new.grupo_id and usuario_id = new.jogador_1_id and aprovado;
  select nivel into nivel_2 from public.membros_grupo
    where grupo_id = new.grupo_id and usuario_id = new.jogador_2_id and aprovado;

  if nivel_1 is null or nivel_2 is null then
    if esporte_usa_nivel then
      raise exception 'Os dois jogadores precisam estar aprovados e possuir nível cadastrado.';
    end if;
  elsif esporte_usa_nivel and (nivel_1 <> nivel_2 or new.nivel <> nivel_1) then
    raise exception 'Só é permitido agendar jogos entre jogadores do mesmo nível.';
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
create trigger validar_partida_trigger before insert or update of data, hora_inicio, hora_fim, quadra_id, jogador_1_id, jogador_2_id, nivel, esporte_id
on public.partidas for each row execute function public.validar_partida();

-- 6) Criação de grupo self-service (clube, academia, condomínio, grupo de amigos) --

create or replace function public.criar_grupo(
  p_nome text,
  p_clube_nome text,
  p_esporte_slugs text[] default array['tenis']
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo_id uuid;
  v_codigo text;
  v_quadra_padrao_nome text;
  v_esporte record;
begin
  if trim(coalesce(p_nome, '')) = '' then
    raise exception 'Informe um nome para o grupo.';
  end if;
  if array_length(p_esporte_slugs, 1) is null then
    raise exception 'Escolha ao menos um esporte.';
  end if;

  v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.grupos (nome, clube_nome, codigo_convite, criado_por)
  values (trim(p_nome), trim(coalesce(p_clube_nome, p_nome)), v_codigo, auth.uid())
  returning id into v_grupo_id;

  insert into public.membros_grupo (grupo_id, usuario_id, perfil, aprovado)
  values (v_grupo_id, auth.uid(), 'PROPRIETARIO', true);

  insert into public.configuracoes_agenda (grupo_id) values (v_grupo_id);

  insert into public.horarios_agenda (grupo_id, hora_inicio, hora_fim, ordem)
  select v_grupo_id, h.inicio::time, h.fim::time, h.ordem
  from (values
    ('07:00','08:00',1), ('08:00','09:00',2), ('09:00','10:00',3), ('10:00','11:00',4),
    ('11:00','12:00',5), ('14:00','15:00',6), ('15:00','16:00',7), ('16:00','17:00',8),
    ('17:00','18:00',9), ('18:00','19:00',10), ('19:00','20:00',11), ('20:00','21:00',12)
  ) as h(inicio, fim, ordem);

  for v_esporte in
    select id, nome from public.esportes where slug = any(p_esporte_slugs) and ativo
  loop
    insert into public.grupo_esportes (grupo_id, esporte_id) values (v_grupo_id, v_esporte.id)
    on conflict do nothing;

    v_quadra_padrao_nome := 'Quadra 1 — ' || v_esporte.nome;
    insert into public.quadras (grupo_id, nome, esporte_id, ordem)
    values (v_grupo_id, v_quadra_padrao_nome, v_esporte.id, 1);
  end loop;

  return v_grupo_id;
end;
$$;

revoke all on function public.criar_grupo(text, text, text[]) from public;
grant execute on function public.criar_grupo(text, text, text[]) to authenticated;

-- 7) Entrar em um grupo existente por código de convite -----------------------

create or replace function public.entrar_no_grupo(p_codigo_convite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo_id uuid;
begin
  select id into v_grupo_id from public.grupos where upper(codigo_convite) = upper(trim(p_codigo_convite));
  if v_grupo_id is null then
    raise exception 'Código de convite inválido.';
  end if;

  insert into public.membros_grupo (grupo_id, usuario_id, perfil, aprovado)
  values (v_grupo_id, auth.uid(), 'JOGADOR', false)
  on conflict (grupo_id, usuario_id) do nothing;

  return v_grupo_id;
end;
$$;

revoke all on function public.entrar_no_grupo(text) from public;
grant execute on function public.entrar_no_grupo(text) to authenticated;

-- 8) Funções de gestão de jogadores: nível livre em vez de A-E fixo -----------

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
  if p_classe is not null and char_length(trim(p_classe)) > 20 then
    raise exception 'Nível inválido.';
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

  insert into public.membros_grupo (grupo_id, usuario_id, perfil, nivel, aprovado)
  values (p_grupo_id, v_usuario_id, p_perfil::public.perfil_usuario, nullif(trim(coalesce(p_classe, '')), ''), true)
  on conflict (grupo_id, usuario_id) do update
    set perfil = excluded.perfil, nivel = excluded.nivel, aprovado = true;

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
  if p_classe is not null and char_length(trim(p_classe)) > 20 then
    raise exception 'Nível inválido.';
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
  set nivel = nullif(trim(coalesce(p_classe, '')), ''),
      perfil = case when perfil = 'PROPRIETARIO' then perfil else p_perfil::public.perfil_usuario end,
      aprovado = true
  where grupo_id = p_grupo_id and usuario_id = p_usuario_id;
end;
$$;

-- fim da migração 004
