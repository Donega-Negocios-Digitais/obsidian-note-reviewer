# Planning Documentation Index

Este diretório concentra documentos de planejamento, setup e operação do projeto.

## Start Here

1. `SETUP.md` - setup local passo a passo
2. `ENVIRONMENT.md` - padrão oficial de variáveis e política de segredos
3. `PROJECT.md` - visão geral, status e prioridades

## Core Planning

- `REQUIREMENTS.md` - requisitos v1/v2 e traceability
- `ROADMAP.md` - fases e evolução
- `CHECKLIST.md` - status detalhado por fase/plano
- `STATE.md` - histórico de decisões e estado atual

## Architecture and Codebase

- `codebase/ARCHITECTURE.md` - camadas, fluxos e abstrações
- `codebase/STRUCTURE.md` - estrutura de pastas e entrypoints
- `codebase/INTEGRATIONS.md` - integrações externas, env e segredos
- `codebase/STACK.md` - stack técnica e requisitos de runtime
- `codebase/CONVENTIONS.md` - convenções de código
- `codebase/CONCERNS.md` - riscos e pontos de atenção
- `codebase/TESTING.md` - estratégia e tooling de testes

## Product Flows and Feature Docs

- `EMAIL_INTEGRATION.md` - fluxo de convite por email (Resend)
- `SHARING_SYSTEM.md` - fluxo de compartilhamento
- `TEMPLATE_MANAGEMENT.md` - templates/categorias customizadas
- `I18N_DOCUMENTATION.md` - internacionalização
- `TELEGRAM_SUMMARY.md` - integração Telegram
- `COLLABORATION_STATUS_UPDATE.md` - fluxo de colaboradores

## Policy Snapshot

- Nunca compartilhar `.env` real com segredos por WhatsApp.
- Compartilhar somente `.env.example`.
- `SUPABASE_SERVICE_ROLE_KEY` é exclusivo de backend/edge.
- Frontend usa nomes `VITE_*` (ex.: `VITE_SUPABASE_URL`).

