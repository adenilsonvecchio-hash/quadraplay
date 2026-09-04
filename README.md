<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# QuadraPlay+ — versão 59 Multiesportes

Projeto de agendamento de horários do Nosso Tênis.

Esta versão preserva o fluxo da versão 57 e adiciona uma seleção de modalidade após o login. Tênis, Futsal, Futebol de Campo, Beach Tennis, Handebol, Vôlei, Basquete e Peteca usam as mesmas telas de agenda, reserva, confirmação, cancelamento, perfil e administração.

Antes de publicar a versão 58, execute no Supabase a migração `supabase/migrations/006_multiesportes.sql`. Todos os dados anteriores são preservados e classificados automaticamente como `tenis`; os espaços iniciais das novas modalidades são criados inativos para que o administrador possa revisar, renomear e liberar somente os que realmente existem.

## Como abrir

- Para desenvolver: execute `npm install` e depois `npm run dev`.
- Para publicar: execute `npm run build` e use a pasta `dist` gerada.
- Para testar a versão compilada: execute `npm run preview`.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Atualização da Agenda — modelo aprovado

- Agenda do piloto com 3 quadras; somente a Quadra 1 permanece ativa inicialmente.
- Horários oficiais de 1h30: 07:00–08:30, 08:30–10:00, 10:00–11:30, 11:30–13:00, 13:00–14:30, 14:30–16:00 e 16:00–17:30.
- Fluxo de reserva reorganizado: Data → Quadra e horário → Adversário → Confirmar.
- Clique em horário disponível na Agenda abre o fluxo já com data, quadra e horário selecionados.
- Nova reserva nasce como `pending` e ocupa o horário até o adversário responder.
- O convidado pode Aceitar ou Recusar em “Meus Jogos”.
- Aceite muda o status para `scheduled`; recusa libera o horário.
- Colisão de quadra e conflito de jogador são validados para reservas pendentes e confirmadas.
- Datas e horários passados continuam bloqueados.

> A agenda continua no serviço local durante a validação do login. A migração das partidas será feita na próxima etapa, mantendo as mesmas regras de negócio.

## Migração visual QuadraPlay — 2026-08-20

O projeto foi padronizado para o novo design aprovado: fundo branco, cartões suaves, sombras discretas, roxo/violeta como cor principal, cabeçalho unificado e navegação inferior com botão central JOGAR.

### Auditoria técnica
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS 4.
- Persistência da agenda: localStorage por `storageService.ts`, temporariamente.
- Autenticação: Supabase Auth por e-mail e senha quando as variáveis de ambiente estão configuradas.
- Perfil e grupo: carregados das tabelas `perfis` e `membros_grupo` do Supabase.
- Agenda: 3 quadras, blocos de horário, bloqueios, datas passadas e conflito de quadra já são validados localmente.
- Partidas: fluxo pendente → aceita/recusada/cancelada já existe localmente.
- Ranking: removido do produto. O QuadraPlay é somente agenda de jogos.

## Nova capa clean — 2026-08-21

- fotografia grande removida por decisão de design;
- cabeçalho azul compacto com marca QuadraPlay+ e identificação do clube;
- painel branco arredondado inspirado no modelo de referência aprovado;
- quatro acessos: Agendar horário, Ver agenda, Meus jogos e Jogadores;
- navegação inferior restrita a Início, Agenda e Perfil;
- layout mobile em uma tela, sem rolagem na capa.

## Layout responsivo para desktop

- celular preservado em uma coluna, sem mudanças no fluxo aprovado;
- desktop com área de até 1152 px e quatro acessos principais lado a lado;
- telas internas centralizadas em uma largura confortável de leitura;
- navegação inferior ampliada e alinhada ao aplicativo em monitores maiores.

## Migração Supabase — etapa 1

O arquivo `supabase/migrations/001_quadraplay_schema.sql` prepara o banco real com:

- perfis, grupos, membros, classes A–E e aprovação de jogador;
- 3 quadras configuráveis no piloto e bloqueios administrativos;
- partidas pendentes, aceitas, recusadas, canceladas ou concluídas;
- bloqueio de data/horário passado, conflito de quadra e conflito de jogador;
- RLS por grupo e permissões de jogador, administrador e proprietário;
- Realtime na agenda.

## Conexão do frontend com Supabase — etapa 2

