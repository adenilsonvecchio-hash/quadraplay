-- QuadraPlay+ v59 — adiciona Peteca à estrutura multiesportes.
-- Execute depois da migração 006_multiesportes.sql.

insert into public.modalidades (id, nome, ordem, ativa)
values ('peteca', 'Peteca', 8, true)
on conflict (id) do update set nome = excluded.nome, ordem = excluded.ordem, ativa = true;

insert into public.configuracoes_agenda
  (grupo_id, modalidade, duracao_minutos, abre_as, fecha_as, dias_ativos, antecedencia_maxima_dias)
select g.id, 'peteca', 90, '07:00', '17:30', array[0,1,2,3,4,5,6], 14
from public.grupos g
on conflict (grupo_id, modalidade) do nothing;

insert into public.horarios_agenda (grupo_id, modalidade, hora_inicio, hora_fim, ordem)
select g.id, 'peteca', h.inicio::time, h.fim::time, h.ordem
from public.grupos g
cross join (values
  ('07:00','08:30',1), ('08:30','10:00',2), ('10:00','11:30',3),
  ('11:30','13:00',4), ('13:00','14:30',5), ('14:30','16:00',6),
  ('16:00','17:30',7)
) as h(inicio,fim,ordem)
on conflict (grupo_id, modalidade, hora_inicio) do nothing;

insert into public.quadras (grupo_id, modalidade, nome, piso, ativa, ordem)
select g.id, 'peteca', 'Quadra de Peteca', 'Piso esportivo', false, 1
from public.grupos g
on conflict (grupo_id, modalidade, nome) do nothing;
