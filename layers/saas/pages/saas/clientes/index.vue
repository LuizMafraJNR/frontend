<script setup lang="ts">
import type { Customer } from '../../../composables/useCustomers'
import { useCustomers, CUSTOMER_STATUS } from '../../../composables/useCustomers'
import ModalCliente from '../ModalCliente.vue'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const { customers, loading, fetchAll, deleteCustomer } = useCustomers()
const route = useRoute()
const router = useRouter()

onMounted(() => fetchAll())

// Filters — inicializa dos query params
const searchQuery = ref((route.query.q as string) || '')
const debouncedSearch = useDebounce(searchQuery, 300)
const statusFilter = ref<string | null>((route.query.status as string) || null)
const tagsFilter = ref<string | null>((route.query.tags as string) || null)
const sortBy = ref((route.query.sort as string) || 'name')
const currentPage = ref(1)
const pageSize = ref(10)

// Sincroniza URL quando filtros mudam
watch([debouncedSearch, statusFilter, tagsFilter, sortBy], () => {
  router.replace({
    query: {
      ...(debouncedSearch.value ? { q: debouncedSearch.value } : {}),
      ...(statusFilter.value ? { status: statusFilter.value } : {}),
      ...(tagsFilter.value ? { tags: tagsFilter.value } : {}),
      ...(sortBy.value !== 'name' ? { sort: sortBy.value } : {}),
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
    result = result.filter(c => c.status === statusFilter.value)
  }

  if (tagsFilter.value && tagsFilter.value !== '__all__') {
    result = result.filter(c => c.tags.includes(tagsFilter.value!))
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
    status: c.status,
    visits: c.visits,
    totalSpent: c.totalSpent,
    lastVisitDate: c.lastVisitDate,
  })),
)

const tableColumns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'phone', label: 'Telefone' },
  { key: 'tags', label: 'Tags' },
  { key: 'status', label: 'Status' },
  { key: 'visits', label: 'Visitas', align: 'right' as const },
  { key: 'total', label: 'Total Gasto', align: 'right' as const },
  { key: 'ultima_visita', label: 'Última Visita' },
  { key: 'actions', label: '', width: '48px' },
]

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

const handleDelete = async (customer: Customer) => {
  openDropdownId.value = null
  if (!confirm(`Excluir ${customer.name}?`)) return
  await deleteCustomer(customer.id)
  toast.success('Cliente excluído')
}

const handleBatchDelete = async () => {
  if (!confirm(`Excluir ${selectedIds.value.length} cliente(s)?`)) return
  for (const id of selectedIds.value) {
    await deleteCustomer(id)
  }
  selectedIds.value = []
  toast.success('Clientes excluídos')
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
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 style="font-size: 24px; font-weight: 700; color: var(--zima-text-primary);">Clientes</h1>
        <span
          class="flex items-center justify-center rounded-full px-2.5"
          style="
            height: 24px;
            background: var(--zima-bg-surface-2);
            font-size: 12px;
            font-weight: 600;
            color: var(--zima-text-muted);
            font-family: 'Geist Mono', monospace;
          "
        >
          {{ customers.length }}
        </span>
      </div>
      <ZimaButton variant="primary" @click="openNew">
        <template #icon-left>
          <Icon name="i-lucide-user-plus" style="width: 14px; height: 14px;" />
        </template>
        Novo Cliente
      </ZimaButton>
    </div>

    <!-- Batch actions bar -->
    <Transition name="slide-down">
      <div
        v-if="selectedIds.length > 0"
        class="flex items-center gap-3 rounded-lg px-4 py-3"
        style="background: var(--zima-blue-core); color: white;"
      >
        <span style="font-size: 13px; font-weight: 500;">{{ selectedIds.length }} selecionado(s)</span>
        <div class="flex-1" />
        <ZimaButton variant="ghost" size="sm" style="color: white;" @click="toast.info('Exportação em breve')">
          <template #icon-left>
            <Icon name="i-lucide-download" style="width: 13px; height: 13px;" />
          </template>
          Exportar
        </ZimaButton>
        <ZimaButton variant="ghost" size="sm" style="color: white;" @click="toast.info('Adicionar tag em breve')">
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
    <div class="flex items-center gap-3">
      <div class="flex-1">
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
        style="min-width: 160px;"
        @update:model-value="statusFilter = $event === '__all__' ? null : ($event as string)"
      />
      <ZimaSelect
        :model-value="tagsFilter ?? '__all__'"
        :options="tagOptions"
        placeholder="Tag"
        style="min-width: 140px;"
        @update:model-value="tagsFilter = $event === '__all__' ? null : ($event as string)"
      />
      <ZimaSelect
        :model-value="sortBy"
        :options="sortOptions"
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
          <span style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-secondary);">
            {{ row.visits }}
          </span>
        </template>

        <!-- Total column -->
        <template #cell-total="{ row }">
          <span style="font-family: 'Geist Mono', monospace; font-size: 13px; color: var(--zima-text-primary); font-weight: 500;">
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
  </div>

  <!-- Close dropdown on outside click -->
  <div
    v-if="openDropdownId"
    class="fixed inset-0 z-40"
    @click="openDropdownId = null"
  />
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