1. Copie `.env.example` para `.env.local`.
2. No painel Supabase, abra **Connect → Framework → React → Vite**.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no `.env.local`.
4. Nunca publique a chave `service_role` no frontend.
5. Execute `npm install` e `npm run dev`.

Com as variáveis presentes, o aplicativo usa sessão persistente do Supabase, login por e-mail/senha e busca o perfil aprovado do grupo Nosso Tênis. Sem elas, o modo demonstrativo local continua disponível.

Próxima etapa: migrar a leitura e a gravação da agenda e das partidas para o Supabase.

## Gestão de agenda — versão 15

- Nova tela **Jogos** para todos os membros visualizarem os próximos jogos do grupo, com data, horário, quadra, classe, jogadores e situação.
- Painel administrativo com as três quadras do piloto e controle individual **Liberada/Bloqueada**.
- Administrador pode editar o nome e o tipo de piso de cada quadra.
- Cadastro e exclusão das faixas de horários disponíveis.
- Bloqueio por data e horário para uma quadra específica ou para todas as quadras.
- Configuração inicial: Quadra 1 liberada; Quadras 2 e 3 bloqueadas.

## Agenda conectada ao Supabase — versão 20

- O grupo do usuário autenticado é identificado em `membros_grupo`.
- Quadras e situação ativa/bloqueada são carregadas de `quadras`.
- Regras gerais são carregadas de `configuracoes_agenda`.
- Bloqueios por data, horário e quadra são carregados de `bloqueios_agenda`.
- Agenda e Jogos agendados são carregados de `partidas`, incluindo nomes dos dois jogadores.
- Alterações nas partidas são atualizadas em tempo real.
- O modo local continua disponível somente quando o Supabase não está configurado.

## Confirmação de reserva no Supabase — versão 23

- O fluxo de reserva carrega adversários aprovados da mesma classe em `membros_grupo` e `perfis`.
- Somente quadras ativas do grupo podem ser escolhidas.
- A disponibilidade é conferida novamente no banco antes da confirmação.
- **Confirmar reserva** insere uma nova partida com status `PENDENTE` em `partidas`.
- As validações do banco impedem horário duplicado, jogador ocupado, quadra bloqueada, data passada e classes diferentes.
- Após a confirmação, o aplicativo abre **Jogos agendados**, onde a nova partida aparece em tempo real.

### Correção da lista de adversários — versão 26

- A busca dos membros aprovados e de seus perfis foi separada para não depender do nome interno da relação do Supabase.
- A etapa **Adversário** agora informa quando está carregando e quando ainda não existe outro jogador aprovado na mesma classe.
- O adversário selecionado permanece visível no resumo e seu ID é gravado em `jogador_2_id` ao confirmar a reserva.

### Resposta ao convite em Jogos agendados — versão 27

- O jogador convidado visualiza **Aceitar** e **Recusar** diretamente no cartão da partida pendente.
- Ao aceitar, o status muda imediatamente de **Aguardando** para **Confirmado**.
- Os botões aparecem somente para o jogador 2 da partida e desaparecem após a resposta.

### Compatibilidade de identificação do convidado — versão 28

- A interface identifica o convite pendente pelo criador da partida, evitando falha visual em bancos migrados.
- O selo **Convite para você** acompanha os botões **Aceitar** e **Recusar**.
- A segurança do Supabase permanece responsável por autorizar a resposta somente ao `jogador_2_id`.

### Contadores do Perfil Esportivo — versão 29

- **Jogos**, **Próximos** e **Realizados** são calculados com as partidas reais do usuário no Supabase.
- Partidas canceladas ou recusadas não entram nos números do perfil.
- Partidas futuras pendentes ou confirmadas entram em **Próximos**; concluídas ou já transcorridas entram em **Realizados**.
- Os contadores são atualizados em tempo real quando uma partida muda de status.

### Perfil final sem recursos de demonstração — versão 30

- Removidos **Alternar jogador**, **Estrutura Supabase** e **Restaurar dados de demonstração**.
- O perfil mantém somente os dados reais, os contadores esportivos, a Administração para usuários autorizados e **Sair da conta**.

### Notificações reais — versão 31

- Removido o número fixo do sino; o contador agora representa convites pendentes recebidos.
- O painel do sino mostra convites, confirmações, cancelamentos e partidas realizadas do usuário.
- As notificações acompanham as alterações de `partidas` em tempo real.
- Na tela inicial, o sino direciona o usuário para seus jogos e só exibe o ponto quando há convite pendente.

### Painel de notificações na tela inicial — versão 32

