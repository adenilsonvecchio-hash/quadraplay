-- Versão 88: placar, ocorrências e confirmação do resultado pelo adversário.
alter table public.partidas
  add column if not exists resultado_tipo text,
  add column if not exists resultado_placar jsonb,
  add column if not exists resultado_status text,
  add column if not exists resultado_enviado_por uuid references public.perfis(id),
  add column if not exists resultado_enviado_em timestamptz,
  add column if not exists resultado_confirmado_por uuid references public.perfis(id),
  add column if not exists resultado_confirmado_em timestamptz,
  add column if not exists resultado_contestacao text;

do $$ begin
  alter table public.partidas add constraint partidas_resultado_tipo_check check (
    resultado_tipo is null or resultado_tipo in (
      'played', 'not_played', 'walkover_player1', 'walkover_player2',
      'double_walkover', 'retirement_player1', 'retirement_player2',
      'interrupted', 'reschedule'
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.partidas add constraint partidas_resultado_status_check check (
    resultado_status is null or resultado_status in ('pending_confirmation', 'confirmed', 'disputed')
  );
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.partidas add constraint partidas_resultado_autores_check check (
    (resultado_enviado_por is null or resultado_enviado_por in (jogador_1_id, jogador_2_id))
    and (resultado_confirmado_por is null or (
      resultado_confirmado_por in (jogador_1_id, jogador_2_id)
      and resultado_confirmado_por is distinct from resultado_enviado_por
    ))
  );
exception when duplicate_object then null; end $$;

comment on column public.partidas.resultado_placar is
  'Array JSON com o placar de cada set; para outros esportes, usa um único item.';
