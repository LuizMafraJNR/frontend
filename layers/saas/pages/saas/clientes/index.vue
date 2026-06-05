<script setup lang="ts">
import type { Customer } from '../../../composables/useCustomers'
import { useCustomers, CUSTOMER_STATUS } from '../../../composables/useCustomers'
import ModalCliente from '../ModalCliente.vue'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const { customers, loading, fetchAll, deleteCustomer, addTagToCustomers, computeCustomerStatus } = useCustomers()
const { downloadCsv, num, dateSuffix } = useCsvExport()
const { ltv, atRiskCustomers } = useCustomerInsights()
const { addCampaign } = useCampaigns()

// Status é DERIVADO das métricas (gasto/visitas/última visita) — fonte única de
// verdade, em vez do campo armazenado (que poderia ficar stale). Vale para
// badge, filtro e sort, para não dessincronizar.
const statusOf = (c: Customer) => computeCustomerStatus(c)

// ── Insights de CRM (alimentam a ação de reativação) ──────────────────────────
const atRisk = computed(() => atRiskCustomers(customers.value))
const totalLtv = computed(() => customers.value.reduce((s, c) => s + ltv(c), 0))
const ltvMedio = computed(() => customers.value.length ? Math.round(totalLtv.value / customers.value.length) : 0)
const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Ação win-back: cria campanha de reativação pré-segmentada para clientes em risco.
const createWinbackCampaign = () => {
  if (atRisk.value.length === 0) {
    toast.info('Nenhum cliente em risco no momento')
    return
  }
  addCampaign({
    name: `Reativação — ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`,
    type: 'reactivation',
    channel: 'whatsapp',
    status: 'draft',
    audienceSize: atRisk.value.length,
    scheduledAt: null,
    sentAt: null,
    message: 'Olá {{nome_cliente}}! Sentimos sua falta 💙 Volte com 15% de desconto usando o cupom VOLTEI15. Agende já: {{link_agendamento}}',
    couponCode: 'VOLTEI15',
    segmentRules: [{ field: 'Risco de churn', operator: 'é', value: 'médio ou alto' }],
    allClients: false,
  })
  toast.success(
    'Campanha de reativação criada',
    `${atRisk.value.length} cliente(s) em risco · rascunho salvo em Campanhas`,
  )
  navigateTo('/saas/campanhas?tab=rascunhos')
}
const route = useRoute()
const router = useRouter()

onMounted(() => fetchAll())

// Filters — inicializa dos query params
const searchQuery = ref((route.query.q as string) || '')
const debouncedSearch = useDebounce(searchQuery, 300)
const statusFilter = ref<string | null>((route.query.status as string) || null)
const tagsFilter = ref<string | null>((route.query.tags as string) || null)
const sortBy = ref((route.query.sort as string) || 'name')
const birthdayThisWeek = ref<boolean>(route.query.birthdayThisWeek === 'true')
const currentPage = ref(1)
const pageSize = ref(10)

// Sincroniza URL quando filtros mudam
watch([debouncedSearch, statusFilter, tagsFilter, sortBy, birthdayThisWeek], () => {
  router.replace({
    query: {
      ...(debouncedSearch.value ? { q: debouncedSearch.value } : {}),
      ...(statusFilter.value ? { status: statusFilter.value } : {}),
      ...(tagsFilter.value ? { tags: tagsFilter.value } : {}),
      ...(sortBy.value !== 'name' ? { sort: sortBy.value } : {}),
      ...(birthdayThisWeek.value ? { birthdayThisWeek: 'true' } : {}),
    },
  })
})

// Selection
const selectedIds = ref<string[]>([])

// Modal
const modalOpen = ref(false)
const editingCustomer = ref<Customer | null>(null)

// Dropdowns
const openDropdownId = ref<string | null>(null)

const allTags = computed(() => {
  const tags = new Set<string>()
  customers.value.forEach(c => c.tags.forEach(t => tags.add(t)))
  return [...tags].sort()
})

const tagOptions = computed(() => [
  { label: 'Todas as tags', value: '__all__' },
  ...allTags.value.map(t => ({ label: t, value: t })),
])

const statusOptions = [
  { label: 'Todos os status', value: '__all__' },
  { label: 'Ativo', value: 'ACTIVE' },
  { label: 'Inativo', value: 'INACTIVE' },
  { label: 'VIP', value: 'VIP' },
  { label: 'Novo', value: 'NEW' },
]

const sortOptions = [
  { label: 'Nome (A-Z)', value: 'name' },
  { label: 'Maior gasto', value: 'total' },
  { label: 'Mais visitas', value: 'visits' },
  { label: 'Última visita', value: 'last_visit' },
]

