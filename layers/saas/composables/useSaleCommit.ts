/**
 * useSaleCommit — efeitos de domínio de uma venda do PDV, num único lugar testável.
 *
 * Encapsula a sequência autoritativa que o caixa executa ao finalizar uma venda:
 * grava a transação no Financeiro, baixa o Estoque dos produtos, agrega a Comissão
 * dos serviços e atribui conversão de cupom à Campanha — emitindo os eventos
 * efêmeros (stock:low, campaign:converted, sale:completed) pelo barramento.
 *
 * O componente caixa.vue chama `commitSale()` — então o teste deste composable
 * cobre o MESMO código que o handler usa (não uma réplica), fechando o gap entre
 * "as funções funcionam" e "o handler as chama corretamente".
 */
import type { TxPaymentMethod } from './useFinancial'

export interface SaleCommitItem {
  id: string
  type: 'service' | 'product'
  name: string
  qty: number
  /** subtotal já com desconto do item aplicado */
  lineTotal: number
  professionalId?: string
}

export interface SaleCommitInput {
  saleId: string
  total: number
  paymentMethod: TxPaymentMethod
  paymentLabel: string
  category: 'SERVICE' | 'PRODUCT' | 'SALE'
  customerId?: string
  customerName?: string
  professionalName?: string
  couponCode?: string
  installments?: number
  items: SaleCommitItem[]
}

export interface SaleCommitResult {
  stockLowProducts: { id: string; name: string; stock: number; minStock: number; outOfStock: boolean }[]
  commissionsRegistered: number
  convertedCampaign: { id: string; name: string } | null
}

export interface SaleReversalInput {
  saleId: string
  total: number
  customerName?: string
  items: SaleCommitItem[]
}

export const useSaleCommit = () => {
  const { addTransaction, registerCommission, reverseCommission } = useFinancial()
  const { registerSaleExit, reverseSaleExit } = useInventory()
  const { professionals } = useProfessionals()
  const { applyCoupon } = useCampaigns()
  const events = useDomainEvents()

  /** Executa todos os efeitos de uma venda finalizada. Retorna o que aconteceu. */
  function commitSale(input: SaleCommitInput): SaleCommitResult {
    const result: SaleCommitResult = { stockLowProducts: [], commissionsRegistered: 0, convertedCampaign: null }

    // 1) Financeiro — transação INCOME.
    addTransaction({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      description: `Venda PDV #${input.saleId} — ${input.items.map(i => i.name).join(', ')}`,
      type: 'INCOME',
      category: input.category,
      amount: input.total,
      paymentMethod: input.paymentMethod,
      status: 'PAID',
      clientId: input.customerId,
      clientName: input.customerName,
      items: input.items.map(i => ({ name: i.name, qty: i.qty, price: i.lineTotal })),
      installments: input.installments,
    })

    // 2) Estoque — baixa produtos (EXIT/SALE) + evento stock:low.
    for (const item of input.items.filter(i => i.type === 'product')) {
      const r = registerSaleExit(item.id, item.qty, input.saleId)
      if (r && (r.crossedMin || r.outOfStock)) {
        const payload = { productId: r.product.id, productName: r.product.name, stock: r.product.stock, minStock: r.product.minStock, outOfStock: r.outOfStock }
        events.emit('stock:low', payload)
        result.stockLowProducts.push({ id: r.product.id, name: r.product.name, stock: r.product.stock, minStock: r.product.minStock, outOfStock: r.outOfStock })
      }
    }

    // 3) Comissões — agrega por profissional (apenas serviços com responsável).
    for (const item of input.items.filter(i => i.type === 'service' && i.professionalId)) {
      const pro = professionals.value.find(p => p.id === item.professionalId)
      if (!pro) continue
      registerCommission({
        professionalId: pro.id,
        professionalName: pro.name,
        professionalRole: pro.role,
        rate: pro.commissionRate,
        serviceRevenue: item.lineTotal,
        serviceName: item.name,
      })
      result.commissionsRegistered++
    }

    // 4) Cupom — atribui conversão à campanha + evento.
    if (input.couponCode?.trim()) {
      const camp = applyCoupon(input.couponCode)
      if (camp) {
        events.emit('campaign:converted', { campaignId: camp.id, campaignName: camp.name, saleId: input.saleId, amount: input.total })
        result.convertedCampaign = { id: camp.id, name: camp.name }
      }
    }

    // 5) Evento de venda concluída.
    events.emit('sale:completed', {
      saleId: input.saleId,
      total: input.total,
      customerId: input.customerId,
      customerName: input.customerName,
      professionalName: input.professionalName,
      paymentLabel: input.paymentLabel,
      couponCode: input.couponCode?.trim() || undefined,
      items: input.items.map(i => ({
        name: i.name, qty: i.qty, price: i.lineTotal, type: i.type,
        productId: i.type === 'product' ? i.id : undefined,
        serviceId: i.type === 'service' ? i.id : undefined,
      })),
    })

    return result
  }

  /**
   * Reverte os efeitos de uma venda estornada (espelho de commitSale):
   * lança estorno como despesa, devolve produtos ao estoque e reverte a comissão.
   * Mantém a simetria financeiro + estoque + comissão.
   */
  function reverseSale(input: SaleReversalInput): void {
    // Financeiro — estorno como despesa (não deleta a receita original; auditoria).
    addTransaction({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      description: `Estorno da venda #${input.saleId}${input.customerName ? ` — ${input.customerName}` : ''}`,
      type: 'EXPENSE',
      category: 'OTHER',
      amount: input.total,
      paymentMethod: 'CASH',
      status: 'PAID',
      notes: 'Estorno de venda do PDV',
    })
    // Estoque — devolve produtos.
    for (const item of input.items.filter(i => i.type === 'product')) {
      reverseSaleExit(item.id, item.qty, input.saleId)
    }
    // Comissões — reverte serviços com profissional.
    for (const item of input.items.filter(i => i.type === 'service' && i.professionalId)) {
      const pro = professionals.value.find(p => p.id === item.professionalId)
      if (pro) {
        reverseCommission({ professionalId: pro.id, rate: pro.commissionRate, serviceRevenue: item.lineTotal, serviceName: item.name })
      }
    }
  }

  return { commitSale, reverseSale }
}
