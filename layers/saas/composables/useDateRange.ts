/**
 * useDateRange — utilidades de intervalo de datas para filtros de período.
 * Lógica pura e testável (sem estado), compartilhada entre Dashboard, Financeiro
 * e Relatórios para evitar reimplementar o recorte por período em cada tela.
 */
export type PeriodPreset = 'hoje' | '7d' | '30d' | '90d' | 'mes' | 'ano' | 'custom'

export interface DateRange {
  start: string // 'YYYY-MM-DD'
  end: string   // 'YYYY-MM-DD'
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/**
 * Calcula o intervalo [start, end] para um preset de período.
 * @param preset período pré-definido
 * @param custom intervalo manual quando preset === 'custom'
 * @param ref    data de referência (default: hoje) — injetável para testes determinísticos
 */
export function rangeForPreset(preset: PeriodPreset, custom?: Partial<DateRange>, ref?: Date): DateRange {
  const base = ref ? new Date(ref) : new Date()
  const end = new Date(base)
  const start = new Date(base)
  switch (preset) {
    case 'hoje': break
    case '7d': start.setDate(start.getDate() - 6); break
    case '30d': start.setDate(start.getDate() - 29); break
    case '90d': start.setDate(start.getDate() - 89); break
    case 'mes': start.setDate(1); break
    case 'ano': start.setMonth(0, 1); break
    case 'custom':
      return { start: custom?.start || iso(base), end: custom?.end || iso(base) }
  }
  return { start: iso(start), end: iso(end) }
}

/** Verdadeiro se a data (string ISO ou 'YYYY-MM-DD HH:MM') cai dentro do intervalo. */
export function isInRange(dateStr: string, range: DateRange): boolean {
  const d = dateStr.slice(0, 10)
  return d >= range.start && d <= range.end
}

export const useDateRange = () => ({ rangeForPreset, isInRange })
