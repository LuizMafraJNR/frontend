// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { useCustomerInsights } from './useCustomerInsights'
import type { Customer } from './useCustomers'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

const cust = (over: Partial<Customer>): Customer => ({
  id: 'c', name: 'C', phone: '', email: '', status: 'ACTIVE', tags: [],
  visits: 0, totalSpent: 0, since: daysAgo(365), loyaltyPoints: 0, birthDate: '1990-01-01', ...over,
})

describe('useCustomerInsights', () => {
  const { avgTicket, avgIntervalDays, ltv, churnRisk, lifecycle, atRiskCustomers } = useCustomerInsights()

  it('avgTicket = gasto / visitas', () => {
    expect(avgTicket(cust({ totalSpent: 600, visits: 6 }))).toBe(100)
    expect(avgTicket(cust({ visits: 0 }))).toBe(0)
  })

  it('avgIntervalDays estima cadência de since→última visita', () => {
    // since 360d atrás, última visita 30d atrás → span 330d, 11 visitas → ~30d
    const c = cust({ since: daysAgo(360), lastVisitDate: daysAgo(30), visits: 11 })
    expect(avgIntervalDays(c)).toBeGreaterThan(20)
    expect(avgIntervalDays(c)).toBeLessThan(40)
  })

  it('ltv = realizado + projeção 12m (sempre >= gasto atual)', () => {
    const c = cust({ totalSpent: 1000, visits: 10, since: daysAgo(300), lastVisitDate: daysAgo(15) })
    expect(ltv(c)).toBeGreaterThanOrEqual(1000)
  })

  it('churnRisk: high quando muito além da cadência', () => {
    // cadência ~30d, última visita há 120d → > 3× → high
    const c = cust({ since: daysAgo(360), lastVisitDate: daysAgo(120), visits: 11, totalSpent: 1100 })
    expect(churnRisk(c)).toBe('high')
  })

  it('churnRisk: low quando dentro da cadência', () => {
    const c = cust({ since: daysAgo(360), lastVisitDate: daysAgo(20), visits: 11, totalSpent: 1100 })
    expect(churnRisk(c)).toBe('low')
  })

  it('churnRisk fallback (sem cadência): >90d = high', () => {
    const c = cust({ visits: 1, lastVisitDate: daysAgo(100), totalSpent: 80 })
    expect(churnRisk(c)).toBe('high')
  })

  it('lifecycle: vip por gasto alto', () => {
    expect(lifecycle(cust({ totalSpent: 6000, visits: 5, lastVisitDate: daysAgo(10) }))).toBe('vip')
  })

  it('lifecycle: lost quando >90d sem visita e não-VIP', () => {
    expect(lifecycle(cust({ totalSpent: 300, visits: 3, lastVisitDate: daysAgo(120) }))).toBe('lost')
  })

  it('atRiskCustomers filtra medium/high com pelo menos 1 visita', () => {
    const list = [
      cust({ id: 'a', visits: 11, since: daysAgo(360), lastVisitDate: daysAgo(120), totalSpent: 1100 }), // high
      cust({ id: 'b', visits: 11, since: daysAgo(360), lastVisitDate: daysAgo(20), totalSpent: 1100 }),  // low
      cust({ id: 'd', visits: 0, lastVisitDate: undefined }),                                            // sem visita
    ]
    const result = atRiskCustomers(list)
    expect(result.map(c => c.id)).toContain('a')
    expect(result.map(c => c.id)).not.toContain('b')
    expect(result.map(c => c.id)).not.toContain('d')
  })
})
