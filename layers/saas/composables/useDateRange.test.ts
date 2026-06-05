import { describe, it, expect } from 'vitest'
import { rangeForPreset, isInRange } from './useDateRange'

// Data de referência fixa para determinismo: 2026-05-31 (uma quinta-feira).
const REF = new Date('2026-05-31T12:00:00')

describe('useDateRange / rangeForPreset', () => {
  it('hoje → início e fim no mesmo dia', () => {
    expect(rangeForPreset('hoje', undefined, REF)).toEqual({ start: '2026-05-31', end: '2026-05-31' })
  })

  it('7d → janela de 7 dias inclusiva (hoje + 6 anteriores)', () => {
    expect(rangeForPreset('7d', undefined, REF)).toEqual({ start: '2026-05-25', end: '2026-05-31' })
  })

  it('30d → 30 dias inclusivos', () => {
    expect(rangeForPreset('30d', undefined, REF)).toEqual({ start: '2026-05-02', end: '2026-05-31' })
  })

  it('90d → 90 dias inclusivos', () => {
    expect(rangeForPreset('90d', undefined, REF)).toEqual({ start: '2026-03-03', end: '2026-05-31' })
  })

  it('mes → do dia 1 do mês corrente até hoje', () => {
    expect(rangeForPreset('mes', undefined, REF)).toEqual({ start: '2026-05-01', end: '2026-05-31' })
  })

  it('ano → de 1º de janeiro até hoje', () => {
    expect(rangeForPreset('ano', undefined, REF)).toEqual({ start: '2026-01-01', end: '2026-05-31' })
  })

  it('custom → usa o intervalo informado', () => {
    expect(rangeForPreset('custom', { start: '2026-04-10', end: '2026-04-20' }, REF))
      .toEqual({ start: '2026-04-10', end: '2026-04-20' })
  })
})

describe('useDateRange / isInRange', () => {
  const range = { start: '2026-05-01', end: '2026-05-31' }

  it('inclui datas nas bordas', () => {
    expect(isInRange('2026-05-01', range)).toBe(true)
    expect(isInRange('2026-05-31', range)).toBe(true)
  })

  it('aceita timestamp com hora (corta para YYYY-MM-DD)', () => {
    expect(isInRange('2026-05-15 14:30', range)).toBe(true)
  })

  it('exclui datas fora do intervalo', () => {
    expect(isInRange('2026-04-30', range)).toBe(false)
    expect(isInRange('2026-06-01', range)).toBe(false)
  })
})