const filteredCustomers = computed(() => {
  let result = [...customers.value]

  if (debouncedSearch.value) {
    const q = debouncedSearch.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q),
    )
  }

  if (statusFilter.value && statusFilter.value !== '__all__') {
    result = result.filter(c => statusOf(c) === statusFilter.value)
  }

  if (tagsFilter.value && tagsFilter.value !== '__all__') {
    result = result.filter(c => c.tags.includes(tagsFilter.value!))
  }

  if (birthdayThisWeek.value) {
    const now = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(now.getDate() + 7)
    result = result.filter(c => {
      if (!c.birthDate) return false
      const [, m, d] = c.birthDate.split('-').map(Number)
      const thisYearBday = new Date(now.getFullYear(), m - 1, d)
      return thisYearBday >= now && thisYearBday <= weekFromNow
    })
  }

  result.sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'total') return b.totalSpent - a.totalSpent
    if (sortBy.value === 'visits') return b.visits - a.visits
    if (sortBy.value === 'last_visit') return (b.lastVisitDate ?? '').localeCompare(a.lastVisitDate ?? '')
    return 0
  })

  return result
})

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCustomers.value.slice(start, start + pageSize.value)
})

const tableRows = computed(() =>
  paginatedCustomers.value.map(c => ({
    id: c.id,
    _raw: c,
    name: c.name,
    email: c.email,
    phone: c.phone,
    tags: c.tags,
    status: statusOf(c),
    visits: c.visits,
    totalSpent: c.totalSpent,
    lastVisitDate: c.lastVisitDate,
  })),
)

const isMobile = ref(false)
const checkMobile = () => { isMobile.value = window.innerWidth < 640 }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const tableColumns = computed(() => [
  { key: 'cliente', label: 'Cliente' },
  { key: 'phone', label: 'Telefone' },
  ...(!isMobile.value ? [{ key: 'tags', label: 'Tags' }] : []),
  { key: 'status', label: 'Status' },
  { key: 'visits', label: 'Visitas', align: 'right' as const },
  { key: 'total', label: 'Total Gasto', align: 'right' as const },
  ...(!isMobile.value ? [{ key: 'ultima_visita', label: 'Última Visita' }] : []),
  { key: 'actions', label: '', width: '48px' },
])

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (date: string | undefined) => {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const handleRowClick = (row: (typeof tableRows.value)[number]) => {
  navigateTo(`/saas/clientes/${row.id}`)
}

const handleSelectionChange = (rows: Record<string, unknown>[]) => {
  selectedIds.value = rows.map(r => r.id as string)
}

const openNew = () => {
  editingCustomer.value = null
  modalOpen.value = true
}

const openEdit = (customer: Customer) => {
  editingCustomer.value = customer
  modalOpen.value = true
  openDropdownId.value = null
}

const handleSaved = async () => {
  await fetchAll()
}

// ── Confirmação de exclusão (substitui confirm() nativo) ──────────────────────
const deleteModalOpen = ref(false)
const deleteTarget = ref<{ kind: 'single'; customer: Customer } | { kind: 'batch' } | null>(null)
const deleting = ref(false)

const deleteModalText = computed(() => {
  if (deleteTarget.value?.kind === 'single') return `Excluir ${deleteTarget.value.customer.name}? Esta ação não pode ser desfeita.`
  if (deleteTarget.value?.kind === 'batch') return `Excluir ${selectedIds.value.length} cliente(s)? Esta ação não pode ser desfeita.`
  return ''
})

const handleDelete = (customer: Customer) => {
  openDropdownId.value = null
  deleteTarget.value = { kind: 'single', customer }
  deleteModalOpen.value = true
}

const handleBatchDelete = () => {
  deleteTarget.value = { kind: 'batch' }
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    if (deleteTarget.value.kind === 'single') {
      await deleteCustomer(deleteTarget.value.customer.id)
      toast.success('Cliente excluído')
    } else {
      const n = selectedIds.value.length
      for (const id of selectedIds.value) await deleteCustomer(id)
      selectedIds.value = []
      toast.success(`${n} cliente(s) excluído(s)`)
    }
    deleteModalOpen.value = false
  } finally {
    deleting.value = false
  }
}

