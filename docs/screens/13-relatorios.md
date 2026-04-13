# Tela 13 — Relatórios

**Rota:** `/saas/relatorios`
**Arquivo:** `layers/saas/pages/saas/relatorios.vue`
**Composables:** a definir conforme implementação

## Visão Geral

Central de relatórios gerenciais. Consolida dados de todas as áreas do SaaS em relatórios exportáveis por período.

> **Status:** Tela em desenvolvimento. Esta documentação será atualizada quando a implementação estiver concluída.

## Relatórios Previstos

| Relatório | Fonte de Dados | Exportação |
|-----------|---------------|-----------|
| Faturamento por período | `useFinancial()` | PDF / XLSX |
| Agendamentos por profissional | `useAppointments()` | PDF / XLSX |
| Clientes novos vs recorrentes | `useCustomers()` + `useAppointments()` | PDF |
| Produtos mais vendidos | `useInventory()` | XLSX |
| Comissões da equipe | `useFinancial()` | PDF |
| Ticket médio | `useFinancial()` | PDF |

## Filtros

- Período (mês, trimestre, ano, personalizado)
- Profissional específico ou todos
- Categoria de serviço

## Ao Implementar

- Usar composables existentes como fonte de dados (não criar novos mock data)
- Adicionar `definePageMeta({ layout: 'saas' })` e query param `?tab=`
- Atualizar este arquivo com os tipos, funções e componentes utilizados
