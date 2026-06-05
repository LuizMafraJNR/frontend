// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { useFinancial } from './useFinancial'
import { resetMockData } from './useMockPersistence'

describe('useFinancial — integrações e regras', () => {
  beforeEach(() => resetMockData())

  it('markReceivableReceived gera uma transação INCOME', async () => {
    const { receivables, transactions, markReceivableReceived } = useFinancial()
    const rec = receivables.value.find(r => r.status === 'PENDING' || r.status === 'OVERDUE')
    expect(rec).toBeDefined()
    const incomeBefore = transactions.value.filter(t => t.type === 'INCOME').length
    await markReceivableReceived(rec!.id, 'PIX')
    expect(receivables.value.find(r => r.id === rec!.id)!.status).toBe('RECEIVED')
    const incomeAfter = transactions.value.filter(t => t.type === 'INCOME').length
    expect(incomeAfter).toBe(incomeBefore + 1)
    // A transação criada tem o valor do recebível.
    expect(transactions.value[0]!.amount).toBe(rec!.amount)
    expect(transactions.value[0]!.type).toBe('INCOME')
  })

  it('markPayablePaid gera uma transação EXPENSE', async () => {
    const { payables, transactions, markPayablePaid } = useFinancial()
    const pay = payables.value.find(p => p.status === 'PENDING' || p.status === 'OVERDUE')
    expect(pay).toBeDefined()
    const expenseBefore = transactions.value.filter(t => t.type === 'EXPENSE').length
    await markPayablePaid(pay!.id, 'PIX')
    expect(payables.value.find(p => p.id === pay!.id)!.status).toBe('PAID')
    expect(transactions.value.filter(t => t.type === 'EXPENSE').length).toBe(expenseBefore + 1)
    expect(transactions.value[0]!.amount).toBe(pay!.amount)
  })

  it('registerCommission + reverseCommission são simétricos', () => {
    const { commissions, registerCommission, reverseCommission } = useFinancial()
    const args = { professionalId: 'pro-sym', professionalName: 'Sym', professionalRole: 'X', rate: 40, serviceRevenue: 100, serviceName: 'Corte' }
    registerCommission(args)
    registerCommission(args)
    const entry = commissions.value.find(c => c.professionalId === 'pro-sym')!
    expect(entry.appointments).toBe(2)
    expect(entry.commission).toBeCloseTo(80) // 40% de 200
    // Reverte uma das duas.
    reverseCommission({ professionalId: 'pro-sym', rate: 40, serviceRevenue: 100, serviceName: 'Corte' })
    expect(entry.appointments).toBe(1)
    expect(entry.revenue).toBe(100)
    expect(entry.commission).toBeCloseTo(40)
  })

  it('monthlyData é derivado das transações (mês corrente reflete nova venda)', () => {
    const { monthlyData, addTransaction } = useFinancial()
    const lastMonth = monthlyData.value[monthlyData.value.length - 1]!
    const incomeBefore = lastMonth.income
    addTransaction({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      description: 'Venda teste', type: 'INCOME', category: 'SERVICE',
      amount: 500, paymentMethod: 'PIX', status: 'PAID',
    })
    // monthlyData é computed → recalcula. O mês corrente é o último.
    const lastMonthAfter = monthlyData.value[monthlyData.value.length - 1]!
    expect(lastMonthAfter.income).toBe(incomeBefore + 500)
  })

  it('cashflowForecast projeta net = recebíveis - pagáveis por horizonte', () => {
    const { cashflowForecast, addReceivable, addPayable } = useFinancial()
    const in10days = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)
    const base30 = cashflowForecast.value.find(f => f.days === 30)!.net
    addReceivable({ description: 'Receber teste', amount: 1000, dueDate: in10days, status: 'PENDING', category: 'SERVICE' })
    addPayable({ description: 'Pagar teste', amount: 400, dueDate: in10days, status: 'PENDING', category: 'RENT' })
    // O horizonte de 30 dias inclui ambas (vencem em 10 dias): net +600.
    const after30 = cashflowForecast.value.find(f => f.days === 30)!.net
    expect(after30).toBe(base30 + 600)
  })

  it('cashflowForecast tem 3 horizontes (30/60/90)', () => {
    const { cashflowForecast } = useFinancial()
    expect(cashflowForecast.value.map(f => f.days)).toEqual([30, 60, 90])
  })

  it('kpiIncome reflete apenas receitas pagas do mês corrente', () => {
    const { kpiIncome, addTransaction } = useFinancial()
    const before = kpiIncome.value
    addTransaction({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      description: 'Receita do mês', type: 'INCOME', category: 'SERVICE',
      amount: 123, paymentMethod: 'PIX', status: 'PAID',
    })
    expect(kpiIncome.value).toBe(before + 123)
  })
})
