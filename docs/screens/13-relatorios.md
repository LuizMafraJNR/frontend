# Tela 13 — Relatórios

**Rota:** `/saas/relatorios`
**Arquivo:** `layers/saas/pages/saas/relatorios.vue`
**Composable principal:** `useReports()` — `layers/saas/composables/useReports.ts`

## Visão Geral

Central de relatórios gerenciais. Consolida dados agregados das áreas operacional, financeira e de clientes em quatro abas com KPIs, gráficos inline (SVG) e tabelas detalhadas. Todos os dados vêm do composable `useReports()` (mock determinístico) — nenhuma chamada de rede.

## Estrutura

- Layout: `saas` (`definePageMeta({ layout: 'saas' })`)
- Sub-tabs (query param `?tab=`): `vendas` | `financeiro` | `operacional` | `clientes`
- Filtro de período global: `7d` | `30d` | `90d` | `year` (o mock não recorta — o filtro é visual)
- Botão **Exportar CSV** por aba

## Abas

### Vendas
- KPIs: Receita total, Total de vendas, Ticket médio, Serviço mais vendido
- Bar chart SVG: vendas por dia
- Tabelas: vendas por serviço, vendas por profissional

### Financeiro
- KPIs: Lucro mensal, Despesa mensal, Margem média
- Line chart SVG: evolução do lucro mês a mês
- Tabela DRE mensal (receita, despesa, lucro, margem)

### Operacional
- KPIs: Taxa de ocupação, Cancelamentos, No-shows, Duração média
- Cards de profissional mais produtivo e horário de pico

### Clientes
- KPIs: Novos, Recorrentes, Ticket médio, LTV estimado
- Tabela por segmento (VIP, Regulares, Ocasionais, Novos)

## Exportação CSV

Client-side via `Blob` + `URL.createObjectURL`:
- Arquivo: `relatorio-<tab>-YYYY-MM-DD.csv`
- Separador `;`, encoding UTF-8 com BOM para abrir corretamente no Excel pt-BR

## `useReports()` — API

```typescript
const {
  salesByService,      // Ref<Array<{ service: string; revenue: number; count: number }>>
  salesByProfessional, // Ref<Array<{ name: string; revenue: number; count: number }>>
  salesByDay,          // Ref<Array<{ date: string; revenue: number; count: number }>>
  dreMonthly,          // Ref<Array<{ month: string; income: number; expenses: number; profit: number }>>
  operationalKpi,      // Ref<{ occupancy: number; cancellations: number; noShows: number; avgDuration: number; topPro: string; peakHour: string }>
  customerSegments,    // Ref<Array<{ segment: string; count: number; avgTicket: number; ltv: number }>>
  loading,
  fetchAll,
} = useReports()
```

Singleton com `initialized` ref, segue o padrão dos demais composables do SaaS (ver [CLAUDE.md](../../CLAUDE.md#3-singleton-refs-nos-composables)).

## Padrões aplicados

- Sub-tabs com `borderBottomColor` dinâmico + query param sync
- Ícones via `<Icon name="i-lucide-*" />` (sem emojis)
- Tokens Zima Blue para cores, superfícies e tipografia
- Responsivo: KPIs em `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, tabelas com `overflow-x-auto`
