/**
 * useCustomerInsights — métricas de CRM derivadas dos campos reais do cliente.
 *
 * Heurísticas simples e DEFENSÁVEIS (não há histórico por visita no mock, então
 * o intervalo médio é estimado de since→lastVisit / visits). Tudo é função pura
 * sobre dados persistidos — sem números fabricados. Cada métrica alimenta uma
 * ação real na tela (ex.: clientes em risco → campanha de reativação).
 */
import type { Customer } from './useCustomers'

export type ChurnRisk = 'low' | 'medium' | 'high'
export type LifecycleStage = 'new' | 'active' | 'at_risk' | 'lost' | 'vip'

const DAY = 86_400_000
const daysSince = (iso?: string): number =>
  iso ? Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / DAY) : Infinity

export const useCustomerInsights = () => {
  /** Ticket médio do cliente (gasto total / visitas). */
  const avgTicket = (c: Customer): number => (c.visits > 0 ? c.totalSpent / c.visits : 0)

  /** Intervalo médio entre visitas em dias (estimado de since→última visita). */
  const avgIntervalDays = (c: Customer): number => {
    if (c.visits <= 1 || !c.lastVisitDate || !c.since) return 0
    const span = daysSince(c.since) - daysSince(c.lastVisitDate)
    return span > 0 ? Math.round(span / c.visits) : 0
  }

  /**
   * LTV estimado: valor já realizado + projeção de 12 meses na cadência atual.
   * projeção = ticket médio × (visitas esperadas nos próximos 12 meses).
   */
  const ltv = (c: Customer): number => {
    const interval = avgIntervalDays(c)
    const visitsPerYear = interval > 0 ? Math.min(52, 365 / interval) : 0
    const projected = avgTicket(c) * visitsPerYear
    return Math.round(c.totalSpent + projected)
  }

  /**
   * Risco de churn: compara dias desde a última visita com o intervalo habitual.
   * Sem cadência conhecida, usa o corte absoluto de 90 dias (regra de inatividade).
   */
  const churnRisk = (c: Customer): ChurnRisk => {
    const since = daysSince(c.lastVisitDate)
    const interval = avgIntervalDays(c)
    if (interval > 0) {
      if (since > interval * 3) return 'high'
      if (since > interval * 1.5) return 'medium'
      return 'low'
    }
    // Fallback sem cadência: usa o corte de inatividade.
    if (since > 90) return 'high'
    if (since > 45) return 'medium'
    return 'low'
  }

  /** Estágio no ciclo de vida (para visualização de funil). */
  const lifecycle = (c: Customer): LifecycleStage => {
    if (c.totalSpent > 5000 || c.visits > 20) return 'vip'
    const since = daysSince(c.lastVisitDate)
    if (!c.lastVisitDate && daysSince(c.since) < 30) return 'new'
    if (since > 90) return 'lost'
    if (churnRisk(c) === 'high' || churnRisk(c) === 'medium') return 'at_risk'
    return 'active'
  }

  /** Clientes em risco de churn (medium/high) — alvo de reativação. */
  const atRiskCustomers = (customers: Customer[]): Customer[] =>
    customers.filter(c => c.visits > 0 && churnRisk(c) !== 'low')

  return { avgTicket, avgIntervalDays, ltv, churnRisk, lifecycle, atRiskCustomers, daysSince }
}
