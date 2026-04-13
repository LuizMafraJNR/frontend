/**
 * useProfessionals — Composable de domínio para Profissionais.
 * Mock com latência simulada de 400ms. Interface idêntica à futura API.
 */

export interface Professional {
  id: string
  name: string
  avatar?: string
  role: string
  services: string[]        // IDs de serviços que realiza
  commissionRate: number    // percentual
  status: 'active' | 'inactive' | 'vacation'
  phone: string
  email: string
  joinedAt: string          // ISO date
  appointmentsThisMonth: number
  revenueThisMonth: number
}

export interface WorkSchedule {
  professionalId: string
  days: {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    active: boolean
    startTime: string  // 'HH:MM'
    endTime: string    // 'HH:MM'
  }[]
}

export interface Blockout {
  id: string
  professionalId: string
  startDate: string
  endDate: string
  reason: string
}

const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: 'pro-1',
    name: 'Ana Costa',
    role: 'Cabeleireira Sênior',
    services: ['svc-1', 'svc-2', 'svc-3', 'svc-4'],
    commissionRate: 35,
    status: 'active',
    phone: '(11) 98765-4321',
    email: 'ana.costa@salon.com',
    joinedAt: '2022-03-15',
    appointmentsThisMonth: 52,
    revenueThisMonth: 4680,
  },
  {
    id: 'pro-2',
    name: 'Carlos Lima',
    role: 'Barbeiro',
    services: ['svc-1', 'svc-5', 'svc-6'],
    commissionRate: 30,
    status: 'active',
    phone: '(11) 97654-3210',
    email: 'carlos.lima@salon.com',
    joinedAt: '2023-01-10',
    appointmentsThisMonth: 38,
    revenueThisMonth: 1520,
  },
  {
    id: 'pro-3',
    name: 'Julia Rocha',
    role: 'Esteticista',
    services: ['svc-7', 'svc-8'],
    commissionRate: 40,
    status: 'active',
    phone: '(11) 96543-2109',
    email: 'julia.rocha@salon.com',
    joinedAt: '2023-06-01',
    appointmentsThisMonth: 29,
    revenueThisMonth: 3132,
  },
  {
    id: 'pro-4',
    name: 'Pedro Silva',
    role: 'Cabeleireiro',
    services: ['svc-1', 'svc-2'],
    commissionRate: 30,
    status: 'vacation',
    phone: '(11) 95432-1098',
    email: 'pedro.silva@salon.com',
    joinedAt: '2021-11-22',
    appointmentsThisMonth: 0,
    revenueThisMonth: 0,
  },
]

const MOCK_SCHEDULES: WorkSchedule[] = [
  {
    professionalId: 'pro-1',
    days: [
      { day: 'monday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'tuesday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'wednesday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'thursday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'friday', active: true, startTime: '09:00', endTime: '17:00' },
      { day: 'saturday', active: true, startTime: '09:00', endTime: '14:00' },
      { day: 'sunday', active: false, startTime: '09:00', endTime: '18:00' },
    ],
  },
  {
    professionalId: 'pro-2',
    days: [
      { day: 'monday', active: true, startTime: '10:00', endTime: '19:00' },
      { day: 'tuesday', active: true, startTime: '10:00', endTime: '19:00' },
      { day: 'wednesday', active: false, startTime: '10:00', endTime: '19:00' },
      { day: 'thursday', active: true, startTime: '10:00', endTime: '19:00' },
      { day: 'friday', active: true, startTime: '10:00', endTime: '19:00' },
      { day: 'saturday', active: true, startTime: '09:00', endTime: '16:00' },
      { day: 'sunday', active: false, startTime: '09:00', endTime: '18:00' },
    ],
  },
  {
    professionalId: 'pro-3',
    days: [
      { day: 'monday', active: true, startTime: '08:00', endTime: '17:00' },
      { day: 'tuesday', active: true, startTime: '08:00', endTime: '17:00' },
      { day: 'wednesday', active: true, startTime: '08:00', endTime: '17:00' },
      { day: 'thursday', active: true, startTime: '08:00', endTime: '17:00' },
      { day: 'friday', active: true, startTime: '08:00', endTime: '17:00' },
      { day: 'saturday', active: false, startTime: '08:00', endTime: '17:00' },
      { day: 'sunday', active: false, startTime: '08:00', endTime: '17:00' },
    ],
  },
  {
    professionalId: 'pro-4',
    days: [
      { day: 'monday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'tuesday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'wednesday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'thursday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'friday', active: true, startTime: '09:00', endTime: '18:00' },
      { day: 'saturday', active: false, startTime: '09:00', endTime: '18:00' },
      { day: 'sunday', active: false, startTime: '09:00', endTime: '18:00' },
    ],
  },
]

