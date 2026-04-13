<script setup lang="ts">
definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const route = useRoute()
const router = useRouter()

// ── Composables ──────────────────────────────────────────────────────────────
const { services, servicesByCategory, loading: servicesLoading, fetchAll: fetchServices } = useServices()
const { professionals, fetchAll: fetchProfessionals } = useProfessionals()
const { customers, fetchAll: fetchCustomers } = useCustomers()
const { receivables, fetchAll: fetchFinancial } = useFinancial()

onMounted(async () => {
  await Promise.all([fetchServices(), fetchProfessionals(), fetchCustomers(), fetchFinancial()])

  // Pre-fill from appointment query params
  const { appointmentId, clientId, serviceId, professionalId } = route.query
  if (appointmentId) {
    prefillFromAppointment(
      clientId as string,
      serviceId as string,
      professionalId as string,
    )
  }
})

// ── View mode (pdv vs historico) ──────────────────────────────────────────────
const activeView = ref<'pdv' | 'historico'>((route.query.view as 'pdv' | 'historico') || 'pdv')
watch(activeView, v => router.replace({ query: v === 'historico' ? { view: v } : {} }))

// ── Tab ───────────────────────────────────────────────────────────────────────
const activeTab = ref<'services' | 'products'>('services')
const serviceSearch = ref('')
const productSearch = ref('')

// ── Mock products ─────────────────────────────────────────────────────────────
interface Product {
  id: string; name: string; price: number; stock: number; category: string; image?: string
}
const MOCK_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Shampoo Wella Luxe', price: 89.90, stock: 5, category: 'Cabelo' },
  { id: 'prod-2', name: 'Máscara Kerastase', price: 145.00, stock: 3, category: 'Tratamento' },
  { id: 'prod-3', name: 'Leave-in L\'Oréal', price: 62.50, stock: 8, category: 'Cabelo' },
  { id: 'prod-4', name: 'Óleo Argan Marrocos', price: 78.00, stock: 0, category: 'Tratamento' },
  { id: 'prod-5', name: 'Tinta Igora Royal 6/0', price: 32.00, stock: 12, category: 'Coloração' },
  { id: 'prod-6', name: 'Gel Modelador Strong', price: 28.90, stock: 0, category: 'Finalização' },
]

// ── Cart ──────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string
  type: 'service' | 'product'
  name: string
  price: number
  qty: number
  professionalId: string
  discountType: 'percent' | 'fixed'
  discountValue: number
}

const cart = ref<CartItem[]>([])

const addService = (svcId: string) => {
  const svc = services.value.find(s => s.id === svcId)
  if (!svc) return
  const existing = cart.value.find(i => i.id === svcId && i.type === 'service')
  if (existing) { existing.qty++; return }
  cart.value.push({
    id: svcId, type: 'service', name: svc.name, price: svc.price,
    qty: 1, professionalId: '', discountType: 'percent', discountValue: 0,
  })
}

const addProduct = (prod: Product) => {
  if (prod.stock === 0) return
  const existing = cart.value.find(i => i.id === prod.id && i.type === 'product')
  if (existing) { existing.qty = Math.min(existing.qty + 1, prod.stock); return }
  cart.value.push({
    id: prod.id, type: 'product', name: prod.name, price: prod.price,
    qty: 1, professionalId: '', discountType: 'percent', discountValue: 0,
  })
}

const removeItem = (id: string, type: CartItem['type']) => {
  cart.value = cart.value.filter(i => !(i.id === id && i.type === type))
}

const setQty = (item: CartItem, qty: number) => {
  if (qty < 1) { removeItem(item.id, item.type); return }
  item.qty = qty
}

// ── Pre-fill from appointment ─────────────────────────────────────────────────
const prefillFromAppointment = (clientId: string, serviceId: string, professionalId: string) => {
  if (clientId) {
    const client = customers.value.find(c => c.id === clientId)
    if (client) selectCustomer({ id: client.id, label: client.name, sublabel: client.phone })
  }
  if (serviceId) addService(serviceId)
  if (professionalId && cart.value.length > 0) {
    cart.value[cart.value.length - 1].professionalId = professionalId
  }
}

// ── Customer ──────────────────────────────────────────────────────────────────
const customerQuery = ref('')
const selectedCustomer = ref<{ id: string; name: string; phone: string; email?: string } | null>(null)

const customerSearchItems = computed(() =>
  customers.value
    .filter(c =>
      !customerQuery.value ||
      c.name.toLowerCase().includes(customerQuery.value.toLowerCase()) ||
      c.phone.includes(customerQuery.value),
    )
    .map(c => ({ id: c.id, label: c.name, sublabel: c.phone })),
)

const customerPendingBalance = computed(() => {
  if (!selectedCustomer.value) return 0
  return receivables.value
    .filter(r => (r.status === 'PENDING' || r.status === 'OVERDUE') && r.clientId === selectedCustomer.value?.id)
    .reduce((s, r) => s + r.amount, 0)
})

const selectCustomer = (item: { id: string | number; label: string; sublabel?: string }) => {
  const full = customers.value.find(c => c.id === String(item.id))
  selectedCustomer.value = {
    id: String(item.id),
    name: item.label,
    phone: item.sublabel ?? '',
    email: full?.email,
  }
  customerQuery.value = ''
}

const clearCustomer = () => {
  selectedCustomer.value = null
  customerQuery.value = ''
}

// ── Professionals dropdown options ────────────────────────────────────────────
const professionalOptions = computed(() => [
  { label: 'Profissional...', value: '' },
  ...professionals.value
    .filter(p => p.status === 'active')
    .map(p => ({ label: p.name, value: p.id })),
])

// ── Filtered services/products ────────────────────────────────────────────────
const filteredServiceGroups = computed(() => {
  if (!serviceSearch.value) return servicesByCategory.value
  const q = serviceSearch.value.toLowerCase()
  return servicesByCategory.value
    .map(g => ({
      ...g,
      services: g.services.filter(s => s.name.toLowerCase().includes(q)),
    }))
    .filter(g => g.services.length > 0)
})

