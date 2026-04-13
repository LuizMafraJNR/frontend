# Tela 09 — Financeiro

**Rota:** `/saas/financeiro`
**Arquivo:** `layers/saas/pages/saas/financeiro.vue`
**Composable principal:** `useFinancial()` — `layers/saas/composables/useFinancial.ts`

## Visão Geral

Dashboard financeiro completo. Consolida receitas, despesas, contas a receber e a pagar, comissões da equipe e DRE (Demonstrativo do Resultado do Exercício). Suporta filtros por período com seletor personalizado.

## Tabs (7)

| Tab | Conteúdo |
|-----|---------|
| `overview` | KPIs + gráficos de receita/despesa + resumos das demais tabs |
| `receitas` | Tabela de transações de receita com filtros |
| `despesas` | Tabela de transações de despesa com filtros |
| `receber` | Contas a receber com status (PENDING/OVERDUE/RECEIVED) e ações de recebimento |
| `pagar` | Contas a pagar com status e ações de pagamento |
| `comissoes` | Comissões calculadas por profissional no período |
| `dre` | DRE estruturado (Receita Bruta → Deduções → Lucro Líquido) |

## Seletor de Período

| Opção | Comportamento |
|-------|--------------|
| `month` | Mês atual |
| `quarter` | Trimestre atual |
| `year` | Ano atual |
| `custom` | Date range picker — `dateStart` + `dateEnd` |

## Tipos

```typescript
type TransactionType = 'INCOME' | 'EXPENSE'
type TransactionStatus = 'PAID' | 'PENDING' | 'CANCELLED'
type TransactionCategory = 'SALE' | 'SERVICE' | 'PRODUCT' | 'RENT' | 'SALARY' | 'UTILITIES' | 'MARKETING' | 'TAX' | 'EQUIPMENT' | 'OTHER'
type TxPaymentMethod = 'PIX' | 'CASH' | 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'BOLETO'
type ReceivableStatus = 'PENDING' | 'OVERDUE' | 'RECEIVED' | 'CANCELLED'
type PayableStatus = 'PENDING' | 'OVERDUE' | 'PAID' | 'CANCELLED'

interface Transaction {
  id: string
  date: string
  description: string
  type: TransactionType
  category: TransactionCategory
  amount: number
  paymentMethod: TxPaymentMethod
  status: TransactionStatus
  clientId?: string
  clientName?: string
  professionalId?: string
  professionalName?: string
  appointmentId?: string
  items?: TransactionItem[]
  notes?: string
  installments?: number
  installmentCurrent?: number
}

interface Receivable {
  id: string
  description: string
  clientId?: string
  clientName?: string
  amount: number
  dueDate: string
  status: ReceivableStatus
  paymentMethod?: TxPaymentMethod
  category: TransactionCategory
  notes?: string
  createdAt: string
  receivedAt?: string
  appointmentId?: string
  installments?: number
  installmentCurrent?: number
  installmentOf?: number
}

interface Payable {
  id: string
  description: string
  supplierName?: string
  amount: number
  dueDate: string
  status: PayableStatus
  paymentMethod?: TxPaymentMethod
  category: TransactionCategory
  notes?: string
  createdAt: string
  paidAt?: string
  recurrent?: boolean
  recurrentPeriod?: 'monthly' | 'weekly' | 'yearly'
  installments?: number
  installmentCurrent?: number
}

interface CommissionEntry {
  professionalId: string
  professionalName: string
  professionalRole: string
  appointments: number
  revenue: number
  rate: number           // percentual
  commission: number     // calculado: revenue * rate / 100
}
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega todas as transações, recebíveis, pagáveis e comissões |
| `addTransaction(data)` | Registra nova transação |
| `receivePayment(id, method)` | Baixa conta a receber |
| `payBill(id, method)` | Baixa conta a pagar |
| `kpi` | `computed` — `{ income, expenses, profit, receivable, payable }` para o período selecionado |
| `filteredTransactions` | `computed` — filtra por período, tipo, categoria |

## KPIs da Tab Overview

- Faturamento do período (receitas pagas)
- Despesas do período
- Lucro líquido (faturamento - despesas)
- A receber (soma de receivables PENDING + OVERDUE)
- A pagar (soma de payables PENDING + OVERDUE)
- Variação vs período anterior (com seta ↑↓ colorida)

## Integração com PDV

O `caixa.vue` registra vendas via `addTransaction()` do `useFinancial()`, criando a entrada financeira vinculada ao agendamento.
