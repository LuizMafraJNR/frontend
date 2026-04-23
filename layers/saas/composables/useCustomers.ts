export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'VIP' | 'NEW'

export const CUSTOMER_STATUS: Record<CustomerStatus, { label: string; variant: 'success' | 'neutral' | 'blue' | 'info' }> = {
  ACTIVE:   { label: 'Ativo',   variant: 'success' },
  INACTIVE: { label: 'Inativo', variant: 'neutral' },
  VIP:      { label: 'VIP',     variant: 'blue' },
  NEW:      { label: 'Novo',    variant: 'info' },
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  cpf?: string
  birthDate?: string
  gender?: 'M' | 'F' | 'OTHER'
  origin?: 'REFERRAL' | 'INSTAGRAM' | 'GOOGLE' | 'WALK_IN' | 'OTHER'
  status: CustomerStatus
  tags: string[]
  totalSpent: number
  visits: number
  lastVisitDate?: string
  since: string
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zip?: string
  }
  notes?: string
  loyaltyPoints: number
}

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cli-1',
    name: 'Maria Silva',
    phone: '(11) 91234-5678',
    email: 'maria.silva@email.com',
    cpf: '123.456.789-00',
    birthDate: '1990-05-15',
    gender: 'F',
    origin: 'REFERRAL',
    status: 'VIP',
    tags: ['Aniversariante', 'Fiel'],
    totalSpent: 3840,
    visits: 12,
    lastVisitDate: '2026-03-28',
    since: '2024-01-10',
    address: { street: 'Rua das Flores', number: '123', neighborhood: 'Jardim Paulista', city: 'São Paulo', state: 'SP', zip: '01310-100' },
    notes: 'Prefere atendimento pela manhã. Alérgica a amônia.',
    loyaltyPoints: 384,
  },
  {
    id: 'cli-2',
    name: 'João Mendes',
    phone: '(11) 92345-6789',
    email: 'joao.mendes@email.com',
    cpf: '234.567.890-11',
    birthDate: '1985-11-20',
    gender: 'M',
    origin: 'INSTAGRAM',
    status: 'ACTIVE',
    tags: ['Barba'],
    totalSpent: 1280,
    visits: 8,
    lastVisitDate: '2026-03-25',
    since: '2024-03-05',
    address: { street: 'Av. Paulista', number: '1000', complement: 'Apto 52', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', zip: '01310-200' },
    loyaltyPoints: 128,
  },
  {
    id: 'cli-3',
    name: 'Beatriz Souza',
    phone: '(11) 93456-7890',
    email: 'beatriz.souza@email.com',
    gender: 'F',
    origin: 'GOOGLE',
    status: 'ACTIVE',
    tags: [],
    totalSpent: 850,
    visits: 5,
    lastVisitDate: '2026-04-02',
    since: '2025-02-14',
    loyaltyPoints: 85,
  },
  {
    id: 'cli-4',
    name: 'Rafael Torres',
    phone: '(11) 94567-8901',
    email: 'rafael.torres@email.com',
    gender: 'M',
    origin: 'WALK_IN',
    status: 'ACTIVE',
    tags: [],
    totalSpent: 420,
    visits: 3,
    lastVisitDate: '2026-03-15',
    since: '2025-09-20',
    loyaltyPoints: 42,
  },
  {
    id: 'cli-5',
    name: 'Fernanda Lima',
    phone: '(11) 95678-9012',
    email: 'fernanda.lima@email.com',
    cpf: '345.678.901-22',
    birthDate: '1992-07-08',
    gender: 'F',
    origin: 'REFERRAL',
    status: 'VIP',
    tags: ['Fiel'],
    totalSpent: 2100,
    visits: 7,
    lastVisitDate: '2026-03-20',
    since: '2024-06-01',
    notes: 'Prefere Julia para coloração.',
    loyaltyPoints: 210,
  },
  {
    id: 'cli-6',
    name: 'Paulo Andrade',
    phone: '(11) 96789-0123',
    email: 'paulo.andrade@email.com',
    gender: 'M',
    origin: 'WALK_IN',
    status: 'INACTIVE',
    tags: [],
    totalSpent: 240,
    visits: 2,
    lastVisitDate: '2026-01-10',
    since: '2025-11-05',
    loyaltyPoints: 24,
  },
  {
    id: 'cli-7',
    name: 'Camila Ferreira',
    phone: '(11) 97890-1234',
    email: 'camila.ferreira@email.com',
    cpf: '456.789.012-33',
    birthDate: '1995-03-22',
    gender: 'F',
    origin: 'INSTAGRAM',
    status: 'ACTIVE',
    tags: ['Fiel'],
    totalSpent: 1650,
    visits: 9,
    lastVisitDate: '2026-03-18',
    since: '2024-08-12',
    loyaltyPoints: 165,
  },
  {
    id: 'cli-8',
    name: 'Lucas Oliveira',
    phone: '(11) 98901-2345',
    email: 'lucas.oliveira@email.com',
    gender: 'M',
    origin: 'REFERRAL',
    status: 'NEW',
    tags: ['Indicação'],
    totalSpent: 460,
    visits: 4,
    lastVisitDate: '2026-03-05',
    since: '2025-12-01',
    loyaltyPoints: 46,
  },
  {
    id: 'cli-9',
    name: 'Juliana Ramos',
    phone: '(11) 99012-3456',
    email: 'juliana.ramos@email.com',
    cpf: '567.890.123-44',
    birthDate: '1988-09-14',
    gender: 'F',
    origin: 'REFERRAL',
    status: 'VIP',
    tags: ['Aniversariante', 'Fiel'],
    totalSpent: 4200,
    visits: 18,
    lastVisitDate: '2026-04-01',
    since: '2023-11-20',
    address: { street: 'Rua Oscar Freire', number: '500', neighborhood: 'Jardins', city: 'São Paulo', state: 'SP', zip: '01426-001' },
    notes: 'Cliente desde a inauguração. Sempre traz indicações.',
    loyaltyPoints: 420,
  },
  {
    id: 'cli-10',
    name: 'Bruno Costa',
    phone: '(11) 90123-4567',
    email: 'bruno.costa@email.com',
    gender: 'M',
    origin: 'GOOGLE',
    status: 'ACTIVE',
    tags: [],
    totalSpent: 980,
    visits: 6,
    lastVisitDate: '2026-03-22',
    since: '2024-10-15',
    loyaltyPoints: 98,
  },
  {
    id: 'cli-11',
    name: 'Ana Pereira',
    phone: '(11) 91234-9876',
    email: 'ana.pereira@email.com',
    gender: 'F',
    origin: 'REFERRAL',
    status: 'NEW',
    tags: ['Indicação'],
    totalSpent: 120,
    visits: 1,
    lastVisitDate: '2026-03-30',
    since: '2026-03-30',
    loyaltyPoints: 12,
  },
  {
    id: 'cli-12',
    name: 'Marcos Alves',
    phone: '(11) 92345-8765',
    email: 'marcos.alves@email.com',
    gender: 'M',
    origin: 'WALK_IN',
    status: 'INACTIVE',
    tags: [],
    totalSpent: 540,
    visits: 3,
    lastVisitDate: '2025-12-20',
    since: '2025-08-10',
    loyaltyPoints: 54,
  },
]

