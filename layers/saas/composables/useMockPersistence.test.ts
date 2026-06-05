// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import {
  persistedRef,
  resetMockData,
  hydrateAll,
  __resetHydrationFlagForTests,
  SCHEMA_VERSION,
} from './useMockPersistence'

const PREFIX = 'cuidados:saas'
const VERSION_KEY = `${PREFIX}:__v`

describe('useMockPersistence / persistedRef (SSR-safe localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION))
    __resetHydrationFlagForTests()
  })

  it('o ref NASCE com o seed (não lê localStorage na criação — evita hydration mismatch)', () => {
    // Mesmo havendo dado no storage, a criação do ref usa o seed: a leitura só
    // ocorre em hydrateAll() (pós-hidratação, via plugin .client).
    localStorage.setItem(`${PREFIX}:test:eager`, JSON.stringify([{ id: 99 }]))
    const r = persistedRef('test:eager', () => [{ id: 1 }])
    expect(r.value).toEqual([{ id: 1 }]) // seed, não o storage
  })

  it('hydrateAll() reidrata do localStorage (simula o plugin pós-hidratação)', () => {
    localStorage.setItem(`${PREFIX}:test:hydrate`, JSON.stringify([{ id: 42, name: 'persisted' }]))
    const r = persistedRef('test:hydrate', () => [{ id: 1, name: 'seed' }])
    expect(r.value).toEqual([{ id: 1, name: 'seed' }]) // antes da hidratação: seed
    hydrateAll()
    expect(r.value).toEqual([{ id: 42, name: 'persisted' }]) // depois: storage
  })

  it('hydrateAll() grava o seed como baseline quando não há nada no storage', () => {
    persistedRef('test:baseline', () => [{ id: 7 }]) // registra o ref no registry
    hydrateAll()
    expect(JSON.parse(localStorage.getItem(`${PREFIX}:test:baseline`)!)).toEqual([{ id: 7 }])
  })

  it('GRAVA no localStorage quando o ref é mutado (watch deep)', async () => {
    const r = persistedRef<{ id: number; name: string }[]>('test:write', () => [{ id: 1, name: 'a' }])
    r.value.push({ id: 2, name: 'b' })
    await nextTick()
    const stored = JSON.parse(localStorage.getItem(`${PREFIX}:test:write`)!)
    expect(stored).toHaveLength(2)
    expect(stored[1]).toEqual({ id: 2, name: 'b' })
  })

  it('grava mutação profunda de propriedade (não só push)', async () => {
    const r = persistedRef<{ id: number; status: string }[]>('test:deep', () => [{ id: 1, status: 'PENDING' }])
    r.value[0]!.status = 'PAID'
    await nextTick()
    const stored = JSON.parse(localStorage.getItem(`${PREFIX}:test:deep`)!)
    expect(stored[0].status).toBe('PAID')
  })

  it('mutação sobrevive a um "reload" (write → recreate ref → hydrateAll → read)', async () => {
    const r1 = persistedRef<{ id: number }[]>('test:roundtrip', () => [{ id: 1 }])
    r1.value.push({ id: 2 })
    await nextTick()
    // "Reload": novo ref com a mesma chave + nova hidratação (como no boot real).
    __resetHydrationFlagForTests()
    const r2 = persistedRef<{ id: number }[]>('test:roundtrip', () => [{ id: 1 }])
    hydrateAll()
    expect(r2.value).toHaveLength(2)
    expect(r2.value.map(x => x.id)).toEqual([1, 2])
  })

  it('resetMockData limpa o storage e re-semeia os refs registrados', async () => {
    const r = persistedRef<{ id: number }[]>('test:reset', () => [{ id: 1 }])
    r.value.push({ id: 2 })
    await nextTick()
    expect(r.value).toHaveLength(2)
    resetMockData()
    await nextTick()
    expect(r.value).toEqual([{ id: 1 }])
  })

  it('resetMockData grava a versão de schema atual no storage', () => {
    localStorage.setItem(VERSION_KEY, '-999')
    resetMockData()
    expect(localStorage.getItem(VERSION_KEY)).toBe(String(SCHEMA_VERSION))
  })
})
