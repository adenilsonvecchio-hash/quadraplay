<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1a1283ef-3137-44f6-af77-d002040f8842

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Atualização da Agenda — modelo aprovado

- Agenda com 4 quadras reais no modelo local (`court-1` a `court-4`).
- Horários de 1h30 entre 07:00 e 19:00.
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
- Ranking: tela adicionada com participação por quantidade de jogos, sem pontuação automática por vitória.

### Próxima etapa recomendada
Substituir `storageService` por um repositório Supabase mantendo as mesmas interfaces do frontend, implementar Auth real, tabelas, RLS, RPC/constraints e Realtime sem alterar o design aprovado.