const filteredProducts = computed(() => {
  if (!productSearch.value) return MOCK_PRODUCTS
  const q = productSearch.value.toLowerCase()
  return MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(q))
})

// ── Totals ────────────────────────────────────────────────────────────────────
const itemSubtotal = (item: CartItem) => {
  const base = item.price * item.qty
  if (!item.discountValue) return base
  if (item.discountType === 'percent') return base * (1 - item.discountValue / 100)
  return Math.max(0, base - item.discountValue)
}

const subtotal = computed(() => cart.value.reduce((sum, i) => sum + itemSubtotal(i), 0))

const globalDiscountType = ref<'percent' | 'fixed'>('percent')
const globalDiscountValue = ref(0)

const discount = computed(() => {
  if (!globalDiscountValue.value) return 0
  if (globalDiscountType.value === 'percent') return subtotal.value * (globalDiscountValue.value / 100)
  return Math.min(globalDiscountValue.value, subtotal.value)
})

const total = computed(() => Math.max(0, subtotal.value - discount.value))

// ── Payment ───────────────────────────────────────────────────────────────────
type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'split'
const selectedPayment = ref<PaymentMethod | null>(null)

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: 'Dinheiro', icon: 'i-lucide-banknote' },
  { key: 'pix', label: 'Pix', icon: 'i-lucide-smartphone' },
  { key: 'credit', label: 'Crédito', icon: 'i-lucide-credit-card' },
  { key: 'debit', label: 'Débito', icon: 'i-lucide-credit-card' },
  { key: 'split', label: 'Dividir', icon: 'i-lucide-split' },
]

// Cash change
const cashReceived = ref<number | null>(null)
const cashChange = computed(() => {
  if (!cashReceived.value) return null
  return cashReceived.value - total.value
})

