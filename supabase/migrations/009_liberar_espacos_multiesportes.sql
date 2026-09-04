-- QuadraPlay+ v65 — libera os espaços iniciais das modalidades.
-- Execute depois das migrações 006 e 007.

update public.quadras
set ativa = true
where modalidade in (
  'futsal',
  'futebol-campo',
  'beach-tennis',
  'handebol',
  'volei',
  'basquete',
  'peteca'
);

-- Confirma os espaços liberados. O resultado deve mostrar uma linha por modalidade.
select modalidade, nome, piso, ativa
from public.quadras
where modalidade <> 'tenis'
order by modalidade, ordem;