// ── Exportar selecionados para CSV ────────────────────────────────────────────
const exportSelected = () => {
  const rows = customers.value.filter(c => selectedIds.value.includes(c.id))
  if (!rows.length) return
  downloadCsv(
    `clientes-${dateSuffix()}.csv`,
    ['Nome', 'Telefone', 'Email', 'Status', 'Visitas', 'Total Gasto (R$)', 'Última Visita', 'Tags'],
    rows.map(c => [
      c.name, c.phone, c.email, CUSTOMER_STATUS[statusOf(c)]?.label ?? statusOf(c),
      c.visits, num(c.totalSpent), c.lastVisitDate ?? '—', c.tags.join(', '),
    ]),
  )
  toast.success(`${rows.length} cliente(s) exportado(s)`)
}

// ── Adicionar tag em lote ─────────────────────────────────────────────────────
const tagModalOpen = ref(false)
const batchTagInput = ref('')

const openTagModal = () => {
  batchTagInput.value = ''
  tagModalOpen.value = true
}

const confirmAddTag = () => {
  const tag = batchTagInput.value.trim()
  if (!tag) {
    toast.warning('Informe o nome da tag')
    return
  }
  const affected = addTagToCustomers(selectedIds.value, tag)
  tagModalOpen.value = false
  if (affected > 0) toast.success(`Tag "${tag}" adicionada a ${affected} cliente(s)`)
  else toast.info('Os clientes selecionados já possuíam essa tag')
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  tagsFilter.value = null
  sortBy.value = 'name'
  currentPage.value = 1
}
</script>

