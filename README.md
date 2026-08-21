<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# QuadraPlay

Projeto mobile de agendamento de jogos do Tangará Country Clube.

## Como abrir

- Para desenvolver: execute `npm install` e depois `npm run dev`.
- Para publicar: use a pasta `dist`, já compilada e validada.
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
