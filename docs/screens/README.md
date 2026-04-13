# SaaS — Telas

Documentação detalhada de cada tela da layer `saas`. Todas as telas usam o layout `saas` e o Design System Zima Blue.

## Mapa de telas

| # | Tela | Rota | Arquivo | Doc |
|---|------|------|---------|-----|
| 01 | Dashboard | `/saas` | `pages/saas/index.vue` | [01-dashboard.md](01-dashboard.md) |
| 02 | Agenda | `/saas/agenda` | `pages/saas/agenda.vue` | [02-agenda.md](02-agenda.md) |
| 03 | Clientes | `/saas/clientes` | `pages/saas/clientes/index.vue` | [03-clientes.md](03-clientes.md) |
| 04 | Serviços | `/saas/servicos` | `pages/saas/servicos.vue` | [04-servicos.md](04-servicos.md) |
| 05 | Equipe | `/saas/equipe` | `pages/saas/equipe/index.vue` | [05-equipe.md](05-equipe.md) |
| 06 | Inbox | `/saas/inbox` | `pages/saas/inbox.vue` | [06-inbox.md](06-inbox.md) |
| 07 | IA & Automação | `/saas/ia` | `pages/saas/ia.vue` | [07-ia.md](07-ia.md) |
| 08 | Campanhas | `/saas/campanhas` | `pages/saas/campanhas.vue` | [08-campanhas.md](08-campanhas.md) |
| 09 | Financeiro | `/saas/financeiro` | `pages/saas/financeiro.vue` | [09-financeiro.md](09-financeiro.md) |
| 10 | Caixa / PDV | `/saas/caixa` | `pages/saas/caixa.vue` | [10-caixa.md](10-caixa.md) |
| 11 | Estoque | `/saas/estoque` | `pages/saas/estoque.vue` | [11-estoque.md](11-estoque.md) |
| 12 | Notas Fiscais | `/saas/notas` | `pages/saas/notas.vue` | [12-notas.md](12-notas.md) |
| 13 | Relatórios | `/saas/relatorios` | `pages/saas/relatorios.vue` | [13-relatorios.md](13-relatorios.md) |
| 14 | Configurações | `/saas/configuracoes` | `pages/saas/configuracoes.vue` | [14-configuracoes.md](14-configuracoes.md) |

## Padrões comuns a todas as telas

- `definePageMeta({ layout: 'saas' })` no topo de cada page
- Query params `?tab=xxx` persistem a tab ativa na URL
- Sub-tabs com `borderBottomColor` dinâmico (ver [CLAUDE.md](../../CLAUDE.md#1-sub-tabs-navegação-interna-de-página))
- Toast via `useZimaToast()` para todas as notificações
- Composables com `initialized` ref evitam double-fetch