<template>
  <div>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <ZimaPageHeader
      title="Clientes"
      description="Gerencie e acompanhe seus clientes"
      :badge="`${customers.length}`"
    >
      <template #actions>
        <ZimaButton variant="primary" @click="openNew">
          <template #icon-left>
            <Icon name="i-lucide-user-plus" style="width: 14px; height: 14px;" />
          </template>
          Novo Cliente
        </ZimaButton>
      </template>
    </ZimaPageHeader>

    <!-- Painel de insights de CRM -->
    <div v-if="!loading && customers.length" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <ZimaCard padding="md">
        <div class="flex items-center gap-3">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: var(--zima-blue-subtle); display: flex; align-items: center; justify-content: center;">
            <Icon name="i-lucide-gem" style="width: 18px; height: 18px; color: var(--zima-blue-core);" />
          </div>
          <div>
            <p style="font-size: 12px; color: var(--zima-text-muted);">LTV médio estimado</p>
            <p style="font-size: 18px; font-weight: 700; color: var(--zima-text-primary); font-family: var(--zima-font-mono);">{{ fmtBRL(ltvMedio) }}</p>
          </div>
        </div>
      </ZimaCard>
      <ZimaCard padding="md">
        <div class="flex items-center gap-3">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: var(--zima-success-subtle, rgba(16,185,129,0.1)); display: flex; align-items: center; justify-content: center;">
            <Icon name="i-lucide-users" style="width: 18px; height: 18px; color: var(--zima-success);" />
          </div>
          <div>
            <p style="font-size: 12px; color: var(--zima-text-muted);">Base ativa</p>
            <p style="font-size: 18px; font-weight: 700; color: var(--zima-text-primary); font-family: var(--zima-font-mono);">{{ customers.length - atRisk.length }} de {{ customers.length }}</p>
          </div>
        </div>
      </ZimaCard>
      <ZimaCard padding="md" :style="{ border: atRisk.length ? '1px solid rgba(245,158,11,0.3)' : undefined }">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(245,158,11,0.1); display: flex; align-items: center; justify-content: center;">
              <Icon name="i-lucide-user-minus" style="width: 18px; height: 18px; color: var(--zima-warning);" />
            </div>
            <div>
              <p style="font-size: 12px; color: var(--zima-text-muted);">Em risco de churn</p>
              <p style="font-size: 18px; font-weight: 700; color: var(--zima-warning); font-family: var(--zima-font-mono);">{{ atRisk.length }}</p>
            </div>
          </div>
          <ZimaButton v-if="atRisk.length" size="sm" variant="secondary" @click="createWinbackCampaign">
            <template #icon-left><Icon name="i-lucide-megaphone" style="width: 13px; height: 13px;" /></template>
            Reativar
          </ZimaButton>
        </div>
      </ZimaCard>
    </div>

    <!-- Batch actions bar -->
    <Transition name="slide-down">
      <div
        v-if="selectedIds.length > 0"
        class="flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg px-4 py-3"
        style="background: var(--zima-blue-core); color: white;"
      >
        <span style="font-size: 13px; font-weight: 500;">{{ selectedIds.length }} selecionado(s)</span>
        <div class="flex-1" />
        <ZimaButton variant="ghost" size="sm" style="color: white;" @click="exportSelected">
          <template #icon-left>
            <Icon name="i-lucide-download" style="width: 13px; height: 13px;" />
          </template>
          Exportar
        </ZimaButton>
        <ZimaButton variant="ghost" size="sm" style="color: white;" @click="openTagModal">
          <template #icon-left>
            <Icon name="i-lucide-tag" style="width: 13px; height: 13px;" />
          </template>
          Adicionar Tag
        </ZimaButton>
        <ZimaButton variant="danger" size="sm" @click="handleBatchDelete">
          <template #icon-left>
            <Icon name="i-lucide-trash-2" style="width: 13px; height: 13px;" />
          </template>
          Excluir
        </ZimaButton>
      </div>
    </Transition>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
      <div class="w-full sm:flex-1">
        <ZimaInput
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por nome, e-mail ou telefone..."
        />
      </div>
      <ZimaSelect
        :model-value="statusFilter ?? '__all__'"
        :options="statusOptions"
        placeholder="Status"
        class="w-full sm:w-auto"
        style="min-width: 160px;"
        @update:model-value="statusFilter = $event === '__all__' ? null : ($event as string)"
      />
      <ZimaSelect
        :model-value="tagsFilter ?? '__all__'"
        :options="tagOptions"
        placeholder="Tag"
        class="w-full sm:w-auto"
        style="min-width: 140px;"
        @update:model-value="tagsFilter = $event === '__all__' ? null : ($event as string)"
      />
      <ZimaSelect
        :model-value="sortBy"
        :options="sortOptions"
        class="w-full sm:w-auto"
        style="min-width: 160px;"
        @update:model-value="sortBy = $event as string"
      />
      <ZimaButton
        v-if="searchQuery || (statusFilter && statusFilter !== '__all__') || (tagsFilter && tagsFilter !== '__all__')"
        variant="ghost"
        size="sm"
        @click="clearFilters"
      >
        Limpar filtros
      </ZimaButton>
    </div>

    <!-- Table -->
    <ZimaCard padding="none">
      <ZimaTable
        :columns="tableColumns"
        :rows="tableRows"
        :loading="loading"
        :total="filteredCustomers.length"
        :page="currentPage"
        :page-size="pageSize"
        :page-size-options="[10, 20, 50]"
        selectable
        row-clickable
        empty-title="Nenhum cliente encontrado"
        empty-description="Tente ajustar os filtros ou cadastre um novo cliente"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        @page-change="currentPage = $event"
        @page-size-change="pageSize = $event"
      >
        <!-- Cliente column -->
        <template #cell-cliente="{ row }">
          <div class="flex items-center gap-3">
            <ZimaAvatar :name="row.name" size="sm" />
            <div class="flex flex-col">
              <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ row.name }}</span>
              <span style="font-size: 12px; color: var(--zima-text-muted);">{{ row.email }}</span>
            </div>
          </div>
        </template>

        <!-- Phone column -->
        <template #cell-phone="{ row }">
          <span style="font-size: 13px; color: var(--zima-text-secondary);">{{ row.phone }}</span>
        </template>

        <!-- Tags column -->
        <template #cell-tags="{ row }">
          <div class="flex items-center gap-1 flex-wrap">
            <ZimaBadge
              v-for="tag in (row.tags as string[]).slice(0, 2)"
              :key="tag"
              variant="neutral"
              size="sm"
            >
              {{ tag }}
            </ZimaBadge>
            <span
              v-if="(row.tags as string[]).length > 2"
              style="font-size: 11px; color: var(--zima-text-muted);"
            >
              +{{ (row.tags as string[]).length - 2 }}
            </span>
          </div>
        </template>

        <!-- Status column -->
        <template #cell-status="{ row }">
          <ZimaBadge :variant="CUSTOMER_STATUS[row.status as keyof typeof CUSTOMER_STATUS].variant">
            {{ CUSTOMER_STATUS[row.status as keyof typeof CUSTOMER_STATUS].label }}
          </ZimaBadge>
        </template>

        <!-- Visits column -->
        <template #cell-visits="{ row }">
          <span style="font-family: var(--zima-font-mono); font-size: 13px; color: var(--zima-text-secondary);">
            {{ row.visits }}
          </span>
        </template>

        <!-- Total column -->
        <template #cell-total="{ row }">
          <span style="font-family: var(--zima-font-mono); font-size: 13px; color: var(--zima-text-primary); font-weight: 500;">
            {{ formatCurrency(row.totalSpent as number) }}
          </span>
        </template>

        <!-- Last visit column -->
        <template #cell-ultima_visita="{ row }">
          <span style="font-size: 13px; color: var(--zima-text-secondary);">
            {{ formatDate(row.lastVisitDate as string | undefined) }}
          </span>
        </template>

        <!-- Actions column -->
        <template #cell-actions="{ row }">
          <div class="relative" @click.stop>
            <button
              class="flex items-center justify-center rounded-lg"
              style="width: 32px; height: 32px; color: var(--zima-text-muted); cursor: pointer; background: none; border: none; transition: background 150ms;"
              @click="openDropdownId = openDropdownId === row.id ? null : row.id"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
            >
              <Icon name="i-lucide-more-horizontal" style="width: 15px; height: 15px;" />
            </button>

            <div
              v-if="openDropdownId === row.id"
              class="absolute right-0 rounded-lg py-1 z-50"
              style="
                top: calc(100% + 4px);
                min-width: 160px;
                background: var(--zima-bg-surface-2);
                border: 1px solid var(--zima-border-default);
                box-shadow: var(--zima-shadow-lg);
              "
            >
              <button
                class="flex items-center gap-2 w-full px-3 py-2 text-left"
                style="font-size: 13px; color: var(--zima-text-primary); cursor: pointer; background: none; border: none; transition: background 100ms;"
                @click="navigateTo(`/saas/clientes/${row.id}`)"
                @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
              >
                <Icon name="i-lucide-user" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
                Ver Perfil
              </button>
              <button
                class="flex items-center gap-2 w-full px-3 py-2 text-left"
                style="font-size: 13px; color: var(--zima-text-primary); cursor: pointer; background: none; border: none; transition: background 100ms;"
                @click="openEdit(row._raw as Customer)"
                @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
              >
                <Icon name="i-lucide-pencil" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
                Editar
              </button>
              <div style="height: 1px; background: var(--zima-border-divider); margin: 4px 0;" />
              <button
                class="flex items-center gap-2 w-full px-3 py-2 text-left"
                style="font-size: 13px; color: var(--zima-danger); cursor: pointer; background: none; border: none; transition: background 100ms;"
                @click="handleDelete(row._raw as Customer)"
                @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
              >
                <Icon name="i-lucide-trash-2" style="width: 13px; height: 13px;" />
                Excluir
              </button>
            </div>
          </div>
        </template>
      </ZimaTable>
    </ZimaCard>

    <!-- Modal -->
    <ModalCliente
      v-model="modalOpen"
      :customer="editingCustomer"
      @saved="handleSaved"
    />

    <!-- Modal: confirmar exclusão -->
    <ZimaModal v-model="deleteModalOpen" title="Confirmar exclusão" size="sm">
      <p style="font-size: 14px; color: var(--zima-text-secondary); line-height: 1.5;">
        {{ deleteModalText }}
      </p>
      <template #footer>
        <ZimaButton variant="ghost" @click="deleteModalOpen = false">Cancelar</ZimaButton>
        <ZimaButton variant="danger" :loading="deleting" @click="confirmDelete">Excluir</ZimaButton>
      </template>
    </ZimaModal>

    <!-- Modal: adicionar tag em lote -->
    <ZimaModal v-model="tagModalOpen" title="Adicionar tag" size="sm">
      <div class="flex flex-col gap-3">
        <p style="font-size: 13px; color: var(--zima-text-muted);">
          A tag será aplicada aos {{ selectedIds.length }} cliente(s) selecionado(s).
        </p>
        <ZimaInput
          v-model="batchTagInput"
          label="Nome da tag"
          placeholder="ex.: Fidelizada, Black Friday..."
          @keyup.enter="confirmAddTag"
        />
        <div v-if="allTags.length" class="flex flex-wrap gap-1.5">
          <button
            v-for="t in allTags.slice(0, 8)"
            :key="t"
            type="button"
            style="font-size: 12px; padding: 3px 10px; border-radius: var(--zima-radius-full); border: 1px solid var(--zima-border-default); background: var(--zima-bg-surface-2); color: var(--zima-text-secondary); cursor: pointer; transition: all 120ms;"
            @click="batchTagInput = t"
            @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-blue-core)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'"
          >{{ t }}</button>
        </div>
      </div>
      <template #footer>
        <ZimaButton variant="ghost" @click="tagModalOpen = false">Cancelar</ZimaButton>
        <ZimaButton variant="primary" @click="confirmAddTag">Adicionar</ZimaButton>
      </template>
    </ZimaModal>
  </div>

  <!-- Close dropdown on outside click -->
  <div
    v-if="openDropdownId"
    class="fixed inset-0 z-40"
    @click="openDropdownId = null"
  />
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 200ms ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
