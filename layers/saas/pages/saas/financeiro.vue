<script setup lang="ts">
import type { Transaction, Receivable, Payable, CommissionEntry, TxPaymentMethod } from '../../composables/useFinancial'
import { useFinancial, PERIODS } from '../../composables/useFinancial'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const route = useRoute()
const router = useRouter()

const {
  transactions, receivables, payables, commissions, monthlyData, dreData, loading,
  fetchAll, cancelTransaction, addTransaction,
  markReceivableReceived, cancelReceivable, addReceivable,
  markPayablePaid, cancelPayable, addPayable,
  payCommission,
  kpiIncome, kpiExpenses, kpiProfit, kpiReceivable, kpiPayable,
} = useFinancial()

onMounted(() => fetchAll())

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'receitas' | 'despesas' | 'receber' | 'pagar' | 'comissoes' | 'dre'
const activeTab = ref<TabKey>((route.query.tab as TabKey) || 'overview')

const tabs = [
  { key: 'overview',   label: 'Visão Geral' },
  { key: 'receitas',   label: 'Receitas' },
  { key: 'despesas',   label: 'Despesas' },
  { key: 'receber',    label: 'Contas a Receber' },
  { key: 'pagar',      label: 'Contas a Pagar' },
  { key: 'comissoes',  label: 'Comissões' },
  { key: 'dre',        label: 'DRE' },
]

// ── Period selector ───────────────────────────────────────────────────────────
const selectedPeriod = ref((route.query.period as string) || 'month')

watch([activeTab, selectedPeriod], () => {
  router.replace({
    query: {
      ...(activeTab.value !== 'overview' ? { tab: activeTab.value } : {}),
      ...(selectedPeriod.value !== 'month' ? { period: selectedPeriod.value } : {}),
    },
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (s: string) => {
  if (!s) return '—'
  const [date] = s.split(' ')
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

const formatDateShort = (s: string) => {
  if (!s) return '—'
  const [date, time] = s.split(' ')
  if (!date) return '—'
  const [, m, d] = date.split('-')
  return `${d}/${m} ${time ?? ''}`.trim()
}

const CATEGORY_LABELS: Record<string, string> = {
  SALE: 'Venda', SERVICE: 'Serviço', PRODUCT: 'Produto',
  RENT: 'Aluguel', SALARY: 'Salário', UTILITIES: 'Utilidades',
  MARKETING: 'Marketing', TAX: 'Impostos', EQUIPMENT: 'Equipamentos', OTHER: 'Outro',
}

const PAYMENT_ICONS: Record<string, string> = {
  PIX: 'i-lucide-smartphone', CASH: 'i-lucide-banknote',
  CREDIT: 'i-lucide-credit-card', DEBIT: 'i-lucide-credit-card',
  TRANSFER: 'i-lucide-arrow-right-left', BOLETO: 'i-lucide-file-text',
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', CASH: 'Dinheiro', CREDIT: 'Crédito', DEBIT: 'Débito',
  TRANSFER: 'Transferência', BOLETO: 'Boleto',
}

const kpiChange = (val: number, ref2: number): string => {
  if (!ref2) return '0'
  return ((val - ref2) / Math.abs(ref2) * 100).toFixed(1)
}

const prevIncome = 17900
const prevExpenses = 11800
const prevProfit = prevIncome - prevExpenses

// ── Bar chart (overview) ──────────────────────────────────────────────────────
const CHART_W = 680
const CHART_H = 140
const BAR_PAD = 10

const chartMax = computed(() =>
  Math.max(...monthlyData.value.flatMap(m => [m.income, m.expenses]), 1),
)
const barH = (v: number) => (v / chartMax.value) * CHART_H
const groupW = computed(() =>
  monthlyData.value.length > 0 ? CHART_W / monthlyData.value.length : 120,
)
const yLabels = computed(() => {
  const max = chartMax.value
  return [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: CHART_H * (1 - f),
    label: formatCurrency(max * f).replace('R$\xa0', 'R$').replace('.000', 'k').replace(',00', ''),
  }))
})

// ── Donut chart (overview) ────────────────────────────────────────────────────
const donutData = computed(() => {
  const incomes = transactions.value.filter(t => t.type === 'INCOME' && t.status === 'PAID')
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0) || 1
  const byCategory: Record<string, number> = {}
  incomes.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount })
  const colors: Record<string, string> = {
    SERVICE: '#3B82F6', PRODUCT: '#6366F1', SALE: '#06B6D4', OTHER: '#64748B',
  }
  return Object.entries(byCategory).map(([cat, val]) => ({
    label: CATEGORY_LABELS[cat] || cat,
    value: val,
    pct: Math.round((val / totalIncome) * 100),
    color: colors[cat] || '#94A3B8',
  })).sort((a, b) => b.value - a.value).slice(0, 4)
})

const donutSegments = computed(() => {
  const r = 40
  const cx = 50
  const cy = 50
  const circumference = 2 * Math.PI * r
  let offset = 0
  const total = donutData.value.reduce((s, d) => s + d.pct, 0) || 100
  return donutData.value.map(d => {
    const dashLen = (d.pct / total) * circumference
    const seg = { ...d, dashLen, dashOffset: -offset * circumference / total, cx, cy, r }
    offset += d.pct
    return seg
  })
})

// ── Recent transactions (overview) ───────────────────────────────────────────
const recentTransactions = computed(() =>
  [...transactions.value]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10),
)

// ── Receitas tab ──────────────────────────────────────────────────────────────
const recSearch = ref('')
const recCatFilter = ref<string | null>(null)
const recPayFilter = ref<string | null>(null)
const recPage = ref(1)
const PAGE_SIZE = 15

const filteredReceitas = computed(() => {
  let r = transactions.value.filter(t => t.type === 'INCOME')
  if (recSearch.value) {
    const q = recSearch.value.toLowerCase()
    r = r.filter(t => t.description.toLowerCase().includes(q) || (t.clientName?.toLowerCase().includes(q)))
  }
  if (recCatFilter.value) r = r.filter(t => t.category === recCatFilter.value)
  if (recPayFilter.value) r = r.filter(t => t.paymentMethod === recPayFilter.value)
  return r.sort((a, b) => b.date.localeCompare(a.date))
})
const pagedReceitas = computed(() => {
  const start = (recPage.value - 1) * PAGE_SIZE
  return filteredReceitas.value.slice(start, start + PAGE_SIZE)
})

// ── Despesas tab ──────────────────────────────────────────────────────────────
const despSearch = ref('')
const despCatFilter = ref<string | null>(null)
const despPayFilter = ref<string | null>(null)
const despPage = ref(1)

const filteredDespesas = computed(() => {
  let r = transactions.value.filter(t => t.type === 'EXPENSE')
  if (despSearch.value) {
    const q = despSearch.value.toLowerCase()
    r = r.filter(t => t.description.toLowerCase().includes(q))
  }
  if (despCatFilter.value) r = r.filter(t => t.category === despCatFilter.value)
  if (despPayFilter.value) r = r.filter(t => t.paymentMethod === despPayFilter.value)
  return r.sort((a, b) => b.date.localeCompare(a.date))
})
const pagedDespesas = computed(() => {
  const start = (despPage.value - 1) * PAGE_SIZE
  return filteredDespesas.value.slice(start, start + PAGE_SIZE)
})

// Despesas by category for bar
const despByCat = computed(() => {
  const map: Record<string, number> = {}
  filteredDespesas.value.filter(t => t.status === 'PAID').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount
  })
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
  return Object.entries(map)
    .map(([cat, val]) => ({ label: CATEGORY_LABELS[cat] || cat, val, pct: Math.round((val / total) * 100) }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 6)
})
const despMaxVal = computed(() => despByCat.value[0]?.val || 1)

// ── Contas a Receber tab ──────────────────────────────────────────────────────
const recStatusFilter = ref<string | null>(null)

