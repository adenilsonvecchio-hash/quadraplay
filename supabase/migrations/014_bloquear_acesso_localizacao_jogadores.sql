-- Versão 114: garante que a localização de check-in NUNCA fique acessível a
-- jogadores, mesmo por fora do app (ex: alguém chamando a API do Supabase
-- diretamente pelo navegador).
--
-- Hoje a política "partidas_ler" permite que qualquer jogador do grupo leia a
-- linha inteira da partida, e "partidas_responder" permite que os dois
-- jogadores da partida façam UPDATE na linha inteira. Isso inclui, por
-- padrão, as colunas de latitude/longitude — mesmo que o app não peça essas
-- colunas na tela, a permissão no banco existia.
--
-- A trava abaixo é a nível de COLUNA: revoga leitura e escrita dessas 4
-- colunas para os papéis authenticated/anon, independente da política de
-- linha. As funções confirmar_presenca_jogamos() e obter_localizacao_partida()
-- continuam funcionando normalmente, porque rodam como SECURITY DEFINER —
-- ou seja, com o privilégio de quem criou a função, não do jogador logado —
-- e por dentro delas é que fica a checagem "só admin pode ver".

revoke select (
  checagem_jogador_1_lat, checagem_jogador_1_lng,
  checagem_jogador_2_lat, checagem_jogador_2_lng
) on public.partidas from authenticated, anon;

revoke update (
  checagem_jogador_1_em, checagem_jogador_1_lat, checagem_jogador_1_lng,
  checagem_jogador_2_em, checagem_jogador_2_lat, checagem_jogador_2_lng
) on public.partidas from authenticated, anon;

comment on function public.obter_localizacao_partida(uuid) is
  'Única forma de ler a localização do check-in. Verifica admin_do_grupo() antes de retornar qualquer coordenada. Jogadores não têm acesso a essas colunas nem pela API nem pelo app.';

comment on function public.confirmar_presenca_jogamos(uuid, double precision, double precision) is
  'Única forma de gravar a localização do check-in. Cada jogador só grava a própria coordenada; a coluna do adversário nunca é exposta de volta para o cliente.';
