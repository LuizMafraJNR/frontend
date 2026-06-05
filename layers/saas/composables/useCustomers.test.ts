// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { useCustomers } from './useCustomers'
import type { Customer } from './useCustomers'
import { resetMockData } from './useMockPersistence'

const makeCustomer = (over: Partial<Customer>): Customer => ({
  id: 'c-test', name: 'Teste', phone: '11999990000', email: 't@t.com',
  status: 'ACTIVE', tags: [], visits: 0, totalSpent: 0,
  since: new Date().toISOString().slice(0, 10), loyaltyPoints: 0,
  birthDate: '1990-01-01', ...over,
})

describe('useCustomers — regras de negócio', () => {
  beforeEach(() => resetMockData())

  describe('computeCustomerStatus (regras docs/screens/03-clientes.md)', () => {
    const { computeCustomerStatus } = useCustomers()
    const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

    it('VIP quando gasto > 5000', () => {
      expect(computeCustomerStatus(makeCustomer({ totalSpent: 5001, visits: 1 }))).toBe('VIP')
    })

    it('VIP quando visitas > 20', () => {
      expect(computeCustomerStatus(makeCustomer({ visits: 21, totalSpent: 100, lastVisitDate: daysAgo(1) }))).toBe('VIP')
    })

    it('NEW quando cadastrado há < 30 dias sem visita', () => {
      expect(computeCustomerStatus(makeCustomer({ since: daysAgo(10), lastVisitDate: undefined, visits: 0 }))).toBe('NEW')
    })

    it('INACTIVE quando sem visita há > 90 dias', () => {
      expect(computeCustomerStatus(makeCustomer({ since: daysAgo(400), lastVisitDate: daysAgo(120), visits: 3, totalSpent: 300 }))).toBe('INACTIVE')
    })

    it('ACTIVE quando visitou recentemente e não é VIP', () => {
      expect(computeCustomerStatus(makeCustomer({ since: daysAgo(200), lastVisitDate: daysAgo(10), visits: 5, totalSpent: 400 }))).toBe('ACTIVE')
    })
  })

  describe('addTagToCustomers (tag em lote)', () => {
    it('adiciona a tag aos clientes indicados e devolve a contagem', () => {
      const { customers, addTagToCustomers } = useCustomers()
      const ids = customers.value.slice(0, 2).map(c => c.id)
      const affected = addTagToCustomers(ids, 'Black Friday')
      expect(affected).toBe(2)
      ids.forEach(id => {
        expect(customers.value.find(c => c.id === id)!.tags).toContain('Black Friday')
      })
    })

    it('não duplica tag já existente (conta só os realmente afetados)', () => {
      const { customers, addTagToCustomers } = useCustomers()
      const id = customers.value[0]!.id
      addTagToCustomers([id], 'Fidelizada')
      const affected = addTagToCustomers([id], 'Fidelizada') // segunda vez
      expect(affected).toBe(0)
      const tags = customers.value.find(c => c.id === id)!.tags
      expect(tags.filter(t => t === 'Fidelizada')).toHaveLength(1)
    })

    it('ignora tag vazia', () => {
      const { customers, addTagToCustomers } = useCustomers()
      expect(addTagToCustomers([customers.value[0]!.id], '   ')).toBe(0)
    })
  })
})