const customers = ref<Customer[]>([])
const loading = ref(false)
const initialized = ref(false)

export const useCustomers = () => {
  const fetchAll = async () => {
    if (initialized.value) return
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 400))
    customers.value = [...MOCK_CUSTOMERS]
    initialized.value = true
    loading.value = false
  }

  const getById = (id: string): Customer | undefined => {
    return customers.value.find(c => c.id === id)
      ?? MOCK_CUSTOMERS.find(c => c.id === id)
  }

  const createCustomer = async (data: Omit<Customer, 'id' | 'loyaltyPoints' | 'visits' | 'totalSpent' | 'since'> & Partial<Pick<Customer, 'loyaltyPoints' | 'visits' | 'totalSpent' | 'since'>>) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const newCustomer: Customer = {
      ...data,
      id: `cli-${Date.now()}`,
      visits: data.visits ?? 0,
      totalSpent: data.totalSpent ?? 0,
      since: data.since ?? new Date().toISOString().slice(0, 10),
      loyaltyPoints: data.loyaltyPoints ?? 0,
    }
    customers.value.unshift(newCustomer)
    return newCustomer
  }

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const idx = customers.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      customers.value[idx] = { ...customers.value[idx], ...data }
    }
  }

  const deleteCustomer = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    customers.value = customers.value.filter(c => c.id !== id)
  }

  const searchCustomers = (query: string): Customer[] => {
    const q = query.toLowerCase()
    return customers.value.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q),
    )
  }

  return {
    customers,
    loading,
    fetchAll,
    getById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
  }
}
