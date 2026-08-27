-- Primeiro acesso sem convite por e-mail
alter table public.perfis
add column if not exists precisa_trocar_senha boolean not null default false;

comment on column public.perfis.precisa_trocar_senha is
'Obriga o jogador a substituir a senha provisória no primeiro acesso.';