- O sino da tela inicial abre o painel sobre a própria página, sem navegar nem ocultar o conteúdo.
- O painel pode ser fechado pelo sino ou pelo botão **X**.
- Ao selecionar uma notificação, o aplicativo abre **Meus jogos**.

### Restauração da navegação estável — versão 33

- Removida a consulta de notificações do cabeçalho compartilhado para impedir falhas simultâneas nas páginas.
- Agenda, Meus jogos, Jogadores, Jogos agendados e Perfil voltam a funcionar sem depender do sino.
- O sino permanece visível, sem contador fixo e temporariamente sem ação.

## Aceite, recusa e cancelamento — versão 24

- **Meus jogos** carrega as partidas do usuário diretamente do Supabase.
- Somente o jogador convidado pode aceitar ou recusar um convite pendente.
- Aceitar altera o status para `ACEITA` e mantém o horário ocupado.
- Recusar altera o status para `RECUSADA` e libera o horário da quadra.
- Jogadores envolvidos e administradores podem cancelar partidas pendentes ou aceitas conforme as políticas RLS.
- Cancelamentos registram responsável, motivo e data.
- Todas as mudanças são refletidas em tempo real na Agenda e em Jogos agendados.

## Administração conectada ao Supabase — versão 25

- O painel administrativo carrega as quadras, partidas, bloqueios e configurações reais do grupo.
- O administrador pode renomear cada quadra, alterar o piso e liberá-la ou bloqueá-la.
- Os horários oficiais podem ser adicionados, editados e removidos pelo painel.
- Bloqueios de dia inteiro ou de uma faixa de horário podem ser aplicados a uma quadra ou a todas.
- A migração `002_horarios_administraveis.sql` cria os horários por grupo e atualiza as validações das reservas.
- O banco impede reserva fora dos horários cadastrados, em quadra bloqueada, sobre outro jogo ou com jogador ocupado.

## Correção conjunta das páginas de dados — pacote versão 27

- A leitura das partidas não depende mais dos nomes internos das relações geradas pelo Supabase.
- Partidas, perfis dos dois jogadores e quadras são carregados em consultas separadas e combinados no aplicativo.
- Agenda, Jogos agendados, Meus jogos, Perfil, Administração e notificações passam a compartilhar a leitura compatível.
- A criação de uma nova reserva também devolve corretamente os nomes do adversário e da quadra.

## Proteção contra convites vencidos — pacote versão 28

- Jogos pendentes ou confirmados cujo horário já começou deixam de aparecer em **Jogos agendados**.
- Convites vencidos não exibem mais os botões **Aceitar** e **Recusar**.
- O histórico do jogador continua preservado em **Meus jogos**.

## Quadra transparente na tela inicial — pacote versão 29

- Adicionada uma quadra de tênis vetorial e transparente ao fundo da área principal da tela inicial.
- A marca-d'água fica mais visível no espaço vazio do desktop e mais suave no celular.
- Textos, botões e cartões permanecem acima da imagem, com leitura e cliques preservados.

## Restauração de Meus jogos — pacote versão 30

- A organização de Próximos, Histórico e Cancelados foi blindada contra registros antigos ou incompletos.
- Campos ausentes de partidas recebem valores seguros sem derrubar a página.
- O modal interno de cancelamento permanece conectado às partidas reais do Supabase.

## Reconstrução de Meus jogos e Administração — pacote versão 31

- **Meus jogos** foi reconstruído com carregamento isolado, listas normalizadas e assinatura em tempo real protegida.
- O Painel administrativo não acessa mais configurações antigas do navegador durante a abertura.
- Jogadores aprovados, partidas, quadras, bloqueios e configurações administrativas são carregados do Supabase.
- O Painel administrativo passa a ter proteção visual contra qualquer falha inesperada.

## Leitura resiliente do banco — pacote versão 32

- **Meus jogos** consulta diretamente as partidas em que o usuário autenticado é jogador 1 ou jogador 2.
- Falhas auxiliares ao buscar nomes de jogadores ou quadras não escondem mais as partidas.
- O Perfil usa a mesma consulta individual para manter seus contadores consistentes.
- A Administração carrega jogadores, partidas, bloqueios, configurações e quadras de forma independente.
- Se uma seção do Supabase falhar, as demais continuam visíveis e o painel informa o problema sem ficar em branco.

## Navegação interna restaurada — pacote versão 33

