export interface DashboardActivityItem {
  id: string
  icon: string
  color: string
  description: string
  timeLabel: string
  to: string
}

const MOCK_ACTIVITY: DashboardActivityItem[] = [
  { id: 'act-1', icon: 'i-lucide-calendar-plus', color: 'var(--zima-blue-light)', description: 'Novo agendamento: Maria Silva — Corte Feminino — 16:00', timeLabel: 'há 5 min',  to: '/saas/agenda' },
  { id: 'act-2', icon: 'i-lucide-credit-card',   color: 'var(--zima-success)',    description: 'Venda registrada: R$ 145,00 — João Santos',              timeLabel: 'há 12 min', to: '/saas/financeiro' },
  { id: 'act-3', icon: 'i-lucide-star',          color: 'var(--zima-warning)',    description: 'Nova avaliação: 5 estrelas — Ana Costa',                 timeLabel: 'há 1h',     to: '/saas/clientes' },
  { id: 'act-4', icon: 'i-lucide-user-plus',     color: 'var(--zima-blue-light)', description: 'Novo cliente cadastrado: Pedro Lima',                    timeLabel: 'há 2h',     to: '/saas/clientes' },
  { id: 'act-5', icon: 'i-lucide-calendar-x',    color: 'var(--zima-danger)',     description: 'Cancelamento: Rafael Torres — Barba (reagendado)',       timeLabel: 'há 2h',     to: '/saas/agenda' },
  { id: 'act-6', icon: 'i-lucide-credit-card',   color: 'var(--zima-success)',    description: 'Venda registrada: R$ 89,00 (Cartão) — Beatriz Souza',   timeLabel: 'há 3h',     to: '/saas/financeiro' },
  { id: 'act-7', icon: 'i-lucide-message-square',color: 'var(--zima-info)',       description: 'Mensagem recebida: Fernanda Lima via WhatsApp',          timeLabel: 'há 4h',     to: '/saas/inbox' },
  { id: 'act-8', icon: 'i-lucide-tag',           color: 'var(--zima-text-muted)', description: 'Tag VIP aplicada: Camila Ferreira',                      timeLabel: 'há 5h',     to: '/saas/clientes' },
]

const activity = ref<DashboardActivityItem[]>([])
const loading = ref(false)
const initialized = ref(false)

export const useDashboardActivity = () => {
  const fetchAll = async () => {
    if (initialized.value) return
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 300))
    activity.value = [...MOCK_ACTIVITY]
    initialized.value = true
    loading.value = false
  }

  return {
    activity,
    loading,
    fetchAll,
  }
}
