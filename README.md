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

- Agenda com 4 quadras reais no modelo local (`court-1` a `court-4`).
- Horários oficiais de 1h30: 07:00–08:30, 08:30–10:00, 10:00–11:30, 11:30–13:00, 13:00–14:30, 14:30–16:00 e 16:00–17:30.
- Fluxo de reserva reorganizado: Data → Quadra e horário → Adversário → Confirmar.
- Clique em horário disponível na Agenda abre o fluxo já com data, quadra e horário selecionados.
- Nova reserva nasce como `pending` e ocupa o horário até o adversário responder.
- O convidado pode Aceitar ou Recusar em “Meus Jogos”.
- Aceite muda o status para `scheduled`; recusa libera o horário.
- Colisão de quadra e conflito de jogador são validados para reservas pendentes e confirmadas.
- Datas e horários passados continuam bloqueados.

> Nesta etapa os dados ainda estão no serviço local do projeto. A conexão definitiva com Supabase deve ser feita na etapa seguinte, mantendo as mesmas regras de negócio.

## Migração visual QuadraPlay — 2026-08-20

O projeto foi padronizado para o novo design aprovado: fundo branco, cartões suaves, sombras discretas, roxo/violeta como cor principal, cabeçalho unificado e navegação inferior com botão central JOGAR.

### Auditoria técnica
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS 4.
- Persistência atual: localStorage por `storageService.ts`.
- Autenticação atual: simulação local por e-mail; ainda não usa Supabase Auth real.
- Banco real: ainda não conectado ao runtime. Existe apenas um schema SQL de referência em `initialData.ts`.
- Agenda: 4 quadras, blocos de horário, bloqueios, datas passadas e conflito de quadra já são validados localmente.
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
- 4 quadras configuráveis e bloqueios administrativos;
- partidas pendentes, aceitas, recusadas, canceladas ou concluídas;
- bloqueio de data/horário passado, conflito de quadra e conflito de jogador;
- RLS por grupo e permissões de jogador, administrador e proprietário;
- Realtime na agenda.

Próxima etapa: adicionar o cliente Supabase ao frontend e trocar gradualmente o `storageService`, mantendo as interfaces visuais existentes.