const filteredRecebiveis = computed(() => {
  let r = [...receivables.value]
  if (recStatusFilter.value) r = r.filter(rec => rec.status === recStatusFilter.value)
  return r.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const pendRecebiveis = computed(() => receivables.value.filter(r => r.status === 'PENDING' || r.status === 'OVERDUE'))
const overdueRecebiveis = computed(() => receivables.value.filter(r => r.status === 'OVERDUE'))

// ── Contas a Pagar tab ────────────────────────────────────────────────────────
const payStatusFilter = ref<string | null>(null)

const filteredPagas = computed(() => {
  let r = [...payables.value]
  if (payStatusFilter.value) r = r.filter(p => p.status === payStatusFilter.value)
  return r.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const pendPayables = computed(() => payables.value.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE'))
const overduePayables = computed(() => payables.value.filter(p => p.status === 'OVERDUE'))
const nextDuePayable = computed(() =>
  payables.value
    .filter(p => p.status === 'PENDING')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0],
)

// ── Commissions ───────────────────────────────────────────────────────────────
const commissionProFilter = ref<string | null>(null)
const filteredCommissions = computed(() => {
  if (!commissionProFilter.value) return commissions.value
  return commissions.value.filter(c => c.professionalId === commissionProFilter.value)
})
const commissionProfessionalOptions = computed(() => [
  { label: 'Todos os profissionais', value: '__all__' },
  ...commissions.value.map(c => ({ label: c.professionalName, value: c.professionalId })),
])

// ── DRE ───────────────────────────────────────────────────────────────────────
const dreCompareMode = ref(true)
const dreMarginMode = ref(false)

const dreFormatVal = (val: number) => {
  if (dreMarginMode.value) return (val / 24560 * 100).toFixed(1) + '%'
  return formatCurrency(Math.abs(val))
}

// ── Drawer ────────────────────────────────────────────────────────────────────
const drawerTxId = ref<string | null>(null)
const drawerOpen = computed({
  get: () => !!drawerTxId.value,
  set: (v) => { if (!v) drawerTxId.value = null },
})
const drawerTx = computed<Transaction | null>(() =>
  drawerTxId.value ? (transactions.value.find(t => t.id === drawerTxId.value) ?? null) : null,
)

// ── Modals ────────────────────────────────────────────────────────────────────
const newTxOpen = ref(false)
const newTxType = ref<'INCOME' | 'EXPENSE'>('INCOME')
const newTxForm = ref({ description: '', amount: '', category: 'SERVICE', paymentMethod: 'PIX', date: '', notes: '' })

const openNewIncome = () => { newTxType.value = 'INCOME'; newTxOpen.value = true }
const openNewExpense = () => { newTxType.value = 'EXPENSE'; newTxOpen.value = true }

const confirmNewTx = () => {
  if (!newTxForm.value.description || !newTxForm.value.amount) {
    toast.error('Preencha todos os campos obrigatórios')
    return
  }
  addTransaction({
    description: newTxForm.value.description,
    amount: parseFloat(newTxForm.value.amount.replace(',', '.')),
    category: newTxForm.value.category as Transaction['category'],
    paymentMethod: newTxForm.value.paymentMethod as TxPaymentMethod,
    type: newTxType.value,
    status: 'PAID',
    date: newTxForm.value.date
      ? newTxForm.value.date + ' 00:00'
      : new Date().toISOString().slice(0, 16).replace('T', ' '),
    notes: newTxForm.value.notes || undefined,
  })
  toast.success(newTxType.value === 'INCOME' ? 'Receita lançada!' : 'Despesa lançada!')
  newTxOpen.value = false
  newTxForm.value = { description: '', amount: '', category: 'SERVICE', paymentMethod: 'PIX', date: '', notes: '' }
}

// Pay receivable modal
const markRecId = ref<string | null>(null)
const markRecMethod = ref<TxPaymentMethod>('PIX')
const markRecLoading = ref(false)
const markRecOpen = computed({ get: () => !!markRecId.value, set: (v) => { if (!v) markRecId.value = null } })
const recToMark = computed(() => receivables.value.find(r => r.id === markRecId.value) ?? null)

const confirmMarkReceived = async () => {
  if (!markRecId.value) return
  markRecLoading.value = true
  await markReceivableReceived(markRecId.value, markRecMethod.value)
  markRecLoading.value = false
  toast.success('Recebimento registrado!')
  markRecId.value = null
}

// Pay payable modal
const markPayId = ref<string | null>(null)
const markPayMethod = ref<TxPaymentMethod>('PIX')
const markPayLoading = ref(false)
const markPayOpen = computed({ get: () => !!markPayId.value, set: (v) => { if (!v) markPayId.value = null } })
const payToMark = computed(() => payables.value.find(p => p.id === markPayId.value) ?? null)

const confirmMarkPaid = async () => {
  if (!markPayId.value) return
  markPayLoading.value = true
  await markPayablePaid(markPayId.value, markPayMethod.value)
  markPayLoading.value = false
  toast.success('Pagamento registrado!')
  markPayId.value = null
}

// Pay commission modal
const payingCommission = ref<CommissionEntry | null>(null)
const payCommissionLoading = ref(false)
const payCommissionOpen = ref(false)

const openPayCommission = (entry: CommissionEntry) => {
  payingCommission.value = entry
  payCommissionOpen.value = true
}
const confirmPayCommission = async () => {
  if (!payingCommission.value) return
  payCommissionLoading.value = true
  await payCommission(payingCommission.value.professionalId, payingCommission.value.period)
  payCommissionLoading.value = false
  payCommissionOpen.value = false
  toast.success('Comissão marcada como paga!')
  payingCommission.value = null
}

// Cancel transaction
const handleCancelTx = async (tx: Transaction) => {
  await cancelTransaction(tx.id)
  toast.success('Transação cancelada.')
  drawerTxId.value = null
}

// ── Table columns ─────────────────────────────────────────────────────────────
const receitasColumns = [
  { key: 'data', label: 'Data', width: '110px' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'cliente', label: 'Cliente', width: '140px' },
  { key: 'categoria', label: 'Categoria', width: '110px' },
  { key: 'pagamento', label: 'Pagamento', width: '120px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'valor', label: 'Valor', width: '120px', align: 'right' as const },
  { key: 'acoes', label: '', width: '60px' },
]

const despesasColumns = [
  { key: 'data', label: 'Data', width: '110px' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'categoria', label: 'Categoria', width: '120px' },
  { key: 'pagamento', label: 'Pagamento', width: '120px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'valor', label: 'Valor', width: '120px', align: 'right' as const },
  { key: 'acoes', label: '', width: '60px' },
]

const recebiveisColumns = [
  { key: 'vencimento', label: 'Vencimento', width: '110px' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'cliente', label: 'Cliente', width: '140px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'valor', label: 'Valor', width: '120px', align: 'right' as const },
  { key: 'acoes', label: '', width: '120px' },
]

const pagaveisColumns = [
  { key: 'vencimento', label: 'Vencimento', width: '110px' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'fornecedor', label: 'Fornecedor', width: '140px' },
  { key: 'categoria', label: 'Categoria', width: '120px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'valor', label: 'Valor', width: '120px', align: 'right' as const },
  { key: 'acoes', label: '', width: '120px' },
]

const commissionColumns = [
  { key: 'profissional', label: 'Profissional' },
  { key: 'atendimentos', label: 'Atendimentos', align: 'right' as const, width: '110px' },
  { key: 'faturamento', label: 'Faturamento', align: 'right' as const, width: '120px' },
  { key: 'taxa', label: 'Taxa', align: 'right' as const, width: '80px' },
  { key: 'comissao', label: 'Comissão', align: 'right' as const, width: '120px' },
  { key: 'status', label: 'Status', width: '90px' },
  { key: 'acoes', label: '', width: '140px' },
]

// ── Table rows ────────────────────────────────────────────────────────────────
const receitasRows = computed(() => pagedReceitas.value.map(t => ({
  id: t.id, _raw: t,
  data: t.date, descricao: t.description, cliente: t.clientName || '—',
  categoria: t.category, pagamento: t.paymentMethod, status: t.status, valor: t.amount,
})))

const despesasRows = computed(() => pagedDespesas.value.map(t => ({
  id: t.id, _raw: t,
  data: t.date, descricao: t.description,
  categoria: t.category, pagamento: t.paymentMethod, status: t.status, valor: t.amount,
})))

const recebiveisRows = computed(() => filteredRecebiveis.value.map(r => ({
  id: r.id, _raw: r,
  vencimento: r.dueDate, descricao: r.description,
  cliente: r.clientName || '—', status: r.status, valor: r.amount,
})))

const pagaveisRows = computed(() => filteredPagas.value.map(p => ({
  id: p.id, _raw: p,
  vencimento: p.dueDate, descricao: p.description,
  fornecedor: p.supplierName || '—', categoria: p.category, status: p.status, valor: p.amount,
})))

const commissionRows = computed(() => filteredCommissions.value.map(c => ({
  id: c.professionalId, _raw: c,
  profissional: c.professionalName, profissionalRole: c.professionalRole,
  atendimentos: c.appointments, faturamento: c.revenue, taxa: c.rate, comissao: c.commission, status: c.status,
})))

// ── Select options ────────────────────────────────────────────────────────────
const catIncomeOptions = [
  { label: 'Todas categorias', value: '__all__' },
  { label: 'Serviço', value: 'SERVICE' }, { label: 'Produto', value: 'PRODUCT' },
  { label: 'Venda', value: 'SALE' }, { label: 'Outro', value: 'OTHER' },
]
const catExpenseOptions = [
  { label: 'Todas categorias', value: '__all__' },
  { label: 'Salário', value: 'SALARY' }, { label: 'Aluguel', value: 'RENT' },
  { label: 'Produto', value: 'PRODUCT' }, { label: 'Utilidades', value: 'UTILITIES' },
  { label: 'Marketing', value: 'MARKETING' }, { label: 'Impostos', value: 'TAX' },
  { label: 'Equipamentos', value: 'EQUIPMENT' }, { label: 'Outro', value: 'OTHER' },
]
const payMethodOptions = [
  { label: 'Todos métodos', value: '__all__' },
  { label: 'Pix', value: 'PIX' }, { label: 'Dinheiro', value: 'CASH' },
  { label: 'Crédito', value: 'CREDIT' }, { label: 'Débito', value: 'DEBIT' },
  { label: 'Transferência', value: 'TRANSFER' }, { label: 'Boleto', value: 'BOLETO' },
]
const recStatusOptions = [
  { label: 'Todos status', value: '__all__' },
  { label: 'Pendente', value: 'PENDING' }, { label: 'Vencido', value: 'OVERDUE' },
  { label: 'Recebido', value: 'RECEIVED' }, { label: 'Cancelado', value: 'CANCELLED' },
]
const payStatusOptions = [
  { label: 'Todos status', value: '__all__' },
  { label: 'Pendente', value: 'PENDING' }, { label: 'Vencido', value: 'OVERDUE' },
  { label: 'Pago', value: 'PAID' }, { label: 'Cancelado', value: 'CANCELLED' },
]
const payMethodSelectOptions = [
  { label: 'Pix', value: 'PIX' }, { label: 'Dinheiro', value: 'CASH' },
  { label: 'Crédito', value: 'CREDIT' }, { label: 'Débito', value: 'DEBIT' },
  { label: 'Transferência', value: 'TRANSFER' }, { label: 'Boleto', value: 'BOLETO' },
]
const categoryOptions = [
  { label: 'Serviço', value: 'SERVICE' }, { label: 'Produto', value: 'PRODUCT' },
  { label: 'Venda', value: 'SALE' }, { label: 'Salário', value: 'SALARY' },
  { label: 'Aluguel', value: 'RENT' }, { label: 'Utilidades', value: 'UTILITIES' },
  { label: 'Marketing', value: 'MARKETING' }, { label: 'Impostos', value: 'TAX' },
  { label: 'Outro', value: 'OTHER' },
]
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="page-financeiro">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 style="font-size: 22px; font-weight: 700; color: var(--zima-text-primary); margin: 0;">Financeiro</h1>
        <p style="font-size: 13px; color: var(--zima-text-muted); margin-top: 2px;">
          Visão completa de receitas, despesas e comissões
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Period selector -->
        <div class="flex items-center gap-1 rounded-lg p-1" style="background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);">
          <button
            v-for="p in PERIODS.slice(0, 5)"
            :key="p.value"
            style="padding: 4px 10px; font-size: 12px; font-weight: 500; border: none; cursor: pointer; border-radius: 6px; transition: all 120ms;"
            :style="{
              background: selectedPeriod === p.value ? 'var(--zima-bg-surface-3)' : 'transparent',
              color: selectedPeriod === p.value ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
            }"
            @click="selectedPeriod = p.value"
          >
            {{ p.label }}
          </button>
        </div>
        <ZimaButton size="sm" @click="openNewIncome">
          <template #icon-left>
            <Icon name="i-lucide-plus" style="width: 14px; height: 14px;" />
          </template>
          Receita
        </ZimaButton>
        <ZimaButton size="sm" variant="ghost" @click="openNewExpense">
          <template #icon-left>
            <Icon name="i-lucide-minus" style="width: 14px; height: 14px;" />
          </template>
          Despesa
        </ZimaButton>
      </div>
    </div>

    <!-- ── Sub-tabs ────────────────────────────────────────────────────────── -->
    <div style="border-bottom: 1px solid var(--zima-border-divider); display: flex; gap: 4px;">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        style="padding: 10px 16px; font-size: 13px; font-weight: 500; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 150ms; white-space: nowrap;"
        :style="{
          color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
          borderBottomColor: activeTab === tab.key ? 'var(--zima-blue-core)' : 'transparent',
          marginBottom: '-1px',
        }"
        @click="activeTab = tab.key as TabKey"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Visão Geral -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'overview'">

      <!-- KPI Cards 5 columns -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
        <!-- Receita -->
        <div
          style="padding: 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); cursor: pointer;"
          @click="activeTab = 'receitas'"
        >
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted);">RECEITA</span>
            <Icon name="i-lucide-trending-up" style="width: 14px; height: 14px; color: #10B981;" />
          </div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: #10B981; margin-bottom: 4px;">
            {{ formatCurrency(kpiIncome) }}
          </div>
          <ZimaBadge variant="success" size="sm">+{{ kpiChange(kpiIncome, prevIncome) }}% vs anterior</ZimaBadge>
        </div>

        <!-- Despesas -->
        <div
          style="padding: 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); cursor: pointer;"
          @click="activeTab = 'despesas'"
        >
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted);">DESPESAS</span>
            <Icon name="i-lucide-trending-down" style="width: 14px; height: 14px; color: #EF4444;" />
          </div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: #EF4444; margin-bottom: 4px;">
            {{ formatCurrency(kpiExpenses) }}
          </div>
          <ZimaBadge variant="danger" size="sm">+{{ kpiChange(kpiExpenses, prevExpenses) }}% vs anterior</ZimaBadge>
        </div>

        <!-- Lucro -->
        <div style="padding: 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted);">LUCRO LÍQUIDO</span>
            <Icon name="i-lucide-dollar-sign" style="width: 14px; height: 14px; color: var(--zima-text-muted);" />
          </div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: var(--zima-text-primary); margin-bottom: 4px;">
            {{ formatCurrency(kpiProfit) }}
          </div>
          <div style="font-size: 11px; color: var(--zima-text-muted); margin-bottom: 4px;">
            Margem: {{ kpiIncome > 0 ? Math.round((kpiProfit / kpiIncome) * 100) : 0 }}%
          </div>
          <!-- Proportion bar -->
          <div style="height: 4px; background: rgba(239,68,68,0.3); border-radius: 99px; overflow: hidden; margin-top: 6px;">
            <div style="height: 100%; background: #10B981; border-radius: 99px; transition: width 500ms;"
              :style="{ width: kpiIncome > 0 ? Math.round((kpiProfit / kpiIncome) * 100) + '%' : '0%' }" />
          </div>
        </div>

        <!-- Contas a Receber -->
        <div
          style="padding: 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); cursor: pointer;"
          :style="{ borderLeftWidth: '3px', borderLeftColor: overdueRecebiveis.length > 0 ? '#EF4444' : 'var(--zima-border-default)' }"
          @click="activeTab = 'receber'"
        >
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted);">A RECEBER</span>
            <Icon name="i-lucide-clock" style="width: 14px; height: 14px; color: #F59E0B;" />
          </div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: #F59E0B; margin-bottom: 4px;">
            {{ formatCurrency(kpiReceivable) }}
          </div>
          <div style="font-size: 11px; color: var(--zima-text-muted);">
            {{ pendRecebiveis.length }} pendentes
            <span v-if="overdueRecebiveis.length > 0" style="color: #EF4444;"> • {{ overdueRecebiveis.length }} vencida(s)</span>
          </div>
        </div>

        <!-- Contas a Pagar -->
        <div
          style="padding: 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); cursor: pointer;"
          :style="{ borderLeftWidth: '3px', borderLeftColor: overduePayables.length > 0 ? '#EF4444' : 'var(--zima-border-default)' }"
          @click="activeTab = 'pagar'"
        >
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted);">A PAGAR</span>
            <Icon name="i-lucide-calendar-clock" style="width: 14px; height: 14px; color: #F59E0B;" />
          </div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: #F59E0B; margin-bottom: 4px;">
            {{ formatCurrency(kpiPayable) }}
          </div>
          <div style="font-size: 11px; color: var(--zima-text-muted);">
            {{ pendPayables.length }} pendentes
            <span v-if="nextDuePayable"> • próxima: {{ formatDate(nextDuePayable.dueDate) }}</span>
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div style="display: grid; grid-template-columns: 8fr 4fr; gap: 16px;">

        <!-- Bar chart -->
        <div style="padding: 20px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Receita vs Despesas</span>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(16,185,129,0.7);" />
                <span style="font-size: 11px; color: var(--zima-text-muted);">Receita</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(239,68,68,0.65);" />
                <span style="font-size: 11px; color: var(--zima-text-muted);">Despesa</span>
              </div>
            </div>
          </div>
          <svg
            :viewBox="'-48 -10 ' + (CHART_W + 60) + ' ' + (CHART_H + 50)"
            style="width: 100%; height: 180px; overflow: visible;"
          >
            <g v-for="label in yLabels" :key="label.y">
              <line :x1="0" :x2="CHART_W" :y1="label.y" :y2="label.y" stroke="var(--zima-border-divider)" stroke-width="1" />
              <text :x="-8" :y="label.y + 4" text-anchor="end" style="font-size: 10px; fill: var(--zima-text-muted);">{{ label.label }}</text>
            </g>
            <g v-for="(m, idx) in monthlyData" :key="m.month" :transform="'translate(' + (idx * groupW) + ', 0)'">
              <rect :x="BAR_PAD" :y="CHART_H - barH(m.income)" :width="(groupW - BAR_PAD * 3) / 2" :height="barH(m.income)" fill="rgba(16,185,129,0.7)" rx="3">
                <title>{{ m.month }} Receita: {{ formatCurrency(m.income) }}</title>
              </rect>
              <rect :x="BAR_PAD + (groupW - BAR_PAD * 3) / 2 + 2" :y="CHART_H - barH(m.expenses)" :width="(groupW - BAR_PAD * 3) / 2" :height="barH(m.expenses)" fill="rgba(239,68,68,0.65)" rx="3">
                <title>{{ m.month }} Despesas: {{ formatCurrency(m.expenses) }}</title>
              </rect>
              <text :x="groupW / 2" :y="CHART_H + 18" text-anchor="middle" style="font-size: 11px; fill: var(--zima-text-muted);">{{ m.month }}</text>
            </g>
          </svg>
        </div>

        <!-- Donut chart -->
        <div style="padding: 20px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary); margin-bottom: 16px;">Receita por Categoria</div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <svg viewBox="0 0 100 100" style="width: 100px; height: 100px; flex-shrink: 0; transform: rotate(-90deg);">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.08)" stroke-width="18" />
              <circle
                v-for="seg in donutSegments"
                :key="seg.label"
                cx="50" cy="50" r="40"
                fill="none"
                :stroke="seg.color"
                stroke-width="18"
                :stroke-dasharray="seg.dashLen + ' ' + (251.2 - seg.dashLen)"
                :stroke-dashoffset="seg.dashOffset"
              />
            </svg>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <div v-for="d in donutData" :key="d.label" style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;" :style="{ background: d.color }" />
                <div style="flex: 1; font-size: 12px; color: var(--zima-text-secondary);">{{ d.label }}</div>
                <span style="font-size: 11px; font-weight: 600; color: var(--zima-text-primary);">{{ d.pct }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent transactions -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <div style="padding: 14px 20px; border-bottom: 1px solid var(--zima-border-divider); display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Últimas Movimentações</span>
          <button style="font-size: 12px; color: var(--zima-blue-core); background: none; border: none; cursor: pointer;" @click="activeTab = 'receitas'">Ver todas →</button>
        </div>
        <div>
          <div
            v-for="tx in recentTransactions"
            :key="tx.id"
            style="display: flex; align-items: center; gap-12px; padding: 10px 20px; border-bottom: 1px solid var(--zima-border-divider); cursor: pointer; transition: background 100ms;"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-3)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
            @click="drawerTxId = tx.id"
          >
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
              <div style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                :style="{ background: tx.type === 'INCOME' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)' }">
                <Icon :name="tx.type === 'INCOME' ? 'i-lucide-arrow-down-left' : 'i-lucide-arrow-up-right'" style="width: 14px; height: 14px;"
                  :style="{ color: tx.type === 'INCOME' ? '#10B981' : '#EF4444' }" />
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; color: var(--zima-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ tx.description }}</div>
                <div style="font-size: 11px; color: var(--zima-text-muted);">{{ formatDateShort(tx.date) }} · {{ PAYMENT_LABELS[tx.paymentMethod] }}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <ZimaBadge :variant="tx.status === 'PAID' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'neutral'" size="sm">
                {{ tx.status === 'PAID' ? 'Pago' : tx.status === 'PENDING' ? 'Pendente' : 'Cancelado' }}
              </ZimaBadge>
              <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 600; min-width: 100px; text-align: right;"
                :style="{
                  color: tx.status === 'CANCELLED' ? 'var(--zima-text-muted)' : tx.type === 'INCOME' ? '#10B981' : '#EF4444',
                  textDecoration: tx.status === 'CANCELLED' ? 'line-through' : 'none',
                }">
                {{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Receitas -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'receitas'">
      <!-- KPI summary row -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">TOTAL RECEBIDO</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #10B981;">{{ formatCurrency(kpiIncome) }}</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">PENDENTE</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #F59E0B;">
            {{ formatCurrency(transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').reduce((s, t) => s + t.amount, 0)) }}
          </div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">LANÇAMENTOS</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: var(--zima-text-primary);">{{ filteredReceitas.length }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <ZimaInput v-model="recSearch" type="search" placeholder="Buscar receita ou cliente..." />
        </div>
        <ZimaSelect :model-value="recCatFilter ?? '__all__'" :options="catIncomeOptions" style="min-width: 160px;"
          @update:model-value="recCatFilter = $event === '__all__' ? null : ($event as string)" />
        <ZimaSelect :model-value="recPayFilter ?? '__all__'" :options="payMethodOptions" style="min-width: 160px;"
          @update:model-value="recPayFilter = $event === '__all__' ? null : ($event as string)" />
        <ZimaButton size="sm" variant="ghost" @click="openNewIncome">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 13px; height: 13px;" /></template>
          Nova Receita
        </ZimaButton>
      </div>

      <!-- Table -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <ZimaTable
          :columns="receitasColumns" :rows="receitasRows" :loading="loading"
          :total="filteredReceitas.length" :page="recPage" :page-size="PAGE_SIZE"
          row-clickable
          empty-title="Nenhuma receita encontrada"
          @row-click="(row) => { drawerTxId = row.id as string }"
          @page-change="recPage = $event"
        >
          <template #cell-data="{ row }">
            <span style="font-size: 12px; color: var(--zima-text-muted); font-family: 'Geist Mono', monospace;">{{ formatDateShort(row.data as string) }}</span>
          </template>
          <template #cell-descricao="{ row }">
            <span style="font-size: 13px; color: var(--zima-text-primary); max-width: 200px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ row.descricao }}</span>
          </template>
          <template #cell-cliente="{ row }">
            <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ row.cliente }}</span>
          </template>
          <template #cell-categoria="{ row }">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--zima-text-muted);">{{ CATEGORY_LABELS[row.categoria as string] }}</span>
          </template>
          <template #cell-pagamento="{ row }">
            <div style="display: flex; align-items: center; gap: 6px;">
              <Icon :name="PAYMENT_ICONS[row.pagamento as string]" style="width: 12px; height: 12px; color: var(--zima-text-muted);" />
              <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ PAYMENT_LABELS[row.pagamento as string] }}</span>
            </div>
          </template>
          <template #cell-status="{ row }">
            <ZimaBadge :variant="row.status === 'PAID' ? 'success' : row.status === 'PENDING' ? 'warning' : 'neutral'" size="sm">
              {{ row.status === 'PAID' ? 'Pago' : row.status === 'PENDING' ? 'Pendente' : 'Cancelado' }}
            </ZimaBadge>
          </template>
          <template #cell-valor="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 600;"
              :style="{ color: (row._raw as Transaction).status === 'CANCELLED' ? 'var(--zima-text-muted)' : '#10B981',
                textDecoration: (row._raw as Transaction).status === 'CANCELLED' ? 'line-through' : 'none' }">
              +{{ formatCurrency(row.valor as number) }}
            </span>
          </template>
          <template #cell-acoes="{ row }">
            <button style="font-size: 12px; color: var(--zima-blue-core); background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px;"
              @click.stop="drawerTxId = row.id as string">Ver</button>
          </template>
        </ZimaTable>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Despesas -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'despesas'">
      <!-- KPI summary row -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">TOTAL PAGO</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #EF4444;">{{ formatCurrency(kpiExpenses) }}</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">PENDENTE</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #F59E0B;">
            {{ formatCurrency(transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').reduce((s, t) => s + t.amount, 0)) }}
          </div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">LANÇAMENTOS</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: var(--zima-text-primary);">{{ filteredDespesas.length }}</div>
        </div>
      </div>

      <!-- Category breakdown bars -->
      <div style="padding: 20px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
        <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-primary); margin-bottom: 14px;">Distribuição por Categoria</div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div v-for="cat in despByCat" :key="cat.label">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ cat.label }}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-family: 'Geist Mono', monospace; font-size: 12px; color: var(--zima-text-primary);">{{ formatCurrency(cat.val) }}</span>
                <span style="font-size: 11px; color: var(--zima-text-muted);">{{ cat.pct }}%</span>
              </div>
            </div>
            <div style="height: 6px; background: rgba(148,163,184,0.08); border-radius: 99px; overflow: hidden;">
              <div style="height: 100%; border-radius: 99px; background: #EF4444; opacity: 0.75; transition: width 500ms;"
                :style="{ width: Math.round((cat.val / despMaxVal) * 100) + '%' }" />
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <ZimaInput v-model="despSearch" type="search" placeholder="Buscar despesa..." />
        </div>
        <ZimaSelect :model-value="despCatFilter ?? '__all__'" :options="catExpenseOptions" style="min-width: 160px;"
          @update:model-value="despCatFilter = $event === '__all__' ? null : ($event as string)" />
        <ZimaSelect :model-value="despPayFilter ?? '__all__'" :options="payMethodOptions" style="min-width: 160px;"
          @update:model-value="despPayFilter = $event === '__all__' ? null : ($event as string)" />
        <ZimaButton size="sm" variant="ghost" @click="openNewExpense">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 13px; height: 13px;" /></template>
          Nova Despesa
        </ZimaButton>
      </div>

      <!-- Table -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <ZimaTable
          :columns="despesasColumns" :rows="despesasRows" :loading="loading"
          :total="filteredDespesas.length" :page="despPage" :page-size="PAGE_SIZE"
          row-clickable
          empty-title="Nenhuma despesa encontrada"
          @row-click="(row) => { drawerTxId = row.id as string }"
          @page-change="despPage = $event"
        >
          <template #cell-data="{ row }">
            <span style="font-size: 12px; color: var(--zima-text-muted); font-family: 'Geist Mono', monospace;">{{ formatDateShort(row.data as string) }}</span>
          </template>
          <template #cell-descricao="{ row }">
            <span style="font-size: 13px; color: var(--zima-text-primary); max-width: 200px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ row.descricao }}</span>
          </template>
          <template #cell-categoria="{ row }">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--zima-text-muted);">{{ CATEGORY_LABELS[row.categoria as string] }}</span>
          </template>
          <template #cell-pagamento="{ row }">
            <div style="display: flex; align-items: center; gap: 6px;">
              <Icon :name="PAYMENT_ICONS[row.pagamento as string]" style="width: 12px; height: 12px; color: var(--zima-text-muted);" />
              <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ PAYMENT_LABELS[row.pagamento as string] }}</span>
            </div>
          </template>
          <template #cell-status="{ row }">
            <ZimaBadge :variant="row.status === 'PAID' ? 'success' : row.status === 'PENDING' ? 'warning' : 'neutral'" size="sm">
              {{ row.status === 'PAID' ? 'Pago' : row.status === 'PENDING' ? 'Pendente' : 'Cancelado' }}
            </ZimaBadge>
          </template>
          <template #cell-valor="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 600;"
              :style="{ color: (row._raw as Transaction).status === 'CANCELLED' ? 'var(--zima-text-muted)' : '#EF4444',
                textDecoration: (row._raw as Transaction).status === 'CANCELLED' ? 'line-through' : 'none' }">
              -{{ formatCurrency(row.valor as number) }}
            </span>
          </template>
          <template #cell-acoes="{ row }">
            <button style="font-size: 12px; color: var(--zima-blue-core); background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px;"
              @click.stop="drawerTxId = row.id as string">Ver</button>
          </template>
        </ZimaTable>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Contas a Receber -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'receber'">
      <!-- Summary -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">PENDENTE</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #F59E0B;">{{ formatCurrency(kpiReceivable) }}</div>
          <div style="font-size: 11px; color: var(--zima-text-muted); margin-top: 2px;">{{ pendRecebiveis.length }} parcelas</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);"
          :style="{ borderLeftWidth: '3px', borderLeftColor: overdueRecebiveis.length > 0 ? '#EF4444' : 'transparent' }">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">VENCIDO</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #EF4444;">
            {{ formatCurrency(overdueRecebiveis.reduce((s, r) => s + r.amount, 0)) }}
          </div>
          <div style="font-size: 11px; color: var(--zima-text-muted); margin-top: 2px;">{{ overdueRecebiveis.length }} em atraso</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">RECEBIDO (MÊS)</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #10B981;">
            {{ formatCurrency(receivables.filter(r => r.status === 'RECEIVED').reduce((s, r) => s + r.amount, 0)) }}
          </div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">TOTAL LANÇAMENTOS</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: var(--zima-text-primary);">{{ receivables.length }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <ZimaSelect :model-value="recStatusFilter ?? '__all__'" :options="recStatusOptions" style="min-width: 160px;"
          @update:model-value="recStatusFilter = $event === '__all__' ? null : ($event as string)" />
        <div style="flex: 1;" />
        <ZimaButton size="sm" @click="toast.info('Abrir modal de novo lançamento a receber')">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 13px; height: 13px;" /></template>
          Novo Lançamento
        </ZimaButton>
      </div>

      <!-- Table -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <ZimaTable
          :columns="recebiveisColumns" :rows="recebiveisRows" :loading="loading"
          empty-title="Nenhum lançamento encontrado"
        >
          <template #cell-vencimento="{ row }">
            <span
              style="font-size: 12px; font-family: 'Geist Mono', monospace;"
              :style="{ color: (row._raw as Receivable).status === 'OVERDUE' ? '#EF4444' : 'var(--zima-text-muted)' }"
            >
              {{ formatDate(row.vencimento as string) }}
              <span v-if="(row._raw as Receivable).status === 'OVERDUE'" style="font-size: 10px; font-weight: 600;"> ⚠</span>
            </span>
          </template>
          <template #cell-descricao="{ row }">
            <div>
              <div style="font-size: 13px; color: var(--zima-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px;">{{ row.descricao }}</div>
              <div v-if="(row._raw as Receivable).installmentOf" style="font-size: 11px; color: var(--zima-text-muted);">
                Parcela {{ (row._raw as Receivable).installmentCurrent }}/{{ (row._raw as Receivable).installmentOf }}
              </div>
            </div>
          </template>
          <template #cell-cliente="{ row }">
            <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ row.cliente }}</span>
          </template>
          <template #cell-status="{ row }">
            <ZimaBadge
              :variant="row.status === 'RECEIVED' ? 'success' : row.status === 'OVERDUE' ? 'danger' : row.status === 'PENDING' ? 'warning' : 'neutral'"
              size="sm"
            >
              {{ row.status === 'RECEIVED' ? 'Recebido' : row.status === 'OVERDUE' ? 'Vencido' : row.status === 'PENDING' ? 'Pendente' : 'Cancelado' }}
            </ZimaBadge>
          </template>
          <template #cell-valor="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 600; color: #10B981;">
              {{ formatCurrency(row.valor as number) }}
            </span>
          </template>
          <template #cell-acoes="{ row }">
            <div style="display: flex; align-items: center; gap: 6px;" @click.stop>
              <button
                v-if="(row._raw as Receivable).status === 'PENDING' || (row._raw as Receivable).status === 'OVERDUE'"
                style="font-size: 12px; color: #10B981; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 6px; padding: 3px 8px; cursor: pointer;"
                @click="markRecId = row.id as string; markRecMethod = 'PIX'"
              >
                Receber
              </button>
              <button
                v-if="(row._raw as Receivable).status !== 'RECEIVED' && (row._raw as Receivable).status !== 'CANCELLED'"
                style="font-size: 12px; color: var(--zima-text-muted); background: none; border: none; cursor: pointer; padding: 3px 6px;"
                @click="cancelReceivable(row.id as string).then(() => toast.success('Lançamento cancelado'))"
              >
                Cancelar
              </button>
            </div>
          </template>
        </ZimaTable>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Contas a Pagar -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'pagar'">
      <!-- Summary -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">PENDENTE</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #F59E0B;">{{ formatCurrency(kpiPayable) }}</div>
          <div style="font-size: 11px; color: var(--zima-text-muted); margin-top: 2px;">{{ pendPayables.length }} contas</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);"
          :style="{ borderLeftWidth: '3px', borderLeftColor: overduePayables.length > 0 ? '#EF4444' : 'transparent' }">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">VENCIDO</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #EF4444;">
            {{ formatCurrency(overduePayables.reduce((s, p) => s + p.amount, 0)) }}
          </div>
          <div style="font-size: 11px; color: var(--zima-text-muted); margin-top: 2px;">{{ overduePayables.length }} em atraso</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">PAGO (MÊS)</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #10B981;">
            {{ formatCurrency(payables.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)) }}
          </div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">PRÓXIMO VENCIMENTO</div>
          <div v-if="nextDuePayable" style="font-size: 15px; font-weight: 600; color: var(--zima-text-primary); margin-top: 4px;">{{ formatDate(nextDuePayable.dueDate) }}</div>
          <div v-if="nextDuePayable" style="font-size: 11px; color: var(--zima-text-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ nextDuePayable.description }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <ZimaSelect :model-value="payStatusFilter ?? '__all__'" :options="payStatusOptions" style="min-width: 160px;"
          @update:model-value="payStatusFilter = $event === '__all__' ? null : ($event as string)" />
        <div style="flex: 1;" />
        <ZimaButton size="sm" @click="toast.info('Abrir modal de nova conta a pagar')">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 13px; height: 13px;" /></template>
          Nova Conta
        </ZimaButton>
      </div>

      <!-- Table -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <ZimaTable
          :columns="pagaveisColumns" :rows="pagaveisRows" :loading="loading"
          empty-title="Nenhum lançamento encontrado"
        >
          <template #cell-vencimento="{ row }">
            <div>
              <span
                style="font-size: 12px; font-family: 'Geist Mono', monospace;"
                :style="{ color: (row._raw as Payable).status === 'OVERDUE' ? '#EF4444' : 'var(--zima-text-muted)' }"
              >
                {{ formatDate(row.vencimento as string) }}
              </span>
              <div v-if="(row._raw as Payable).recurrent" style="display: flex; align-items: center; gap: 3px; margin-top: 2px;">
                <Icon name="i-lucide-repeat" style="width: 10px; height: 10px; color: var(--zima-text-muted);" />
                <span style="font-size: 10px; color: var(--zima-text-muted);">Recorrente</span>
              </div>
            </div>
          </template>
          <template #cell-descricao="{ row }">
            <span style="font-size: 13px; color: var(--zima-text-primary); max-width: 200px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ row.descricao }}</span>
          </template>
          <template #cell-fornecedor="{ row }">
            <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ row.fornecedor }}</span>
          </template>
          <template #cell-categoria="{ row }">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--zima-text-muted);">{{ CATEGORY_LABELS[row.categoria as string] }}</span>
          </template>
          <template #cell-status="{ row }">
            <ZimaBadge
              :variant="row.status === 'PAID' ? 'success' : row.status === 'OVERDUE' ? 'danger' : row.status === 'PENDING' ? 'warning' : 'neutral'"
              size="sm"
            >
              {{ row.status === 'PAID' ? 'Pago' : row.status === 'OVERDUE' ? 'Vencido' : row.status === 'PENDING' ? 'Pendente' : 'Cancelado' }}
            </ZimaBadge>
          </template>
          <template #cell-valor="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 600;"
              :style="{ color: (row._raw as Payable).status === 'PAID' ? 'var(--zima-text-muted)' : '#EF4444' }">
              {{ formatCurrency(row.valor as number) }}
            </span>
          </template>
          <template #cell-acoes="{ row }">
            <div style="display: flex; align-items: center; gap: 6px;" @click.stop>
              <button
                v-if="(row._raw as Payable).status === 'PENDING' || (row._raw as Payable).status === 'OVERDUE'"
                style="font-size: 12px; color: #10B981; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 6px; padding: 3px 8px; cursor: pointer;"
                @click="markPayId = row.id as string; markPayMethod = 'PIX'"
              >
                Pagar
              </button>
              <button
                v-if="(row._raw as Payable).status !== 'PAID' && (row._raw as Payable).status !== 'CANCELLED'"
                style="font-size: 12px; color: var(--zima-text-muted); background: none; border: none; cursor: pointer; padding: 3px 6px;"
                @click="cancelPayable(row.id as string).then(() => toast.success('Lançamento cancelado'))"
              >
                Cancelar
              </button>
            </div>
          </template>
        </ZimaTable>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Comissões -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'comissoes'">
      <!-- Totals summary -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">TOTAL A PAGAR</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #F59E0B;">
            {{ formatCurrency(commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.commission, 0)) }}
          </div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">FATURAMENTO TOTAL</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: var(--zima-text-primary);">
            {{ formatCurrency(commissions.reduce((s, c) => s + c.revenue, 0)) }}
          </div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">PROFISSIONAIS</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: var(--zima-text-primary);">{{ commissions.length }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <ZimaSelect
          :model-value="commissionProFilter ?? '__all__'"
          :options="commissionProfessionalOptions"
          style="min-width: 220px;"
          @update:model-value="commissionProFilter = $event === '__all__' ? null : ($event as string)"
        />
      </div>

      <!-- Cards per professional -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div
          v-for="c in filteredCommissions"
          :key="c.professionalId"
          style="padding: 20px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);"
        >
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <ZimaAvatar :name="c.professionalName" size="md" />
              <div>
                <div style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">{{ c.professionalName }}</div>
                <div style="font-size: 12px; color: var(--zima-text-muted);">{{ c.professionalRole }} · {{ c.period }}</div>
              </div>
            </div>
            <ZimaBadge :variant="c.status === 'PAID' ? 'success' : 'warning'" size="sm">
              {{ c.status === 'PAID' ? 'Pago' : 'Pendente' }}
            </ZimaBadge>
          </div>

          <!-- Metrics -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11px; color: var(--zima-text-muted); margin-bottom: 2px;">Atendimentos</div>
              <div style="font-size: 18px; font-weight: 700; color: var(--zima-text-primary);">{{ c.appointments }}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--zima-text-muted); margin-bottom: 2px;">Faturamento</div>
              <div style="font-family: 'Geist Mono', monospace; font-size: 16px; font-weight: 700; color: var(--zima-text-primary);">{{ formatCurrency(c.revenue) }}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--zima-text-muted); margin-bottom: 2px;">Comissão ({{ c.rate }}%)</div>
              <div style="font-family: 'Geist Mono', monospace; font-size: 18px; font-weight: 700; color: #F59E0B;">{{ formatCurrency(c.commission) }}</div>
            </div>
          </div>

          <!-- Service breakdown -->
          <div v-if="c.serviceBreakdown && c.serviceBreakdown.length > 0" style="margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--zima-text-muted); margin-bottom: 8px;">Serviços</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div v-for="svc in c.serviceBreakdown" :key="svc.service" style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ svc.service }} ({{ svc.count }}×)</span>
                <span style="font-family: 'Geist Mono', monospace; font-size: 12px; color: var(--zima-text-primary);">{{ formatCurrency(svc.revenue) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 8px;">
            <ZimaButton
              v-if="c.status === 'PENDING' && c.commission > 0"
              size="sm"
              @click="openPayCommission(c)"
            >
              Pagar Comissão
            </ZimaButton>
            <ZimaButton variant="ghost" size="sm" @click="navigateTo('/saas/equipe/' + c.professionalId)">
              Ver Profissional
            </ZimaButton>
          </div>
        </div>
      </div>

      <!-- Table view -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <div style="padding: 14px 20px; border-bottom: 1px solid var(--zima-border-divider);">
          <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Resumo em tabela</span>
        </div>
        <ZimaTable
          :columns="commissionColumns" :rows="commissionRows" :loading="loading"
          empty-title="Nenhuma comissão"
        >
          <template #cell-profissional="{ row }">
            <div style="display: flex; align-items: center; gap: 10px;">
              <ZimaAvatar :name="row.profissional as string" size="sm" />
              <div>
                <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ row.profissional }}</div>
                <div style="font-size: 11px; color: var(--zima-text-muted);">{{ row.profissionalRole }}</div>
              </div>
            </div>
          </template>
          <template #cell-atendimentos="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-secondary);">{{ row.atendimentos }}</span>
          </template>
          <template #cell-faturamento="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-primary);">{{ formatCurrency(row.faturamento as number) }}</span>
          </template>
          <template #cell-taxa="{ row }">
            <span style="font-size: 13px; color: var(--zima-text-secondary);">{{ row.taxa }}%</span>
          </template>
          <template #cell-comissao="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 14px; font-weight: 700; color: var(--zima-text-primary);">{{ formatCurrency(row.comissao as number) }}</span>
          </template>
          <template #cell-status="{ row }">
            <ZimaBadge :variant="row.status === 'PAID' ? 'success' : 'warning'" size="sm">
              {{ row.status === 'PAID' ? 'Pago' : 'Pendente' }}
            </ZimaBadge>
          </template>
          <template #cell-acoes="{ row }">
            <ZimaButton
              v-if="row.status === 'PENDING' && (row._raw as CommissionEntry).commission > 0"
              variant="ghost" size="sm"
              @click="openPayCommission(row._raw as CommissionEntry)"
            >
              Pagar comissão
            </ZimaButton>
            <span v-else style="font-size: 12px; color: var(--zima-text-muted);">—</span>
          </template>
        </ZimaTable>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: DRE -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'dre'">
      <!-- Header controls -->
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="font-size: 16px; font-weight: 600; color: var(--zima-text-primary); margin: 0;">Demonstrativo de Resultado do Exercício</h2>
          <p style="font-size: 12px; color: var(--zima-text-muted); margin-top: 2px;">Comparativo Abril 2026 vs Março 2026</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--zima-text-secondary);">
            <input type="checkbox" v-model="dreCompareMode" style="width: 14px; height: 14px;" />
            Comparar com mês anterior
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--zima-text-secondary);">
            <input type="checkbox" v-model="dreMarginMode" style="width: 14px; height: 14px;" />
            Exibir como % da receita
          </label>
          <ZimaButton variant="ghost" size="sm" @click="toast.info('Exportar DRE...')">
            <template #icon-left><Icon name="i-lucide-download" style="width: 13px; height: 13px;" /></template>
            Exportar
          </ZimaButton>
        </div>
      </div>

      <!-- DRE Table -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <!-- Header row -->
        <div style="display: grid; padding: 12px 20px; border-bottom: 1px solid var(--zima-border-default); background: var(--zima-bg-surface-3);"
          :style="{ gridTemplateColumns: dreCompareMode ? '1fr 140px 140px 100px' : '1fr 140px' }">
          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted);">Descrição</span>
          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); text-align: right;">Abr 2026</span>
          <span v-if="dreCompareMode" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); text-align: right;">Mar 2026</span>
          <span v-if="dreCompareMode" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); text-align: right;">Var.</span>
        </div>

        <!-- DRE rows -->
        <div
          v-for="row in dreData"
          :key="row.key"
          style="display: grid; padding: 10px 20px; border-bottom: 1px solid var(--zima-border-divider); transition: background 100ms;"
          :style="{
            gridTemplateColumns: dreCompareMode ? '1fr 140px 140px 100px' : '1fr 140px',
            paddingLeft: row.indent ? (20 + row.indent * 16) + 'px' : '20px',
            background: row.isSubtotal ? 'var(--zima-bg-surface-3)' : 'transparent',
            borderTopWidth: row.isSubtotal ? '1px' : '0',
            borderTopColor: 'var(--zima-border-default)',
          }"
          @mouseenter="!row.isSubtotal && (($event.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.04)')"
          @mouseleave="!row.isSubtotal && (($event.currentTarget as HTMLElement).style.background = row.isSubtotal ? 'var(--zima-bg-surface-3)' : 'transparent')"
        >
          <!-- Label -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <span
              :style="{
                fontSize: row.isSubtotal ? '13px' : '12px',
                fontWeight: row.isSubtotal ? '700' : row.type === 'net' ? '800' : '400',
                color: row.type === 'net' ? (row.current >= 0 ? '#10B981' : '#EF4444')
                  : row.isSubtotal ? 'var(--zima-text-primary)' : 'var(--zima-text-secondary)',
              }"
            >{{ row.label }}</span>
          </div>

          <!-- Current value -->
          <span style="text-align: right; font-family: 'Geist Mono', monospace;"
            :style="{
              fontSize: row.isSubtotal ? '14px' : '13px',
              fontWeight: row.isSubtotal ? '700' : '400',
              color: row.type === 'net' ? (row.current >= 0 ? '#10B981' : '#EF4444')
                : row.type === 'income' || row.isSubtotal ? 'var(--zima-text-primary)' : '#EF4444',
            }">
            {{ dreMarginMode ? (row.current / 24560 * 100).toFixed(1) + '%' : (row.current >= 0 ? '' : '-') + formatCurrency(Math.abs(row.current)) }}
          </span>

          <!-- Previous value -->
          <span v-if="dreCompareMode" style="text-align: right; font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-muted);">
            {{ dreMarginMode ? (row.previous / 17900 * 100).toFixed(1) + '%' : (row.previous >= 0 ? '' : '-') + formatCurrency(Math.abs(row.previous)) }}
          </span>

          <!-- Variation -->
          <span v-if="dreCompareMode" style="text-align: right; font-size: 12px; font-weight: 600;"
            :style="{ color: row.current >= row.previous ? '#10B981' : '#EF4444' }">
            {{ row.previous !== 0 ? (((row.current - row.previous) / Math.abs(row.previous)) * 100).toFixed(1) + '%' : '—' }}
          </span>
        </div>
      </div>

      <!-- DRE note -->
      <div style="padding: 12px 16px; background: rgba(59,130,246,0.06); border-radius: var(--zima-radius-md); border: 1px solid rgba(59,130,246,0.15); display: flex; align-items: flex-start; gap: 10px;">
        <Icon name="i-lucide-info" style="width: 14px; height: 14px; color: var(--zima-blue-core); flex-shrink: 0; margin-top: 1px;" />
        <p style="font-size: 12px; color: var(--zima-text-secondary); margin: 0; line-height: 1.6;">
          Os valores refletem o regime de caixa (entradas e saídas efetivas). Impostos estimados com base no Simples Nacional (5% da receita bruta).
          Para DRE por competência, configure a integração contábil nas <NuxtLink to="/saas/configuracoes" style="color: var(--zima-blue-core);">configurações</NuxtLink>.
        </p>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- DRAWER: Detalhes da Transação -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <ZimaDrawer v-model="drawerOpen" title="Detalhes da Transação" width="480px">
      <template v-if="drawerTx">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <ZimaBadge :variant="drawerTx.type === 'INCOME' ? 'success' : 'danger'">
                {{ drawerTx.type === 'INCOME' ? 'Receita' : 'Despesa' }}
              </ZimaBadge>
              <ZimaBadge :variant="drawerTx.status === 'PAID' ? 'success' : drawerTx.status === 'PENDING' ? 'warning' : 'neutral'">
                {{ drawerTx.status === 'PAID' ? 'Pago' : drawerTx.status === 'PENDING' ? 'Pendente' : 'Cancelado' }}
              </ZimaBadge>
            </div>
            <div style="font-family: 'Geist Mono', monospace; font-size: 28px; font-weight: 700;"
              :style="{
                color: drawerTx.status === 'CANCELLED' ? 'var(--zima-text-muted)' : drawerTx.type === 'INCOME' ? '#10B981' : '#EF4444',
                textDecoration: drawerTx.status === 'CANCELLED' ? 'line-through' : 'none',
              }">
              {{ drawerTx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(drawerTx.amount) }}
            </div>
            <p style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">{{ drawerTx.description }}</p>
          </div>

          <div class="flex flex-col gap-2 rounded-lg p-3" style="background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);">
            <div class="flex items-center justify-between">
              <span style="font-size: 12px; color: var(--zima-text-muted);">Data</span>
              <span style="font-size: 13px; color: var(--zima-text-primary);">{{ formatDateShort(drawerTx.date) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span style="font-size: 12px; color: var(--zima-text-muted);">Categoria</span>
              <span style="font-size: 13px; color: var(--zima-text-primary);">{{ CATEGORY_LABELS[drawerTx.category] }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span style="font-size: 12px; color: var(--zima-text-muted);">Pagamento</span>
              <div class="flex items-center gap-1.5">
                <Icon :name="PAYMENT_ICONS[drawerTx.paymentMethod]" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
                <span style="font-size: 13px; color: var(--zima-text-primary);">{{ PAYMENT_LABELS[drawerTx.paymentMethod] }}</span>
              </div>
            </div>
            <div v-if="drawerTx.installments" class="flex items-center justify-between">
              <span style="font-size: 12px; color: var(--zima-text-muted);">Parcelamento</span>
              <span style="font-size: 13px; color: var(--zima-text-primary);">Parcela {{ drawerTx.installmentCurrent }}/{{ drawerTx.installments }}</span>
            </div>
          </div>

          <div v-if="drawerTx.clientName" class="flex flex-col gap-1.5">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); font-weight: 600;">Cliente</span>
            <div class="flex items-center gap-3">
              <ZimaAvatar :name="drawerTx.clientName" size="sm" />
              <NuxtLink v-if="drawerTx.clientId" :to="'/saas/clientes/' + drawerTx.clientId"
                style="font-size: 13px; font-weight: 500; color: var(--zima-blue-core); text-decoration: none;"
                @click="drawerOpen = false">{{ drawerTx.clientName }}</NuxtLink>
              <span v-else style="font-size: 13px; color: var(--zima-text-primary);">{{ drawerTx.clientName }}</span>
            </div>
          </div>

          <div v-if="drawerTx.professionalName" class="flex flex-col gap-1.5">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); font-weight: 600;">Profissional</span>
            <div class="flex items-center gap-3">
              <ZimaAvatar :name="drawerTx.professionalName" size="sm" />
              <NuxtLink v-if="drawerTx.professionalId" :to="'/saas/equipe/' + drawerTx.professionalId"
                style="font-size: 13px; font-weight: 500; color: var(--zima-blue-core); text-decoration: none;"
                @click="drawerOpen = false">{{ drawerTx.professionalName }}</NuxtLink>
              <span v-else style="font-size: 13px; color: var(--zima-text-primary);">{{ drawerTx.professionalName }}</span>
            </div>
          </div>

          <div v-if="drawerTx.items?.length" class="flex flex-col gap-1.5">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); font-weight: 600;">Itens</span>
            <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--zima-border-default);">
              <div v-for="(item, i) in drawerTx.items" :key="i"
                class="flex items-center justify-between px-3 py-2"
                :style="{ borderBottom: i < drawerTx.items!.length - 1 ? '1px solid var(--zima-border-divider)' : 'none' }">
                <span style="font-size: 13px; color: var(--zima-text-primary);">{{ item.name }}</span>
                <div class="flex items-center gap-3">
                  <span style="font-size: 12px; color: var(--zima-text-muted);">× {{ item.qty }}</span>
                  <span style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-primary);">{{ formatCurrency(item.price) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="drawerTx.notes" class="flex flex-col gap-1.5">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); font-weight: 600;">Observações</span>
            <p style="font-size: 13px; color: var(--zima-text-secondary);">{{ drawerTx.notes }}</p>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center gap-2 w-full">
          <ZimaButton v-if="drawerTx && drawerTx.status !== 'CANCELLED'" variant="danger" size="sm"
            @click="handleCancelTx(drawerTx!)">
            <template #icon-left><Icon name="i-lucide-x-circle" style="width: 13px; height: 13px;" /></template>
            Cancelar / Estornar
          </ZimaButton>
          <div class="flex-1" />
          <ZimaButton variant="ghost" @click="drawerOpen = false">Fechar</ZimaButton>
        </div>
      </template>
    </ZimaDrawer>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Nova Transação (Receita / Despesa) -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="newTxOpen" :title="newTxType === 'INCOME' ? 'Nova Receita' : 'Nova Despesa'" size="md">
      <div class="flex flex-col gap-4">
        <ZimaInput v-model="newTxForm.description" label="Descrição *" placeholder="Ex: Corte + Escova — Maria Silva" />
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <ZimaInput v-model="newTxForm.amount" label="Valor (R$) *" type="number" placeholder="0,00" />
          <ZimaInput v-model="newTxForm.date" label="Data" type="date" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 12px; color: var(--zima-text-secondary); margin-bottom: 6px;">Categoria *</div>
            <ZimaSelect v-model="newTxForm.category" :options="newTxType === 'INCOME' ? catIncomeOptions.slice(1) : catExpenseOptions.slice(1)" />
          </div>
          <div>
            <div style="font-size: 12px; color: var(--zima-text-secondary); margin-bottom: 6px;">Forma de pagamento</div>
            <ZimaSelect v-model="newTxForm.paymentMethod" :options="payMethodSelectOptions" />
          </div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--zima-text-secondary); margin-bottom: 6px;">Observações</div>
          <textarea
            v-model="newTxForm.notes"
            placeholder="Informações adicionais..."
            style="width: 100%; min-height: 72px; background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default); border-radius: var(--zima-radius-md); padding: 8px 12px; font-size: 13px; color: var(--zima-text-primary); resize: vertical; outline: none; font-family: inherit;"
          />
        </div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <ZimaButton variant="ghost" @click="newTxOpen = false">Cancelar</ZimaButton>
          <ZimaButton @click="confirmNewTx">
            {{ newTxType === 'INCOME' ? 'Lançar Receita' : 'Lançar Despesa' }}
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Registrar Recebimento -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="markRecOpen" title="Registrar Recebimento" size="sm">
      <div v-if="recToMark" class="flex flex-col gap-4">
        <div style="padding: 14px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-md); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary); margin-bottom: 4px;">{{ recToMark.description }}</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: #10B981;">{{ formatCurrency(recToMark.amount) }}</div>
          <div style="font-size: 12px; color: var(--zima-text-muted); margin-top: 2px;">Vencimento: {{ formatDate(recToMark.dueDate) }}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--zima-text-secondary); margin-bottom: 6px;">Forma de pagamento recebida</div>
          <ZimaSelect v-model="markRecMethod" :options="payMethodSelectOptions" />
        </div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <ZimaButton variant="ghost" @click="markRecId = null">Cancelar</ZimaButton>
          <ZimaButton :loading="markRecLoading" @click="confirmMarkReceived">Confirmar Recebimento</ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Registrar Pagamento -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="markPayOpen" title="Registrar Pagamento" size="sm">
      <div v-if="payToMark" class="flex flex-col gap-4">
        <div style="padding: 14px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-md); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary); margin-bottom: 4px;">{{ payToMark.description }}</div>
          <div v-if="payToMark.supplierName" style="font-size: 12px; color: var(--zima-text-muted); margin-bottom: 4px;">{{ payToMark.supplierName }}</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: #EF4444;">{{ formatCurrency(payToMark.amount) }}</div>
          <div style="font-size: 12px; color: var(--zima-text-muted); margin-top: 2px;">Vencimento: {{ formatDate(payToMark.dueDate) }}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--zima-text-secondary); margin-bottom: 6px;">Forma de pagamento utilizada</div>
          <ZimaSelect v-model="markPayMethod" :options="payMethodSelectOptions" />
        </div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <ZimaButton variant="ghost" @click="markPayId = null">Cancelar</ZimaButton>
          <ZimaButton :loading="markPayLoading" @click="confirmMarkPaid">Confirmar Pagamento</ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Pagar Comissão -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="payCommissionOpen" title="Confirmar Pagamento de Comissão" size="sm"
      @update:model-value="payCommissionOpen = $event">
      <div v-if="payingCommission" class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <ZimaAvatar :name="payingCommission.professionalName" />
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">{{ payingCommission.professionalName }}</div>
            <div style="font-size: 12px; color: var(--zima-text-muted);">{{ payingCommission.period }}</div>
          </div>
        </div>
        <div class="rounded-lg p-4 flex flex-col gap-2" style="background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);">
          <div class="flex items-center justify-between">
            <span style="font-size: 12px; color: var(--zima-text-muted);">Faturamento gerado</span>
            <span style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-primary);">{{ formatCurrency(payingCommission.revenue) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span style="font-size: 12px; color: var(--zima-text-muted);">Taxa de comissão</span>
            <span style="font-size: 13px; color: var(--zima-text-primary);">{{ payingCommission.rate }}%</span>
          </div>
          <div class="flex items-center justify-between pt-2" style="border-top: 1px solid var(--zima-border-divider);">
            <span style="font-size: 13px; font-weight: 600; color: var(--zima-text-primary);">Total a pagar</span>
            <span style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: #10B981;">{{ formatCurrency(payingCommission.commission) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <ZimaButton variant="ghost" @click="payCommissionOpen = false">Cancelar</ZimaButton>
          <ZimaButton :loading="payCommissionLoading" @click="confirmPayCommission">Confirmar Pagamento</ZimaButton>
        </div>
      </template>
    </ZimaModal>

  </div>
</template>