// Credit installments
const creditInstallments = ref(1)
const installmentOptions = Array.from({ length: 12 }, (_, i) => ({
  label: i === 0 ? '1x à vista' : `${i + 1}x de ${(0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
  value: i + 1,
}))
const installmentOptionsComputed = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    label: i === 0
      ? '1x à vista'
      : `${i + 1}x de ${(total.value / (i + 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    value: i + 1,
  })),
)

// Split payment — up to 4
interface SplitEntry { method: PaymentMethod; amount: number }
const splitEntries = ref<SplitEntry[]>([
  { method: 'pix', amount: 0 },
  { method: 'cash', amount: 0 },
])
const splitTotal = computed(() => splitEntries.value.reduce((s, e) => s + (e.amount || 0), 0))
const splitRemaining = computed(() => Math.max(0, total.value - splitTotal.value))
const splitValid = computed(() => splitTotal.value >= total.value)

const addSplitEntry = () => {
  if (splitEntries.value.length < 4) splitEntries.value.push({ method: 'debit', amount: 0 })
}
const removeSplitEntry = (i: number) => {
  if (splitEntries.value.length > 2) splitEntries.value.splice(i, 1)
}

const splitPaymentOptions = PAYMENT_OPTIONS.filter(p => p.key !== 'split').map(p => ({
  label: p.label, value: p.key,
}))

// ── Observations ──────────────────────────────────────────────────────────────
const observations = ref('')
const observationsOpen = ref(false)

// ── Can finalize ─────────────────────────────────────────────────────────────
const canFinalize = computed(() => {
  if (cart.value.length === 0 || !selectedPayment.value) return false
  if (selectedPayment.value === 'cash' && cashReceived.value !== null && cashReceived.value < total.value) return false
  if (selectedPayment.value === 'split' && !splitValid.value) return false
  return true
})

// ── Sale history ──────────────────────────────────────────────────────────────
interface SaleRecord {
  id: string; date: string; customerName: string
  items: CartItem[]; total: number; payment: string; professional: string
}
const saleHistory = ref<SaleRecord[]>([
  {
    id: 'sale-hist-1', date: new Date().toISOString().slice(0, 10).replace(/-/g, '-') + ' 14:35',
    customerName: 'Maria Silva', payment: 'Pix', total: 241.90, professional: 'Ana Costa',
    items: [
      { id: 'svc-1', type: 'service', name: 'Corte Feminino', price: 80, qty: 1, professionalId: 'pro-1', discountType: 'percent', discountValue: 0 },
      { id: 'prod-1', type: 'product', name: 'Shampoo Wella Luxe', price: 89.90, qty: 1, professionalId: '', discountType: 'percent', discountValue: 0 },
      { id: 'prod-1b', type: 'product', name: 'Leave-in L\'Oréal', price: 62.50, qty: 1, professionalId: '', discountType: 'percent', discountValue: 0 },
    ],
  },
  {
    id: 'sale-hist-2', date: new Date().toISOString().slice(0, 10) + ' 11:20',
    customerName: 'João Mendes', payment: 'Dinheiro', total: 45, professional: 'Carlos Lima',
    items: [
      { id: 'svc-3', type: 'service', name: 'Corte Masculino', price: 45, qty: 1, professionalId: 'pro-2', discountType: 'percent', discountValue: 0 },
    ],
  },
  {
    id: 'sale-hist-3', date: new Date().toISOString().slice(0, 10) + ' 10:05',
    customerName: 'Beatriz Souza', payment: 'Cartão de Crédito', total: 165, professional: 'Ana Costa',
    items: [
      { id: 'svc-4', type: 'service', name: 'Coloração Completa', price: 165, qty: 1, professionalId: 'pro-1', discountType: 'percent', discountValue: 0 },
    ],
  },
  {
    id: 'sale-hist-4', date: new Date().toISOString().slice(0, 10) + ' 09:00',
    customerName: 'Venda avulsa', payment: 'Pix', total: 89.90, professional: '—',
    items: [
      { id: 'prod-2', type: 'product', name: 'Máscara Kerastase', price: 89.90, qty: 1, professionalId: '', discountType: 'percent', discountValue: 0 },
    ],
  },
])

// History filters
const histSearch = ref('')
const histPayFilter = ref<string | null>(null)
const histViewSaleId = ref<string | null>(null)
const histViewSale = computed(() => saleHistory.value.find(s => s.id === histViewSaleId.value) ?? null)

const filteredHistory = computed(() => {
  let r = [...saleHistory.value]
  if (histSearch.value) {
    const q = histSearch.value.toLowerCase()
    r = r.filter(s => s.customerName.toLowerCase().includes(q) || s.professional.toLowerCase().includes(q))
  }
  if (histPayFilter.value) r = r.filter(s => s.payment === histPayFilter.value)
  return r
})

const histPayOptions = computed(() => [
  { label: 'Todos', value: '__all__' },
  ...Array.from(new Set(saleHistory.value.map(s => s.payment))).map(p => ({ label: p, value: p })),
])

const historyColumns = [
  { key: 'data', label: 'Data/Hora', width: '140px' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'itens', label: 'Itens', width: '200px' },
  { key: 'total', label: 'Total', width: '110px', align: 'right' as const },
  { key: 'pagamento', label: 'Pagamento', width: '130px' },
  { key: 'profissional', label: 'Profissional', width: '130px' },
  { key: 'acoes', label: '', width: '100px' },
]

const historyRows = computed(() => filteredHistory.value.map(s => ({
  id: s.id, _raw: s,
  data: s.date, cliente: s.customerName,
  itens: s.items.map(i => i.name).join(', '),
  total: s.total, pagamento: s.payment, profissional: s.professional,
})))

// ── Finalize ──────────────────────────────────────────────────────────────────
const finalizing = ref(false)
const successModal = ref(false)
const lastSaleData = ref<{
  total: number; customerName: string; customerPhone: string; customerEmail: string; payment: string; items: CartItem[]
} | null>(null)

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro', pix: 'Pix', credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito', split: 'Pagamento Dividido',
}

const finalizeSale = async () => {
  if (!canFinalize.value) return
  finalizing.value = true
  try {
    // Simulate POST /api/v1/sales
    await new Promise(r => setTimeout(r, 800))

    // 10% chance of error for realistic demo
    // (always succeed in mock)
    lastSaleData.value = {
      total: total.value,
      customerName: selectedCustomer.value?.name ?? '',
      customerPhone: selectedCustomer.value?.phone ?? '',
      customerEmail: selectedCustomer.value?.email ?? '',
      payment: PAYMENT_LABELS[selectedPayment.value!],
      items: [...cart.value],
    }
    // Add to sales history
    saleHistory.value.unshift({
      id: `sale-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      customerName: selectedCustomer.value?.name ?? 'Venda avulsa',
      items: [...cart.value],
      total: total.value,
      payment: PAYMENT_LABELS[selectedPayment.value!],
      professional: cart.value.find(i => i.type === 'service')
        ? professionals.value.find(p => p.id === cart.value.find(i => i.type === 'service')?.professionalId)?.name ?? '—'
        : '—',
    })
    successModal.value = true
  } catch {
    toast.error('Erro ao registrar venda. Tente novamente.')
  } finally {
    finalizing.value = false
  }
}

const newSale = () => {
  cart.value = []
  selectedCustomer.value = null
  customerQuery.value = ''
  selectedPayment.value = null
  globalDiscountValue.value = 0
  observations.value = ''
  observationsOpen.value = false
  cashReceived.value = null
  creditInstallments.value = 1
  splitEntries.value = [{ method: 'pix', amount: 0 }, { method: 'cash', amount: 0 }]
  successModal.value = false
  lastSaleData.value = null
}

const closeSale = () => {
  const saleTotal = lastSaleData.value?.total
  successModal.value = false
  if (saleTotal != null) {
    toast.add({
      type: 'success',
      title: `Venda de ${formatCurrency(saleTotal)} registrada`,
      action: () => navigateTo('/saas/financeiro?tab=transactions'),
      actionLabel: 'Ver no financeiro',
    })
  }
  navigateTo('/saas')
}

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h${m}min` : `${h}h`
}
</script>

<template>
  <div data-testid="page-caixa">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold" :style="{ color: 'var(--zima-text-primary)' }">Caixa / PDV</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--zima-text-muted)' }">Registre vendas de serviços e produtos</p>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding: 4px; background: var(--zima-bg-surface-2); border-radius: 10px; border: 1px solid var(--zima-border-default);">
        <button
          v-for="v in [{ key: 'pdv', label: 'PDV', icon: 'i-lucide-shopping-cart' }, { key: 'historico', label: 'Histórico', icon: 'i-lucide-clock' }]"
          :key="v.key"
          style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 7px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 120ms;"
          :style="{
            background: activeView === v.key ? 'var(--zima-bg-surface-3)' : 'transparent',
            color: activeView === v.key ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
          }"
          @click="activeView = v.key as 'pdv' | 'historico'"
        >
          <Icon :name="v.icon" style="width: 14px; height: 14px;" />
          {{ v.label }}
        </button>
      </div>
    </div>

    <!-- ── HISTÓRICO VIEW ─────────────────────────────────────────────────────── -->
    <template v-if="activeView === 'historico'">
      <!-- Filters -->
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <ZimaInput v-model="histSearch" type="search" placeholder="Buscar por cliente ou profissional..." />
        </div>
        <ZimaSelect :model-value="histPayFilter ?? '__all__'" :options="histPayOptions"
          style="min-width: 160px;"
          @update:model-value="histPayFilter = $event === '__all__' ? null : ($event as string)" />
        <ZimaButton size="sm" @click="activeView = 'pdv'">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 13px; height: 13px;" /></template>
          Nova Venda
        </ZimaButton>
      </div>

      <!-- KPI row -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;">
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">VENDAS HOJE</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: #10B981;">{{ formatCurrency(saleHistory.reduce((s, x) => s + x.total, 0)) }}</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">TRANSAÇÕES</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: var(--zima-text-primary);">{{ saleHistory.length }}</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">TICKET MÉDIO</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: var(--zima-text-primary);">{{ saleHistory.length > 0 ? formatCurrency(saleHistory.reduce((s, x) => s + x.total, 0) / saleHistory.length) : 'R$\xa00,00' }}</div>
        </div>
        <div style="padding: 14px 16px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 6px;">MAIOR VENDA</div>
          <div style="font-family: 'Geist Mono', monospace; font-size: 22px; font-weight: 700; color: var(--zima-text-primary);">{{ saleHistory.length > 0 ? formatCurrency(Math.max(...saleHistory.map(s => s.total))) : 'R$\xa00,00' }}</div>
        </div>
      </div>

      <!-- Table -->
      <div style="background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-lg); border: 1px solid var(--zima-border-default); overflow: hidden;">
        <ZimaTable :columns="historyColumns" :rows="historyRows"
          empty-title="Nenhuma venda registrada" empty-description="As vendas do PDV aparecerão aqui"
          row-clickable @row-click="(r) => histViewSaleId = r.id as string">
          <template #cell-data="{ row }">
            <span style="font-size: 12px; font-family: 'Geist Mono', monospace; color: var(--zima-text-muted);">{{ row.data }}</span>
          </template>
          <template #cell-cliente="{ row }">
            <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ row.cliente }}</span>
          </template>
          <template #cell-itens="{ row }">
            <span style="font-size: 12px; color: var(--zima-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 200px;">{{ row.itens }}</span>
          </template>
          <template #cell-total="{ row }">
            <span style="font-family: 'Geist Mono', monospace; font-size: 14px; font-weight: 700; color: #10B981;">{{ formatCurrency(row.total as number) }}</span>
          </template>
          <template #cell-pagamento="{ row }">
            <ZimaBadge variant="info" size="sm">{{ row.pagamento }}</ZimaBadge>
          </template>
          <template #cell-profissional="{ row }">
            <span style="font-size: 12px; color: var(--zima-text-secondary);">{{ row.profissional }}</span>
          </template>
          <template #cell-acoes="{ row }">
            <div style="display: flex; gap: 4px;" @click.stop>
              <button style="font-size: 12px; color: var(--zima-blue-core); background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px;"
                @click="histViewSaleId = row.id as string">Ver</button>
              <button style="font-size: 12px; color: var(--zima-text-muted); background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px;"
                @click="toast.info('Estorno em breve...')">Estornar</button>
            </div>
          </template>
        </ZimaTable>
      </div>

      <!-- Sale detail drawer -->
      <ZimaDrawer :model-value="!!histViewSaleId" title="Detalhes da Venda" @update:model-value="histViewSaleId = null">
        <template v-if="histViewSale">
          <div class="flex flex-col gap-5">
            <div style="padding: 14px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-md); border: 1px solid var(--zima-border-default);">
              <div class="flex items-center justify-between mb-2">
                <span style="font-size: 12px; color: var(--zima-text-muted);">Total</span>
                <span style="font-family: 'Geist Mono', monospace; font-size: 24px; font-weight: 700; color: #10B981;">{{ formatCurrency(histViewSale.total) }}</span>
              </div>
              <div class="flex items-center justify-between mb-1">
                <span style="font-size: 12px; color: var(--zima-text-muted);">Data</span>
                <span style="font-size: 13px; color: var(--zima-text-primary);">{{ histViewSale.date }}</span>
              </div>
              <div class="flex items-center justify-between mb-1">
                <span style="font-size: 12px; color: var(--zima-text-muted);">Cliente</span>
                <span style="font-size: 13px; color: var(--zima-text-primary);">{{ histViewSale.customerName }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span style="font-size: 12px; color: var(--zima-text-muted);">Pagamento</span>
                <span style="font-size: 13px; color: var(--zima-text-primary);">{{ histViewSale.payment }}</span>
              </div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); margin-bottom: 8px;">Itens</div>
              <div style="border: 1px solid var(--zima-border-default); border-radius: var(--zima-radius-md); overflow: hidden;">
                <div v-for="(item, i) in histViewSale.items" :key="i"
                  style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px;"
                  :style="{ borderBottom: i < histViewSale.items.length - 1 ? '1px solid var(--zima-border-divider)' : 'none' }">
                  <div>
                    <div style="font-size: 13px; color: var(--zima-text-primary);">{{ item.name }}</div>
                    <div style="font-size: 11px; color: var(--zima-text-muted);">{{ item.qty }}× {{ formatCurrency(item.price) }}</div>
                  </div>
                  <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 600; color: var(--zima-text-primary);">{{ formatCurrency(item.price * item.qty) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div style="display: flex; gap: 8px; width: 100%;">
            <ZimaButton variant="ghost" style="flex: 1;" @click="toast.info('Recibo por WhatsApp...')">
              <template #icon-left><Icon name="i-lucide-message-circle" style="width: 13px; height: 13px;" /></template>
              WhatsApp
            </ZimaButton>
            <ZimaButton variant="ghost" style="flex: 1;" @click="toast.info('Recibo por Email...')">
              <template #icon-left><Icon name="i-lucide-mail" style="width: 13px; height: 13px;" /></template>
              Email
            </ZimaButton>
            <ZimaButton variant="ghost" @click="histViewSaleId = null">Fechar</ZimaButton>
          </div>
        </template>
      </ZimaDrawer>
    </template>

    <!-- 2-panel layout -->
    <div v-if="activeView === 'pdv'" class="grid grid-cols-12 gap-0 rounded-xl overflow-hidden" style="min-height: calc(100vh - 180px); border: 1px solid var(--zima-border-default);">

      <!-- ── LEFT PANEL (7/12) ────────────────────────────────────────────── -->
      <div class="col-span-7 flex flex-col" style="background: var(--zima-bg-surface-1); border-right: 1px solid var(--zima-border-default);">

        <!-- Tabs -->
        <div class="flex items-center gap-1 p-3 pb-0" style="border-bottom: 1px solid var(--zima-border-divider);">
          <button
            v-for="tab in [{ key: 'services', label: 'Serviços' }, { key: 'products', label: 'Produtos' }]"
            :key="tab.key"
            class="px-4 py-2 text-sm font-medium transition-all rounded-t-md"
            :style="{
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--zima-blue-core)' : '2px solid transparent',
            }"
            @click="activeTab = tab.key as 'services' | 'products'"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Search -->
        <div class="p-3">
          <ZimaInput
            v-if="activeTab === 'services'"
            v-model="serviceSearch"
            type="search"
            placeholder="Buscar serviços..."
          />
          <ZimaInput
            v-else
            v-model="productSearch"
            type="search"
            placeholder="Buscar produtos..."
          />
        </div>

        <!-- Services tab -->
        <div v-if="activeTab === 'services'" class="flex-1 overflow-y-auto px-3 pb-3">
          <div v-if="servicesLoading" class="flex flex-col gap-3">
            <ZimaSkeleton v-for="i in 3" :key="i" height="80px" />
          </div>

          <div v-else-if="filteredServiceGroups.length === 0" class="flex flex-col items-center justify-center py-12 gap-2">
            <Icon name="i-lucide-search-x" style="width: 32px; height: 32px; color: var(--zima-text-muted);" />
            <p style="font-size: 13px; color: var(--zima-text-muted);">Nenhum serviço encontrado</p>
          </div>

          <div v-else class="flex flex-col gap-4">
            <div v-for="group in filteredServiceGroups" :key="group.category.id">
              <!-- Category header -->
              <div class="flex items-center gap-2 mb-2">
                <div class="rounded-full" :style="{ width: '8px', height: '8px', background: group.category.color, flexShrink: 0 }" />
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted);">
                  {{ group.category.name }}
                </span>
              </div>
              <!-- Services grid -->
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="svc in group.services"
                  :key="svc.id"
                  class="flex flex-col gap-1 p-3 rounded-lg text-left transition-all"
                  :style="{
                    background: 'var(--zima-bg-surface-2)',
                    border: '1px solid var(--zima-border-default)',
                    cursor: svc.active ? 'pointer' : 'not-allowed',
                    opacity: svc.active ? '1' : '0.5',
                  }"
                  :disabled="!svc.active"
                  @click="addService(svc.id)"
                  @mouseenter="svc.active && (($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-blue-core)')"
                  @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'"
                >
                  <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ svc.name }}</span>
                  <div class="flex items-center justify-between">
                    <span style="font-size: 11px; color: var(--zima-text-muted);">{{ formatDuration(svc.duration) }}</span>
                    <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 600; color: var(--zima-blue-core);">
                      {{ formatCurrency(svc.price) }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Products tab -->
        <div v-else class="flex-1 overflow-y-auto px-3 pb-3">
          <div v-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center py-12 gap-2">
            <Icon name="i-lucide-package-x" style="width: 32px; height: 32px; color: var(--zima-text-muted);" />
            <p style="font-size: 13px; color: var(--zima-text-muted);">Nenhum produto encontrado</p>
          </div>
          <div v-else class="grid grid-cols-2 gap-2">
            <button
              v-for="prod in filteredProducts"
              :key="prod.id"
              class="flex flex-col gap-1 p-3 rounded-lg text-left transition-all relative"
              :style="{
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                cursor: prod.stock > 0 ? 'pointer' : 'not-allowed',
                opacity: prod.stock > 0 ? '1' : '0.5',
              }"
              :disabled="prod.stock === 0"
              @click="addProduct(prod)"
              @mouseenter="prod.stock > 0 && (($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-blue-core)')"
              @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'"
            >
              <!-- Stock badge -->
              <div v-if="prod.stock === 0" class="absolute top-2 right-2">
                <ZimaBadge variant="danger" size="sm">Sem estoque</ZimaBadge>
              </div>
              <div v-else class="absolute top-2 right-2">
                <span style="font-size: 10px; color: var(--zima-text-muted);">{{ prod.stock }} un.</span>
              </div>

              <span style="font-size: 12px; color: var(--zima-text-muted);">{{ prod.category }}</span>
              <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ prod.name }}</span>
              <span style="font-family: 'Geist Mono', monospace; font-size: 14px; font-weight: 600; color: var(--zima-blue-core);">
                {{ formatCurrency(prod.price) }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── RIGHT PANEL (5/12) ───────────────────────────────────────────── -->
      <div class="col-span-5 flex flex-col" style="background: #111520;">

        <!-- Customer + Professional -->
        <div class="p-4 flex flex-col gap-3" style="border-bottom: 1px solid rgba(148,163,184,0.08);">
          <!-- Customer -->
          <div>
            <div v-if="!selectedCustomer">
              <ZimaSearchAutocomplete
                v-model="customerQuery"
                :items="customerSearchItems"
                placeholder="Buscar cliente (opcional)..."
                label="Cliente"
                @select="selectCustomer"
              />
              <button
                class="mt-1.5 text-xs"
                style="background: none; border: none; cursor: pointer; color: var(--zima-blue-core); padding: 0;"
                @click="toast.info('Cadastro de cliente em breve')"
              >
                + Novo cliente
              </button>
            </div>
            <div v-else>
              <label style="font-size: 12px; font-weight: 500; color: var(--zima-text-secondary);">Cliente</label>
              <div
                class="flex items-center gap-3 mt-1 px-3 py-2 rounded-lg"
                style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);"
              >
                <ZimaAvatar :name="selectedCustomer.name" size="sm" />
                <div class="flex-1 min-w-0">
                  <p style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {{ selectedCustomer.name }}
                  </p>
                  <p style="font-size: 11px; color: var(--zima-text-muted);">{{ selectedCustomer.phone }}</p>
                </div>
                <button
                  class="flex items-center justify-center rounded-full"
                  style="width: 20px; height: 20px; background: none; border: none; cursor: pointer; color: var(--zima-text-muted);"
                  @click="clearCustomer"
                >
                  <Icon name="i-lucide-x" style="width: 12px; height: 12px;" />
                </button>
              </div>
              <!-- Pending balance alert -->
              <div
                v-if="customerPendingBalance > 0"
                style="margin-top: 6px; padding: 8px 10px; background: rgba(245,158,11,0.10); border: 1px solid rgba(245,158,11,0.25); border-radius: 6px; display: flex; align-items: center; gap: 6px;"
              >
                <Icon name="i-lucide-alert-triangle" style="width: 13px; height: 13px; color: #F59E0B; flex-shrink: 0;" />
                <span style="font-size: 12px; color: #F59E0B;">Cliente com {{ formatCurrency(customerPendingBalance) }} pendentes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart items -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="cart.length === 0" class="flex flex-col items-center justify-center h-full gap-3 py-12">
            <Icon name="i-lucide-shopping-cart" style="width: 40px; height: 40px; color: rgba(148,163,184,0.3);" />
            <p style="font-size: 13px; color: rgba(148,163,184,0.5);">Carrinho vazio</p>
            <p style="font-size: 12px; color: rgba(148,163,184,0.3); text-align: center;">Clique em um serviço ou produto para adicionar</p>
          </div>

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="item in cart"
              :key="`${item.type}-${item.id}`"
              class="rounded-lg p-3 flex flex-col gap-2"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(148,163,184,0.08);"
            >
              <!-- Item header -->
              <div class="flex items-start gap-2">
                <div class="flex-1 min-w-0">
                  <p style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ item.name }}</p>
                  <p style="font-size: 11px; color: var(--zima-text-muted);">
                    {{ formatCurrency(item.price) }} / un.
                  </p>
                </div>
                <button
                  class="flex items-center justify-center rounded"
                  style="width: 20px; height: 20px; background: none; border: none; cursor: pointer; color: rgba(148,163,184,0.4); flex-shrink: 0;"
                  @click="removeItem(item.id, item.type)"
                  @mouseenter="($event.currentTarget as HTMLElement).style.color = 'var(--zima-danger)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.color = 'rgba(148,163,184,0.4)'"
                >
                  <Icon name="i-lucide-x" style="width: 13px; height: 13px;" />
                </button>
              </div>

              <!-- Qty stepper + subtotal -->
              <div class="flex items-center gap-2">
                <!-- Stepper -->
                <div class="flex items-center gap-1 rounded-lg overflow-hidden" style="border: 1px solid rgba(148,163,184,0.12);">
                  <button
                    class="flex items-center justify-center"
                    style="width: 28px; height: 28px; background: none; border: none; cursor: pointer; color: var(--zima-text-muted);"
                    @click="setQty(item, item.qty - 1)"
                    @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                  >
                    <Icon name="i-lucide-minus" style="width: 11px; height: 11px;" />
                  </button>
                  <span style="min-width: 28px; text-align: center; font-size: 13px; font-weight: 600; color: var(--zima-text-primary);">
                    {{ item.qty }}
                  </span>
                  <button
                    class="flex items-center justify-center"
                    style="width: 28px; height: 28px; background: none; border: none; cursor: pointer; color: var(--zima-text-muted);"
                    @click="setQty(item, item.qty + 1)"
                    @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                  >
                    <Icon name="i-lucide-plus" style="width: 11px; height: 11px;" />
                  </button>
                </div>

                <div class="flex-1" />

                <!-- Item subtotal -->
                <span style="font-family: 'Geist Mono', monospace; font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">
                  {{ formatCurrency(itemSubtotal(item)) }}
                </span>
              </div>

              <!-- Professional (services only) -->
              <div v-if="item.type === 'service'">
                <ZimaSelect
                  :model-value="item.professionalId"
                  :options="professionalOptions"
                  placeholder="Atendido por..."
                  @update:model-value="item.professionalId = $event as string"
                />
              </div>

              <!-- Per-item discount -->
              <div class="flex items-center gap-2">
                <button
                  class="flex items-center gap-1 rounded px-2 py-1"
                  :style="{
                    background: item.discountType === 'percent' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(148,163,184,0.08)',
                    cursor: 'pointer',
                    color: item.discountType === 'percent' ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
                    fontSize: '11px', fontWeight: '500',
                  }"
                  @click="item.discountType = 'percent'"
                >%</button>
                <button
                  class="flex items-center gap-1 rounded px-2 py-1"
                  :style="{
                    background: item.discountType === 'fixed' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(148,163,184,0.08)',
                    cursor: 'pointer',
                    color: item.discountType === 'fixed' ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
                    fontSize: '11px', fontWeight: '500',
                  }"
                  @click="item.discountType = 'fixed'"
                >R$</button>
                <input
                  v-model.number="item.discountValue"
                  type="number"
                  min="0"
                  :placeholder="item.discountType === 'percent' ? 'Desconto %' : 'Desconto R$'"
                  class="flex-1 rounded px-2 py-1"
                  style="
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(148,163,184,0.08);
                    color: var(--zima-text-primary);
                    font-size: 12px;
                    outline: none;
                  "
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Summary + Payment + CTA -->
        <div class="p-4 flex flex-col gap-4" style="border-top: 1px solid rgba(148,163,184,0.08);">

          <!-- Subtotal + Discount + Total -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span style="font-size: 13px; color: var(--zima-text-muted);">Subtotal</span>
              <span style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-secondary);">
                {{ formatCurrency(subtotal) }}
              </span>
            </div>

            <!-- Global discount -->
            <div class="flex items-center gap-2">
              <span style="font-size: 13px; color: var(--zima-text-muted); white-space: nowrap;">Desconto geral</span>
              <div class="flex items-center gap-1 ml-auto">
                <button
                  class="rounded px-1.5 py-0.5"
                  :style="{
                    fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: 'none',
                    background: globalDiscountType === 'percent' ? 'var(--zima-blue-core)' : 'rgba(255,255,255,0.06)',
                    color: globalDiscountType === 'percent' ? 'white' : 'var(--zima-text-muted)',
                  }"
                  @click="globalDiscountType = 'percent'"
                >%</button>
                <button
                  class="rounded px-1.5 py-0.5"
                  :style="{
                    fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: 'none',
                    background: globalDiscountType === 'fixed' ? 'var(--zima-blue-core)' : 'rgba(255,255,255,0.06)',
                    color: globalDiscountType === 'fixed' ? 'white' : 'var(--zima-text-muted)',
                  }"
                  @click="globalDiscountType = 'fixed'"
                >R$</button>
                <input
                  v-model.number="globalDiscountValue"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="rounded px-2 py-0.5"
                  style="
                    width: 64px; background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(148,163,184,0.12);
                    color: var(--zima-text-primary); font-size: 12px; outline: none;
                    font-family: 'Geist Mono', monospace;
                  "
                >
              </div>
              <span
                v-if="discount > 0"
                style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-success);"
              >
                -{{ formatCurrency(discount) }}
              </span>
            </div>

            <!-- Total -->
            <div
              class="flex items-center justify-between pt-3"
              style="border-top: 1px solid rgba(148,163,184,0.12);"
            >
              <span style="font-size: 15px; font-weight: 600; color: var(--zima-text-primary);">Total</span>
              <span style="font-family: 'Geist Mono', monospace; font-size: 24px; font-weight: 700; color: var(--zima-text-primary);">
                {{ formatCurrency(total) }}
              </span>
            </div>
          </div>

          <!-- Payment methods -->
          <div class="flex flex-col gap-2">
            <span style="font-size: 12px; font-weight: 500; color: var(--zima-text-muted); text-transform: uppercase; letter-spacing: 0.06em;">Forma de pagamento</span>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="opt in PAYMENT_OPTIONS"
                :key="opt.key"
                class="flex items-center justify-center gap-2 rounded-lg"
                style="height: 44px; transition: all 150ms; border: none; cursor: pointer;"
                :style="{
                  gridColumn: opt.key === 'split' ? 'span 2' : 'span 1',
                  background: selectedPayment === opt.key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                  border: selectedPayment === opt.key ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(148,163,184,0.08)',
                  color: selectedPayment === opt.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
                }"
                @click="selectedPayment = opt.key"
              >
                <Icon :name="opt.icon" style="width: 16px; height: 16px;" />
                <span style="font-size: 13px; font-weight: 500;">{{ opt.label }}</span>
              </button>
            </div>

            <!-- Cash change -->
            <div v-if="selectedPayment === 'cash'" class="rounded-lg p-3 flex flex-col gap-2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(148,163,184,0.08);">
              <div class="flex items-center gap-2">
                <label style="font-size: 12px; color: var(--zima-text-muted); white-space: nowrap;">Valor recebido</label>
                <input
                  v-model.number="cashReceived"
                  type="number"
                  min="0"
                  :placeholder="formatCurrency(total)"
                  class="flex-1 rounded-lg px-2 py-1.5"
                  style="background: rgba(255,255,255,0.04); border: 1px solid rgba(148,163,184,0.12); color: var(--zima-text-primary); font-size: 13px; outline: none; font-family: 'Geist Mono', monospace;"
                />
              </div>
              <div v-if="cashReceived !== null" class="flex items-center justify-between">
                <span v-if="cashChange !== null && cashChange >= 0" style="font-size: 13px; color: var(--zima-text-muted);">Troco</span>
                <span v-if="cashChange !== null && cashChange >= 0" style="font-family: 'Geist Mono', monospace; font-size: 16px; font-weight: 700; color: #10B981;">{{ formatCurrency(cashChange) }}</span>
                <span v-else style="font-size: 12px; color: #EF4444;">Valor insuficiente</span>
              </div>
            </div>

            <!-- Credit installments -->
            <div v-if="selectedPayment === 'credit'" class="rounded-lg p-3 flex items-center gap-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(148,163,184,0.08);">
              <label style="font-size: 12px; color: var(--zima-text-muted); white-space: nowrap;">Parcelas</label>
              <ZimaSelect
                :model-value="creditInstallments"
                :options="installmentOptionsComputed"
                style="flex: 1;"
                @update:model-value="creditInstallments = $event as number"
              />
            </div>

            <!-- Split details -->
            <div
              v-if="selectedPayment === 'split'"
              class="rounded-lg p-3 flex flex-col gap-2"
              style="background: rgba(255,255,255,0.03); border: 1px solid rgba(148,163,184,0.08);"
            >
              <div v-for="(entry, i) in splitEntries" :key="i" class="flex items-center gap-2">
                <ZimaSelect
                  :model-value="entry.method"
                  :options="splitPaymentOptions"
                  style="flex: 1;"
                  @update:model-value="entry.method = $event as PaymentMethod"
                />
                <input
                  v-model.number="entry.amount"
                  type="number"
                  min="0"
                  placeholder="R$"
                  class="rounded-lg px-2 py-2"
                  style="width: 90px; background: rgba(255,255,255,0.04); border: 1px solid rgba(148,163,184,0.12); color: var(--zima-text-primary); font-size: 13px; outline: none; font-family: 'Geist Mono', monospace;"
                />
                <button v-if="splitEntries.length > 2" style="background: none; border: none; cursor: pointer; color: var(--zima-text-muted); padding: 4px;" @click="removeSplitEntry(i)">
                  <Icon name="i-lucide-x" style="width: 13px; height: 13px;" />
                </button>
              </div>
              <div class="flex items-center justify-between">
                <button
                  v-if="splitEntries.length < 4"
                  style="font-size: 12px; color: var(--zima-blue-core); background: none; border: none; cursor: pointer;"
                  @click="addSplitEntry"
                >+ Adicionar pagamento</button>
                <div class="flex-1" />
                <span style="font-size: 12px;" :style="{ color: splitValid ? '#10B981' : '#EF4444' }">
                  {{ splitValid ? 'OK' : 'Faltam ' + formatCurrency(splitRemaining) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Observations (collapsible) -->
          <div class="flex flex-col gap-1">
            <button
              style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0;"
              @click="observationsOpen = !observationsOpen"
            >
              <Icon :name="observationsOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
              <span style="font-size: 12px; font-weight: 500; color: var(--zima-text-muted);">
                {{ observations ? 'Observações' : 'Adicionar observações' }}
              </span>
            </button>
            <textarea
              v-if="observationsOpen"
              v-model="observations"
              placeholder="Notas internas sobre a venda..."
              rows="2"
              maxlength="200"
              class="rounded-lg px-3 py-2 resize-none w-full"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(148,163,184,0.08); color: var(--zima-text-primary); font-size: 12px; font-family: inherit; outline: none;"
            />
          </div>

          <!-- Finalize button -->
          <ZimaButton
            size="lg"
            :disabled="!canFinalize"
            :loading="finalizing"
            class="w-full"
            @click="finalizeSale"
          >
            <template #icon-left>
              <Icon name="i-lucide-check-circle" style="width: 16px; height: 16px;" />
            </template>
            Finalizar Venda — {{ formatCurrency(total) }}
          </ZimaButton>
        </div>
      </div>
    </div>

    <!-- ── SUCCESS MODAL ────────────────────────────────────────────────────── -->
    <ZimaModal
      v-if="lastSaleData"
      v-model="successModal"
      size="sm"
      :prevent-close="false"
      @update:model-value="successModal = $event"
    >
      <template #header>
        <div class="flex flex-col items-center gap-3 py-2">
          <div
            class="flex items-center justify-center rounded-full"
            style="width: 56px; height: 56px; background: rgba(16,185,129,0.12);"
          >
            <Icon name="i-lucide-check" style="width: 28px; height: 28px; color: var(--zima-success);" />
          </div>
          <div class="text-center">
            <h3 style="font-size: 18px; font-weight: 700; color: var(--zima-text-primary);">Venda registrada!</h3>
            <p style="font-size: 13px; color: var(--zima-text-muted); margin-top: 2px;">Tudo certo por aqui.</p>
          </div>
        </div>
      </template>

      <!-- Summary -->
      <div class="flex flex-col gap-3 py-2">
        <div
          class="rounded-lg p-4 flex flex-col gap-2"
          style="background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);"
        >
          <div class="flex items-center justify-between">
            <span style="font-size: 12px; color: var(--zima-text-muted);">Total</span>
            <span style="font-family: 'Geist Mono', monospace; font-size: 20px; font-weight: 700; color: var(--zima-success);">
              {{ formatCurrency(lastSaleData.total) }}
            </span>
          </div>
          <div v-if="lastSaleData.customerName" class="flex items-center justify-between">
            <span style="font-size: 12px; color: var(--zima-text-muted);">Cliente</span>
            <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ lastSaleData.customerName }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span style="font-size: 12px; color: var(--zima-text-muted);">Pagamento</span>
            <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ lastSaleData.payment }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <!-- Recibo WhatsApp -->
          <button
            :disabled="!lastSaleData.customerPhone"
            class="w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-all"
            style="border: 1px solid rgba(148,163,184,0.12); background: rgba(255,255,255,0.03); cursor: pointer; text-align: left;"
            :style="{ opacity: lastSaleData.customerPhone ? '1' : '0.4', cursor: lastSaleData.customerPhone ? 'pointer' : 'not-allowed' }"
            @click="lastSaleData.customerPhone && toast.success('Recibo enviado para ' + lastSaleData.customerName + ' via WhatsApp!')"
            @mouseenter="lastSaleData.customerPhone && (($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'"
          >
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(37,211,102,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <Icon name="i-lucide-message-circle" style="width: 16px; height: 16px; color: #25D366;" />
            </div>
            <span style="font-size: 13px; color: var(--zima-text-primary);">Enviar recibo por WhatsApp</span>
          </button>

          <!-- Recibo Email -->
          <button
            :disabled="!lastSaleData.customerEmail"
            class="w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-all"
            style="border: 1px solid rgba(148,163,184,0.12); background: rgba(255,255,255,0.03); cursor: pointer; text-align: left;"
            :style="{ opacity: lastSaleData.customerEmail ? '1' : '0.4', cursor: lastSaleData.customerEmail ? 'pointer' : 'not-allowed' }"
            @click="lastSaleData.customerEmail && toast.success('Recibo enviado por email!')"
            @mouseenter="lastSaleData.customerEmail && (($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'"
          >
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(59,130,246,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <Icon name="i-lucide-mail" style="width: 16px; height: 16px; color: #3B82F6;" />
            </div>
            <span style="font-size: 13px; color: var(--zima-text-primary);">Enviar recibo por Email</span>
          </button>

          <!-- Nota Fiscal -->
          <button
            class="w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-all"
            style="border: 1px solid rgba(148,163,184,0.12); background: rgba(255,255,255,0.03); cursor: pointer; text-align: left;"
            @click="toast.info('Módulo de NF em breve...'); navigateTo('/saas/notas')"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'"
          >
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(99,102,241,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <Icon name="i-lucide-receipt" style="width: 16px; height: 16px; color: #6366F1;" />
            </div>
            <span style="font-size: 13px; color: var(--zima-text-primary);">Emitir Nota Fiscal</span>
          </button>

          <!-- Actions -->
          <div class="flex gap-2 w-full">
            <ZimaButton variant="ghost" class="flex-1" @click="closeSale">
              Ir para Dashboard
            </ZimaButton>
            <ZimaButton class="flex-1" @click="newSale">
              <template #icon-left>
                <Icon name="i-lucide-plus" style="width: 14px; height: 14px;" />
              </template>
              Nova Venda
            </ZimaButton>
          </div>
        </div>
      </template>
    </ZimaModal>
  </div>
</template>