- Agenda, Jogos agendados, Perfil e Administração possuem proteções de erro independentes.
- Uma falha isolada não é mais carregada para as outras páginas ao trocar de aba.
- Dados antigos ou incompletos de perfil, partida e data recebem valores seguros durante a leitura.
- O painel administrativo volta a ser montado normalmente depois de navegar pelo Perfil.

## Correção das telas internas — pacote versão 34

- O sino e cada página usam canais Realtime exclusivos no Supabase.
- Eliminado o conflito de inscrição duplicada que derrubava Agenda, Jogos agendados, Perfil e Administração.
- Falhas do Realtime passam a ser isoladas e não interrompem a renderização das telas.
- O sino consulta somente as partidas do usuário autenticado.

## Identificação de publicação — pacote versão 35

- A marca `v35` aparece ao lado da logomarca nas páginas internas e no topo da tela inicial.
- A identificação permite confirmar visualmente que a publicação nova substituiu o pacote antigo.
- Mantidas integralmente as correções de isolamento das telas e dos canais Realtime da versão 34.

## Gestão real de jogadores — pacote versão 36

- Novo jogador adiciona ao grupo uma conta já existente no Supabase pelo e-mail.
- Editar atualiza nome, telefone, classe e permissão administrativa.
- Excluir remove somente a participação no grupo, preservando a conta de autenticação.
- O administrador não pode remover a própria conta nem retirar a própria permissão.
- A migração `003_gestao_jogadores_admin.sql` instala as funções protegidas necessárias.

## Contador de cancelamentos no Perfil — pacote versão 37

- Adicionado o indicador **Cancelados** ao Perfil Esportivo.
- Partidas canceladas continuam fora dos totais de jogos válidos, próximos e realizados.
- O contador funciona tanto com Supabase quanto no modo local.

## Motivo e responsável pelo cancelamento — pacote versão 38

- A Agenda administrativa carrega o nome de quem cancelou a partida.
- O motivo informado pelo jogador ou administrador é exibido no histórico.
- Removido o texto incompleto `(por )` quando o responsável não estiver disponível.

## Convites vencidos fora das notificações — pacote versão 39

- Convites com data ou horário já encerrados não aparecem como novas notificações.
- O contador vermelho considera somente convites pendentes e ainda válidos.
- Confirmações futuras e cancelamentos continuam visíveis no painel do sino.

## Recuperação de senha — pacote versão 40

- A tela de entrada possui a opção **Esqueci minha senha**.
- O Supabase envia um link seguro para o e-mail informado.
- O link abre uma tela própria do QuadraPlay para cadastrar e confirmar a nova senha.
- Após a alteração, o jogador retorna ao login e entra com a nova senha.

## Primeiro acesso por convite — pacote versão 41

- O QuadraPlay identifica o link de convite antes que o Supabase remova seus parâmetros da URL.
- O convidado abre uma tela própria para criar e confirmar sua primeira senha.
- O fluxo de convite permanece separado da recuperação de senha e mostra textos adequados para cada caso.
- A etapa de criação da senha continua ativa mesmo se o convidado atualizar a página acidentalmente.

## Convite e aprovação em uma única etapa — pacote versão 42

- O botão **Novo Jogador** cria e confirma a conta no Supabase sem enviar e-mail, exibe uma senha provisória ao administrador e exige que o atleta crie uma senha pessoal no primeiro acesso.
- Se a conta já existir, ela é apenas vinculada ao grupo, sem duplicação e sem novo convite.
- A operação é executada pela Edge Function protegida `admin-invite-player`; a chave administrativa nunca é enviada ao navegador.
- O administrador recebe uma confirmação diferente para convite enviado ou conta existente vinculada.

### Publicação obrigatória da função da versão 42

Na pasta extraída do projeto, entre na conta do Supabase e publique a função:

```bash
npx supabase login
npx supabase functions deploy admin-invite-player --project-ref vewnjcjkowpiyebzfzyv
```

O Supabase fornece automaticamente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` à função. O endereço padrão dos convites é `https://quadraplay.centercalculos.com.br`. Opcionalmente, ele pode ser substituído por um secret chamado `QUADRAPLAY_SITE_URL`.

Depois da publicação, abra **Supabase → Edge Functions** e confirme que `admin-invite-player` aparece como ativa. Em seguida, publique normalmente a versão 42 na Vercel. Sem esta função, o botão **Convidar e salvar** exibirá uma orientação de configuração e não criará contas incompletas.
