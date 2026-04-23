export type ReportPeriod = '7d' | '30d' | '90d' | 'year'

export interface SalesByServiceRow {
  service: string
  quantity: number
  revenue: number
  avgTicket: number
}

export interface SalesByProfessionalRow {
  professional: string
  appointments: number
  revenue: number
  commission: number
}

export interface SalesByDayRow {
  date: string
  revenue: number
  count: number
}

export interface DreMonthlyRow {
  label: string
  revenue: number
  expenses: number
  profit: number
}

export interface OperationalKpi {
  occupancyRate: number
  noShowRate: number
  avgServiceDuration: number
  totalAppointments: number
  totalServicesDone: number
}

export interface CustomerSegmentRow {
  segment: string
  count: number
  avgTicket: number
  totalRevenue: number
}

// ── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_SALES_BY_SERVICE: SalesByServiceRow[] = [
  { service: 'Corte Feminino',   quantity: 42, revenue: 4200,  avgTicket: 100 },
  { service: 'Corte Masculino',  quantity: 38, revenue: 2280,  avgTicket: 60 },
  { service: 'Coloração',        quantity: 21, revenue: 4410,  avgTicket: 210 },
  { service: 'Manicure',         quantity: 35, revenue: 1400,  avgTicket: 40 },
  { service: 'Barba',            quantity: 27, revenue: 1080,  avgTicket: 40 },
  { service: 'Escova',           quantity: 18, revenue: 1260,  avgTicket: 70 },
  { service: 'Hidratação',       quantity: 14, revenue: 1540,  avgTicket: 110 },
]

const MOCK_SALES_BY_PROFESSIONAL: SalesByProfessionalRow[] = [
  { professional: 'Julia Costa',    appointments: 58, revenue: 7480, commission: 2244 },
  { professional: 'Marcos Silva',   appointments: 51, revenue: 5100, commission: 1530 },
  { professional: 'Ana Oliveira',   appointments: 47, revenue: 5170, commission: 1551 },
  { professional: 'Paula Ferreira', appointments: 39, revenue: 3120, commission: 936 },
]

const MOCK_SALES_BY_DAY: SalesByDayRow[] = (() => {
  const today = new Date()
  const list: SalesByDayRow[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const base = 300 + Math.sin(i / 3) * 120 + Math.random() * 200
    list.push({
      date: d.toISOString().slice(0, 10),
      revenue: Math.round(base * 2.5),
      count: Math.round(6 + Math.random() * 8),
    })
  }
  return list
})()

const MOCK_DRE: DreMonthlyRow[] = [
  { label: 'Out/25', revenue: 42000, expenses: 28000, profit: 14000 },
  { label: 'Nov/25', revenue: 48000, expenses: 29500, profit: 18500 },
  { label: 'Dez/25', revenue: 54000, expenses: 31000, profit: 23000 },
  { label: 'Jan/26', revenue: 46500, expenses: 28800, profit: 17700 },
  { label: 'Fev/26', revenue: 51200, expenses: 30100, profit: 21100 },
  { label: 'Mar/26', revenue: 55800, expenses: 32400, profit: 23400 },
]

const MOCK_OPERATIONAL: OperationalKpi = {
  occupancyRate: 82,
  noShowRate: 6.5,
  avgServiceDuration: 58,
  totalAppointments: 195,
  totalServicesDone: 182,
}

const MOCK_CUSTOMER_SEGMENTS: CustomerSegmentRow[] = [
  { segment: 'VIP',         count: 18, avgTicket: 210, totalRevenue: 3780 },
  { segment: 'Fiel',        count: 46, avgTicket: 120, totalRevenue: 5520 },
  { segment: 'Regular',     count: 82, avgTicket: 75,  totalRevenue: 6150 },
  { segment: 'Novo',        count: 27, avgTicket: 60,  totalRevenue: 1620 },
  { segment: 'Inativo',     count: 35, avgTicket: 0,   totalRevenue: 0 },
]

// ── Singleton state ──────────────────────────────────────────────────────────
const salesByService = ref<SalesByServiceRow[]>([])
const salesByProfessional = ref<SalesByProfessionalRow[]>([])
const salesByDay = ref<SalesByDayRow[]>([])
const dreMonthly = ref<DreMonthlyRow[]>([])
const operationalKpi = ref<OperationalKpi>({ ...MOCK_OPERATIONAL })
const customerSegments = ref<CustomerSegmentRow[]>([])
const loading = ref(false)
const initialized = ref(false)

export const useReports = () => {
  const fetchAll = async () => {
    if (initialized.value) return
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 400))
    salesByService.value = [...MOCK_SALES_BY_SERVICE]
    salesByProfessional.value = [...MOCK_SALES_BY_PROFESSIONAL]
    salesByDay.value = [...MOCK_SALES_BY_DAY]
    dreMonthly.value = [...MOCK_DRE]
    operationalKpi.value = { ...MOCK_OPERATIONAL }
    customerSegments.value = [...MOCK_CUSTOMER_SEGMENTS]
    initialized.value = true
    loading.value = false
  }

  return {
    salesByService,
    salesByProfessional,
    salesByDay,
    dreMonthly,
    operationalKpi,
    customerSegments,
    loading,
    fetchAll,
  }
}