const MOCK_BLOCKOUTS: Blockout[] = [
  { id: 'blk-1', professionalId: 'pro-4', startDate: '2026-04-01', endDate: '2026-04-14', reason: 'Férias anuais' },
  { id: 'blk-2', professionalId: 'pro-1', startDate: '2026-04-10', endDate: '2026-04-10', reason: 'Consulta médica' },
]

export const useProfessionals = () => {
  const professionals = ref<Professional[]>([])
  const schedules = ref<WorkSchedule[]>([])
  const blockouts = ref<Blockout[]>([])
  const loading = ref(false)

  const fetchAll = async () => {
    loading.value = true
    await new Promise(r => setTimeout(r, 400))
    professionals.value = MOCK_PROFESSIONALS.map(p => ({ ...p }))
    schedules.value = MOCK_SCHEDULES.map(s => ({ ...s, days: s.days.map(d => ({ ...d })) }))
    blockouts.value = MOCK_BLOCKOUTS.map(b => ({ ...b }))
    loading.value = false
  }

  const getProfessional = (id: string) =>
    professionals.value.find(p => p.id === id) ?? null

  const getSchedule = (professionalId: string) =>
    schedules.value.find(s => s.professionalId === professionalId) ?? null

  const getBlockouts = (professionalId: string) =>
    blockouts.value.filter(b => b.professionalId === professionalId)

  const createProfessional = async (data: Omit<Professional, 'id' | 'appointmentsThisMonth' | 'revenueThisMonth'>) => {
    await new Promise(r => setTimeout(r, 400))
    const newPro: Professional = {
      ...data,
      id: `pro-${Date.now()}`,
      appointmentsThisMonth: 0,
      revenueThisMonth: 0,
    }
    professionals.value.push(newPro)

    // Criar horário padrão
    const defaultSchedule: WorkSchedule = {
      professionalId: newPro.id,
      days: [
        { day: 'monday', active: true, startTime: '09:00', endTime: '18:00' },
        { day: 'tuesday', active: true, startTime: '09:00', endTime: '18:00' },
        { day: 'wednesday', active: true, startTime: '09:00', endTime: '18:00' },
        { day: 'thursday', active: true, startTime: '09:00', endTime: '18:00' },
        { day: 'friday', active: true, startTime: '09:00', endTime: '18:00' },
        { day: 'saturday', active: false, startTime: '09:00', endTime: '14:00' },
        { day: 'sunday', active: false, startTime: '09:00', endTime: '18:00' },
      ],
    }
    schedules.value.push(defaultSchedule)
    return newPro
  }

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    await new Promise(r => setTimeout(r, 400))
    const idx = professionals.value.findIndex(p => p.id === id)
    if (idx >= 0) professionals.value[idx] = { ...professionals.value[idx], ...data }
  }

  const updateSchedule = async (professionalId: string, days: WorkSchedule['days']) => {
    await new Promise(r => setTimeout(r, 400))
    const idx = schedules.value.findIndex(s => s.professionalId === professionalId)
    if (idx >= 0) schedules.value[idx].days = days
  }

  const createBlockout = async (data: Omit<Blockout, 'id'>) => {
    await new Promise(r => setTimeout(r, 400))
    const newBlockout: Blockout = { ...data, id: `blk-${Date.now()}` }
    blockouts.value.push(newBlockout)
    return newBlockout
  }

  const deleteBlockout = async (id: string) => {
    await new Promise(r => setTimeout(r, 400))
    blockouts.value = blockouts.value.filter(b => b.id !== id)
  }

  const statusLabel = (status: Professional['status']) => {
    const map: Record<Professional['status'], string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      vacation: 'Férias',
    }
    return map[status]
  }

  const statusVariant = (status: Professional['status']): 'success' | 'warning' | 'default' => {
    const map: Record<Professional['status'], 'success' | 'warning' | 'default'> = {
      active: 'success',
      inactive: 'default',
      vacation: 'warning',
    }
    return map[status]
  }

  const DAY_LABELS: Record<string, string> = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
  }

  return {
    professionals,
    schedules,
    blockouts,
    loading,
    fetchAll,
    getProfessional,
    getSchedule,
    getBlockouts,
    createProfessional,
    updateProfessional,
    updateSchedule,
    createBlockout,
    deleteBlockout,
    statusLabel,
    statusVariant,
    DAY_LABELS,
  }
}
