/**
 * useAppointments — Composable de domínio para Agendamentos.
 * Mock com latência simulada de 400ms. Interface idêntica à futura API.
 */

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface AppointmentStatusEvent {
  status: AppointmentStatus
  at: string   // ISO datetime
  label: string
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientVisits: number
  clientSince: string     // ex: 'jan/2024'
  serviceId: string
  serviceName: string
  serviceDuration: number // minutos
  professionalId: string
  professionalName: string
  professionalRole: string
  date: string            // YYYY-MM-DD
  startTime: string       // HH:MM
  endTime: string         // HH:MM
  price: number
  status: AppointmentStatus
  notes?: string
  internalNotes?: string
  cancelReason?: string
  statusHistory: AppointmentStatusEvent[]
}

// ─── Exportado para reutilização no Dashboard e AgendaDayView ───────────────

export const STATUS_STYLE: Record<AppointmentStatus, { bg: string; border: string; label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'blue' }> = {
  PENDING:     { bg: 'rgba(245,158,11,0.10)',  border: '#F59E0B', label: 'Pendente',        variant: 'warning' },
  CONFIRMED:   { bg: 'rgba(59,130,246,0.10)',  border: '#3B82F6', label: 'Confirmado',      variant: 'blue' },
  CHECKED_IN:  { bg: 'rgba(139,92,246,0.10)',  border: '#8B5CF6', label: 'Check-in',        variant: 'neutral' },
  IN_PROGRESS: { bg: 'rgba(99,102,241,0.10)',  border: '#6366F1', label: 'Em atendimento',  variant: 'info' },
  COMPLETED:   { bg: 'rgba(16,185,129,0.10)',  border: '#10B981', label: 'Concluído',       variant: 'success' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.05)',   border: '#EF4444', label: 'Cancelado',       variant: 'danger' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const todayISO = (): string => new Date().toISOString().slice(0, 10)

const offsetDate = (base: string, days: number): string => {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const isoNow = (): string => new Date().toISOString()

// ─── Mock data ───────────────────────────────────────────────────────────────

const buildAppointments = (): Appointment[] => {
  const today = todayISO()
  const yday = offsetDate(today, -1)
  const yday2 = offsetDate(today, -2)
  const yday3 = offsetDate(today, -3)
  const tmr = offsetDate(today, 1)
  const tmr2 = offsetDate(today, 2)
  const tmr3 = offsetDate(today, 3)

  return [
    // ── Hoje ──────────────────────────────────────────────────────────────
    {
      id: 'apt-1',
      clientId: 'cli-1', clientName: 'Maria Silva',   clientPhone: '(11) 91234-5678', clientEmail: 'maria.silva@email.com', clientVisits: 12, clientSince: 'jan/2024',
      serviceId: 'svc-2', serviceName: 'Corte + Escova', serviceDuration: 60,
      professionalId: 'pro-1', professionalName: 'Ana Costa', professionalRole: 'Cabeleireira Sênior',
      date: today, startTime: '08:00', endTime: '09:00', price: 80,
      status: 'COMPLETED',
      statusHistory: [
        { status: 'PENDING',   at: `${today}T07:30:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED', at: `${today}T07:31:00`, label: 'Confirmado' },
        { status: 'CHECKED_IN', at: `${today}T07:55:00`, label: 'Check-in realizado' },
        { status: 'IN_PROGRESS', at: `${today}T08:00:00`, label: 'Atendimento iniciado' },
        { status: 'COMPLETED', at: `${today}T09:00:00`, label: 'Concluído' },
      ],
    },
    {
      id: 'apt-2',
      clientId: 'cli-2', clientName: 'João Mendes',   clientPhone: '(11) 92345-6789', clientEmail: 'joao.mendes@email.com', clientVisits: 8, clientSince: 'mar/2024',
      serviceId: 'svc-1', serviceName: 'Corte Masculino', serviceDuration: 60,
      professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
      date: today, startTime: '09:00', endTime: '10:00', price: 45,
      status: 'COMPLETED',
      statusHistory: [
        { status: 'PENDING',   at: `${today}T08:30:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED', at: `${today}T08:32:00`, label: 'Confirmado' },
        { status: 'COMPLETED', at: `${today}T10:00:00`, label: 'Concluído' },
      ],
    },
    {
      id: 'apt-3',
      clientId: 'cli-3', clientName: 'Beatriz Souza', clientPhone: '(11) 93456-7890', clientEmail: 'beatriz.souza@email.com', clientVisits: 5, clientSince: 'fev/2025',
      serviceId: 'svc-3', serviceName: 'Coloração + Hidratação', serviceDuration: 90,
      professionalId: 'pro-1', professionalName: 'Ana Costa', professionalRole: 'Cabeleireira Sênior',
      date: today, startTime: '10:00', endTime: '11:30', price: 180,
      status: 'IN_PROGRESS',
      statusHistory: [
        { status: 'PENDING',    at: `${today}T09:00:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED',  at: `${today}T09:15:00`, label: 'Confirmado' },
        { status: 'CHECKED_IN', at: `${today}T09:55:00`, label: 'Check-in realizado' },
        { status: 'IN_PROGRESS', at: `${today}T10:00:00`, label: 'Atendimento iniciado' },
      ],
    },
    {
      id: 'apt-4',
      clientId: 'cli-4', clientName: 'Rafael Torres', clientPhone: '(11) 94567-8901', clientEmail: 'rafael.torres@email.com', clientVisits: 3, clientSince: 'jan/2026',
      serviceId: 'svc-5', serviceName: 'Barba + Cabelo', serviceDuration: 45,
      professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
      date: today, startTime: '11:00', endTime: '11:45', price: 50,
      status: 'CONFIRMED',
      statusHistory: [
        { status: 'PENDING',   at: `${today}T10:00:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED', at: `${today}T10:05:00`, label: 'Confirmado' },
      ],
    },
    {
      id: 'apt-5',
      clientId: 'cli-5', clientName: 'Fernanda Lima', clientPhone: '(11) 95678-9012', clientEmail: 'fernanda.lima@email.com', clientVisits: 7, clientSince: 'jun/2024',
      serviceId: 'svc-7', serviceName: 'Limpeza de Pele', serviceDuration: 60,
      professionalId: 'pro-3', professionalName: 'Julia Rocha', professionalRole: 'Esteticista',
      date: today, startTime: '13:00', endTime: '14:00', price: 120,
      status: 'CONFIRMED',
      statusHistory: [
        { status: 'PENDING',   at: `${today}T11:00:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED', at: `${today}T11:10:00`, label: 'Confirmado' },
      ],
    },
    {
      id: 'apt-6',
      clientId: 'cli-6', clientName: 'Paulo Andrade', clientPhone: '(11) 96789-0123', clientEmail: 'paulo.andrade@email.com', clientVisits: 2, clientSince: 'mar/2026',
      serviceId: 'svc-1', serviceName: 'Corte Masculino', serviceDuration: 30,
      professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
      date: today, startTime: '14:00', endTime: '14:30', price: 45,
      status: 'PENDING',
      statusHistory: [
        { status: 'PENDING', at: `${today}T12:00:00`, label: 'Agendamento criado' },
      ],
    },
    {
      id: 'apt-7',
      clientId: 'cli-7', clientName: 'Camila Ferreira', clientPhone: '(11) 97890-1234', clientEmail: 'camila.ferreira@email.com', clientVisits: 9, clientSince: 'ago/2024',
      serviceId: 'svc-2', serviceName: 'Corte Feminino', serviceDuration: 60,
      professionalId: 'pro-1', professionalName: 'Ana Costa', professionalRole: 'Cabeleireira Sênior',
      date: today, startTime: '15:00', endTime: '16:00', price: 80,
      status: 'PENDING',
      statusHistory: [
        { status: 'PENDING', at: `${today}T13:00:00`, label: 'Agendamento criado' },
      ],
    },
    {
      id: 'apt-8',
      clientId: 'cli-8', clientName: 'Lucas Oliveira', clientPhone: '(11) 98901-2345', clientEmail: 'lucas.oliveira@email.com', clientVisits: 4, clientSince: 'dez/2025',
      serviceId: 'svc-5', serviceName: 'Barba Completa', serviceDuration: 30,
      professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
      date: today, startTime: '16:00', endTime: '16:30', price: 35,
      status: 'PENDING',
      statusHistory: [
        { status: 'PENDING', at: `${today}T13:30:00`, label: 'Agendamento criado' },
      ],
    },
    // ── Ontem ──────────────────────────────────────────────────────────────
    {
      id: 'apt-9',
      clientId: 'cli-1', clientName: 'Maria Silva', clientPhone: '(11) 91234-5678', clientEmail: 'maria.silva@email.com', clientVisits: 12, clientSince: 'jan/2024',
      serviceId: 'svc-8', serviceName: 'Hidratação Facial', serviceDuration: 45,
      professionalId: 'pro-3', professionalName: 'Julia Rocha', professionalRole: 'Esteticista',
      date: yday, startTime: '10:00', endTime: '10:45', price: 90,
      status: 'COMPLETED',
      statusHistory: [
        { status: 'PENDING',    at: `${yday}T09:00:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED',  at: `${yday}T09:10:00`, label: 'Confirmado' },
        { status: 'COMPLETED',  at: `${yday}T10:45:00`, label: 'Concluído' },
      ],
    },
    {
      id: 'apt-10',
      clientId: 'cli-3', clientName: 'Beatriz Souza', clientPhone: '(11) 93456-7890', clientEmail: 'beatriz.souza@email.com', clientVisits: 5, clientSince: 'fev/2025',
      serviceId: 'svc-1', serviceName: 'Corte Masculino', serviceDuration: 30,
      professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
      date: yday2, startTime: '14:00', endTime: '14:30', price: 45,
      status: 'COMPLETED',
      statusHistory: [
        { status: 'PENDING',   at: `${yday2}T13:00:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED', at: `${yday2}T13:05:00`, label: 'Confirmado' },
        { status: 'COMPLETED', at: `${yday2}T14:30:00`, label: 'Concluído' },
      ],
    },
    {
      id: 'apt-11',
      clientId: 'cli-5', clientName: 'Fernanda Lima', clientPhone: '(11) 95678-9012', clientEmail: 'fernanda.lima@email.com', clientVisits: 7, clientSince: 'jun/2024',
      serviceId: 'svc-6', serviceName: 'Barba + Bigode', serviceDuration: 45,
      professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
      date: yday3, startTime: '09:00', endTime: '09:45', price: 50,
      status: 'CANCELLED',
      cancelReason: 'Cliente não compareceu',
      statusHistory: [
        { status: 'PENDING',   at: `${yday3}T08:00:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED', at: `${yday3}T08:10:00`, label: 'Confirmado' },
        { status: 'CANCELLED', at: `${yday3}T09:15:00`, label: 'Cancelado — Cliente não compareceu' },
      ],
    },
    // ── Amanhã ──────────────────────────────────────────────────────────────
    {
      id: 'apt-12',
      clientId: 'cli-2', clientName: 'João Mendes', clientPhone: '(11) 92345-6789', clientEmail: 'joao.mendes@email.com', clientVisits: 8, clientSince: 'mar/2024',
      serviceId: 'svc-3', serviceName: 'Escova Progressiva', serviceDuration: 120,
      professionalId: 'pro-1', professionalName: 'Ana Costa', professionalRole: 'Cabeleireira Sênior',
      date: tmr, startTime: '09:00', endTime: '11:00', price: 180,
      status: 'CONFIRMED',
      statusHistory: [
        { status: 'PENDING',   at: `${today}T14:00:00`, label: 'Agendamento criado' },
        { status: 'CONFIRMED', at: `${today}T14:05:00`, label: 'Confirmado' },
      ],
    },
    {
      id: 'apt-13',
      clientId: 'cli-4', clientName: 'Rafael Torres', clientPhone: '(11) 94567-8901', clientEmail: 'rafael.torres@email.com', clientVisits: 3, clientSince: 'jan/2026',
      serviceId: 'svc-7', serviceName: 'Limpeza de Pele', serviceDuration: 60,
      professionalId: 'pro-3', professionalName: 'Julia Rocha', professionalRole: 'Esteticista',
      date: tmr, startTime: '14:00', endTime: '15:00', price: 120,
      status: 'PENDING',
      statusHistory: [
        { status: 'PENDING', at: `${today}T15:00:00`, label: 'Agendamento criado' },
      ],
    },
    {
      id: 'apt-14',
      clientId: 'cli-7', clientName: 'Camila Ferreira', clientPhone: '(11) 97890-1234', clientEmail: 'camila.ferreira@email.com', clientVisits: 9, clientSince: 'ago/2024',
      serviceId: 'svc-5', serviceName: 'Barba Completa', serviceDuration: 30,
      professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
      date: tmr2, startTime: '10:00', endTime: '10:30', price: 35,
      status: 'PENDING',
      statusHistory: [
        { status: 'PENDING', at: `${today}T16:00:00`, label: 'Agendamento criado' },
      ],
    },
    {
      id: 'apt-15',
      clientId: 'cli-6', clientName: 'Paulo Andrade', clientPhone: '(11) 96789-0123', clientEmail: 'paulo.andrade@email.com', clientVisits: 2, clientSince: 'mar/2026',
      serviceId: 'svc-2', serviceName: 'Corte Feminino', serviceDuration: 60,
      professionalId: 'pro-1', professionalName: 'Ana Costa', professionalRole: 'Cabeleireira Sênior',
      date: tmr3, startTime: '11:00', endTime: '12:00', price: 80,
      status: 'PENDING',
      statusHistory: [
        { status: 'PENDING', at: `${today}T17:00:00`, label: 'Agendamento criado' },
      ],
    },
  ]
}

// ─── Composable ─────────────────────────────────────────────────────────────

export const useAppointments = () => {
  const appointments = ref<Appointment[]>([])
  const loading = ref(false)

  const fetchAll = async () => {
    loading.value = true
    await new Promise(r => setTimeout(r, 400))
    appointments.value = buildAppointments()
    loading.value = false
  }

  const fetchByDate = async (date: string) => {
    loading.value = true
    await new Promise(r => setTimeout(r, 300))
    const result = appointments.value.filter(a => a.date === date)
    loading.value = false
    return result
  }

  const fetchByWeek = (startDate: string): Appointment[] => {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return appointments.value.filter(a => {
      const d = new Date(a.date + 'T00:00:00')
      return d >= start && d < end
    })
  }

  const getById = (id: string): Appointment | null =>
    appointments.value.find(a => a.id === id) ?? null

  const updateStatus = async (id: string, status: AppointmentStatus, reason?: string) => {
    await new Promise(r => setTimeout(r, 400))
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx < 0) return
    const apt = appointments.value[idx]
    apt.status = status
    if (reason && status === 'CANCELLED') apt.cancelReason = reason
    apt.statusHistory.push({ status, at: isoNow(), label: STATUS_STYLE[status].label })
  }

  const createAppointment = async (data: Omit<Appointment, 'id' | 'statusHistory'>) => {
    await new Promise(r => setTimeout(r, 400))
    const newApt: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      statusHistory: [{ status: 'PENDING', at: isoNow(), label: 'Agendamento criado' }],
    }
    appointments.value.push(newApt)
    return newApt
  }

  const updateInternalNotes = async (id: string, notes: string) => {
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx >= 0) appointments.value[idx].internalNotes = notes
  }

  const reschedule = async (id: string, date: string, startTime: string, professionalId?: string, professionalName?: string) => {
    await new Promise(r => setTimeout(r, 400))
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx < 0) return
    const apt = appointments.value[idx]
    apt.date = date
    apt.startTime = startTime
    apt.endTime = addMinutes(startTime, apt.serviceDuration)
    if (professionalId) apt.professionalId = professionalId
    if (professionalName) apt.professionalName = professionalName
    apt.statusHistory.push({ status: apt.status, at: isoNow(), label: `Reagendado para ${date} ${startTime}` })
  }

  // Gera slots de 30min para um profissional em uma data, removendo os ocupados
  const getAvailableSlots = (professionalId: string, date: string, duration: number): { time: string; available: boolean }[] => {
    const occupied = appointments.value
      .filter(a => a.professionalId === professionalId && a.date === date && a.status !== 'CANCELLED')
      .map(a => ({ start: a.startTime, end: a.endTime }))

    const slots: { time: string; available: boolean }[] = []
    for (let h = 8; h < 20; h++) {
      for (const m of [0, 30]) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        const end = addMinutes(time, duration)
        if (end > '20:00') break
        const conflict = occupied.some(o => time < o.end && end > o.start)
        slots.push({ time, available: !conflict })
      }
    }
    return slots
  }

  const appointmentsForDate = computed(() =>
    (date: string) => appointments.value.filter(a => a.date === date)
  )

  return {
    appointments,
    loading,
    fetchAll,
    fetchByDate,
    fetchByWeek,
    getById,
    updateStatus,
    createAppointment,
    updateInternalNotes,
    reschedule,
    getAvailableSlots,
    appointmentsForDate,
    STATUS_STYLE,
  }
}
