// @vitest-environment nuxt
/**
 * Smoke test do backbone — prova que uma venda no PDV alimenta Financeiro,
 * Estoque e Comissões de forma integrada, e que os eventos efêmeros disparam.
 * Exercita exatamente o caminho que caixa.vue:finalizeSale executa.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useFinancial } from './useFinancial'
import { useInventory } from './useInventory'
import { useDomainEvents } from './useDomainEvents'
import { resetMockData } from './useMockPersistence'

describe('Backbone — integração Caixa → Financeiro + Estoque + Comissões', () => {
  beforeEach(() => {
    // Estado determinístico (advisor): parte sempre do seed conhecido.
    resetMockData()
  })

  it('venda de produto baixa o estoque e gera StockMovement EXIT/SALE', () => {
    const { products, movements, registerSaleExit } = useInventory()
    const prod = products.value.find(p => p.id === 'prod-1')!
    const stockBefore = prod.stock // 18 no seed
    const movsBefore = movements.value.length

    const result = registerSaleExit('prod-1', 2, 'sale-test-1')

    expect(result).not.toBeNull()
    expect(prod.stock).toBe(stockBefore - 2)
    expect(movements.value.length).toBe(movsBefore + 1)
    const mov = movements.value[0]!
    expect(mov.type).toBe('EXIT')
    expect(mov.reason).toBe('SALE')
    expect(mov.saleId).toBe('sale-test-1')
    expect(mov.qtyAfter).toBe(stockBefore - 2)
  })

  it('detecta cruzamento do estoque mínimo para alimentar alerta', () => {
    const { products, registerSaleExit } = useInventory()
    const prod = products.value.find(p => p.id === 'prod-1')! // stock 18, min 5
    // Vende o suficiente para cair de 18 para 4 (<= min 5, > 0): cruza o mínimo.
    const result = registerSaleExit('prod-1', prod.stock - 4, 'sale-test-2')
    expect(result!.crossedMin).toBe(true)
    expect(result!.outOfStock).toBe(false)
  })

  it('venda registra transação INCOME no Financeiro', () => {
    const { transactions, addTransaction } = useFinancial()
    const countBefore = transactions.value.length

    addTransaction({
      date: '2026-05-31 10:00',
      description: 'Venda PDV #sale-test-3 — Shampoo Wella Fusion',
      type: 'INCOME',
      category: 'PRODUCT',
      amount: 89.9,
      paymentMethod: 'PIX',
      status: 'PAID',
      clientName: 'Cliente Teste',
      items: [{ name: 'Shampoo Wella Fusion', qty: 1, price: 89.9 }],
    })

    expect(transactions.value.length).toBe(countBefore + 1)
    const tx = transactions.value[0]!
    expect(tx.type).toBe('INCOME')
    expect(tx.amount).toBe(89.9)
    expect(tx.status).toBe('PAID')
  })

  it('comissão é AGREGADA por (profissional, período) — não uma linha por venda', () => {
    const { commissions, registerCommission } = useFinancial()
    const countBefore = commissions.value.length

    const args = {
      professionalId: 'pro-test',
      professionalName: 'Prof Teste',
      professionalRole: 'Cabeleireiro',
      rate: 30,
      serviceRevenue: 100,
      serviceName: 'Corte',
    }
    // Duas vendas do mesmo profissional no mesmo período.
    registerCommission(args)
    registerCommission(args)

    // Deve ter criado exatamente UMA entry nova (agregada), não duas.
    const entry = commissions.value.find(c => c.professionalId === 'pro-test')
    expect(entry).toBeDefined()
    expect(commissions.value.length).toBe(countBefore + 1)
    expect(entry!.appointments).toBe(2)
    expect(entry!.revenue).toBe(200)
    expect(entry!.commission).toBeCloseTo(60) // 30% de 200
    // O breakdown também agrega o mesmo serviço.
    expect(entry!.serviceBreakdown).toHaveLength(1)
    expect(entry!.serviceBreakdown![0]!.count).toBe(2)
  })

  it('evento sale:completed é entregue a um listener', () => {
    const events = useDomainEvents()
    let received: { saleId: string; total: number } | null = null
    const off = events.on('sale:completed', p => { received = { saleId: p.saleId, total: p.total } })

    events.emit('sale:completed', {
      saleId: 'sale-test-evt',
      total: 150,
      paymentLabel: 'Pix',
      items: [{ name: 'Corte', qty: 1, price: 150, type: 'service' }],
    })

    expect(received).not.toBeNull()
    expect(received!.saleId).toBe('sale-test-evt')
    expect(received!.total).toBe(150)
    off()
  })
})
