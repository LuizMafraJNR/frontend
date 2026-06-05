// @vitest-environment nuxt
/**
 * Cobre o MESMO código que caixa.vue:finalizeSale executa (commitSale),
 * provando que UMA venda dispara TODOS os efeitos — não só alguns.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useSaleCommit } from './useSaleCommit'
import { useFinancial } from './useFinancial'
import { useInventory } from './useInventory'
import { useCampaigns } from './useCampaigns'
import { useProfessionals } from './useProfessionals'
import { useDomainEvents } from './useDomainEvents'
import { resetMockData } from './useMockPersistence'

describe('useSaleCommit — uma venda dispara todos os efeitos', () => {
  beforeEach(() => resetMockData())

  it('venda com serviço + produto: transação + baixa estoque + comissão + evento', () => {
    const { commitSale } = useSaleCommit()
    const { transactions, commissions } = useFinancial()
    const { products } = useInventory()
    const { professionals } = useProfessionals()
    const events = useDomainEvents()

    const prod = products.value.find(p => p.id === 'prod-1')!
    const pro = professionals.value[0]!
    const stockBefore = prod.stock
    const txBefore = transactions.value.length

    let saleEvtFired = false
    const off = events.on('sale:completed', () => { saleEvtFired = true })

    const result = commitSale({
      saleId: 'sale-commit-1',
      total: 169.9,
      paymentMethod: 'PIX',
      paymentLabel: 'Pix',
      category: 'SALE',
      items: [
        { id: 'svc-x', type: 'service', name: 'Corte', qty: 1, lineTotal: 80, professionalId: pro.id },
        { id: 'prod-1', type: 'product', name: prod.name, qty: 1, lineTotal: 89.9 },
      ],
    })

    // 1) Financeiro
    expect(transactions.value.length).toBe(txBefore + 1)
    expect(transactions.value[0]!.type).toBe('INCOME')
    // 2) Estoque
    expect(products.value.find(p => p.id === 'prod-1')!.stock).toBe(stockBefore - 1)
    // 3) Comissão (1 serviço com profissional)
    expect(result.commissionsRegistered).toBe(1)
    expect(commissions.value.find(c => c.professionalId === pro.id)).toBeDefined()
    // 4) Evento
    expect(saleEvtFired).toBe(true)
    off()
  })

  it('serviço SEM profissional: registra receita mas NÃO comissão (regra do canFinalize)', () => {
    const { commitSale } = useSaleCommit()
    const { transactions } = useFinancial()
    const txBefore = transactions.value.length

    const result = commitSale({
      saleId: 'sale-commit-2',
      total: 80,
      paymentMethod: 'CASH',
      paymentLabel: 'Dinheiro',
      category: 'SERVICE',
      items: [{ id: 'svc-y', type: 'service', name: 'Corte', qty: 1, lineTotal: 80, professionalId: undefined }],
    })

    expect(transactions.value.length).toBe(txBefore + 1) // receita registra
    expect(result.commissionsRegistered).toBe(0)         // comissão NÃO (sem profissional)
    // (Na tela, canFinalize bloqueia esse caso — aqui documentamos o comportamento do commit.)
  })

  it('cupom válido atribui conversão e emite campaign:converted', () => {
    const { commitSale } = useSaleCommit()
    const { campaigns } = useCampaigns()
    const events = useDomainEvents()
    const camp = campaigns.value.find(c => c.couponCode === 'ABRIL20')!
    const convBefore = camp.metrics.converted

    let convEvtFired = false
    const off = events.on('campaign:converted', () => { convEvtFired = true })

    const result = commitSale({
      saleId: 'sale-commit-3',
      total: 200,
      paymentMethod: 'CREDIT',
      paymentLabel: 'Crédito',
      category: 'SERVICE',
      couponCode: 'ABRIL20',
      items: [{ id: 'svc-z', type: 'service', name: 'Coloração', qty: 1, lineTotal: 200, professionalId: undefined }],
    })

    expect(result.convertedCampaign?.id).toBe(camp.id)
    expect(camp.metrics.converted).toBe(convBefore + 1)
    expect(convEvtFired).toBe(true)
    off()
  })

  it('reverseSale é simétrico: estorna financeiro + devolve estoque + reverte comissão', () => {
    const { commitSale, reverseSale } = useSaleCommit()
    const { transactions, commissions } = useFinancial()
    const { products } = useInventory()
    const { professionals } = useProfessionals()
    const pro = professionals.value[0]!
    const prod = products.value.find(p => p.id === 'prod-1')!
    const stockBefore = prod.stock

    const items = [
      { id: 'svc-r', type: 'service' as const, name: 'Corte', qty: 1, lineTotal: 100, professionalId: pro.id },
      { id: 'prod-1', type: 'product' as const, name: prod.name, qty: 2, lineTotal: 89.9 },
    ]
    commitSale({ saleId: 'sale-rev', total: 279.8, paymentMethod: 'PIX', paymentLabel: 'Pix', category: 'SALE', items })
    const stockAfterSale = products.value.find(p => p.id === 'prod-1')!.stock
    const commAfterSale = commissions.value.find(c => c.professionalId === pro.id)?.commission ?? 0
    const txCount = transactions.value.length

    reverseSale({ saleId: 'sale-rev', total: 279.8, items })

    // Estoque volta ao patamar pré-venda.
    expect(products.value.find(p => p.id === 'prod-1')!.stock).toBe(stockBefore)
    expect(stockAfterSale).toBe(stockBefore - 2)
    // Comissão revertida (volta ao que era antes desta venda).
    const commAfterReversal = commissions.value.find(c => c.professionalId === pro.id)?.commission ?? 0
    expect(commAfterReversal).toBeLessThan(commAfterSale)
    // Lançou uma transação de estorno (EXPENSE).
    expect(transactions.value.length).toBe(txCount + 1)
    expect(transactions.value[0]!.type).toBe('EXPENSE')
  })

  it('produto que zera estoque sinaliza stock:low/out', () => {
    const { commitSale } = useSaleCommit()
    const { products } = useInventory()
    const prod = products.value.find(p => p.id === 'prod-1')! // stock 18
    const result = commitSale({
      saleId: 'sale-commit-4',
      total: 89.9 * prod.stock,
      paymentMethod: 'PIX',
      paymentLabel: 'Pix',
      category: 'PRODUCT',
      items: [{ id: 'prod-1', type: 'product', name: prod.name, qty: prod.stock, lineTotal: 89.9 * prod.stock }],
    })
    expect(result.stockLowProducts.length).toBe(1)
    expect(result.stockLowProducts[0]!.outOfStock).toBe(true)
  })
})
