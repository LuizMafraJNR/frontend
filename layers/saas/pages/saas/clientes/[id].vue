<script setup lang="ts">
import type { Customer } from '../../../composables/useCustomers'
import { useCustomers, CUSTOMER_STATUS } from '../../../composables/useCustomers'
import { useAppointments, STATUS_STYLE } from '../../../composables/useAppointments'
import DrawerDetalheAgendamento from '../DrawerDetalheAgendamento.vue'
import ModalCliente from '../ModalCliente.vue'
import ModalNovoAgendamento from '../ModalNovoAgendamento.vue'

definePageMeta({ layout: 'saas' })

const route = useRoute()
const customerId = route.params.id as string
const toast = useZimaToast()

const { customers, loading: customersLoading, fetchAll: fetchCustomers, updateCustomer, getById } = useCustomers()
const { appointments, fetchAll: fetchAppointments } = useAppointments()

onMounted(async () => {
  if (!customers.value.length) await fetchCustomers()
  if (!appointments.value.length) await fetchAppointments()
})

const customer = computed<Customer | undefined>(() => getById(customerId))

// Tabs
const activeTab = ref('historico')
const TABS = [
  { key: 'historico',  label: 'Histórico' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'notas',      label: 'Observações' },
  { key: 'tags',       label: 'Tags' },
]

// Drawer + Modals
const drawerDetalheId = ref<string | null>(null)
const drawerOpen = computed({
  get: () => !!drawerDetalheId.value,
  set: (v) => { if (!v) drawerDetalheId.value = null },
})
const modalEditOpen = ref(false)
const modalNovoAgendamentoOpen = ref(false)

// Notes autosave
const notesValue = ref('')
const notesSaving = ref(false)
watch(customer, (c) => {
  if (c) notesValue.value = c.notes ?? ''
}, { immediate: true })

const saveNotes = useDebounceFn(async () => {
  if (!customer.value) return
  await updateCustomer(customerId, { notes: notesValue.value })
}, 800)

// Tags
const newTagInput = ref('')

const addTag = async () => {
  const tag = newTagInput.value.trim()
  if (!tag || !customer.value) return
  if (customer.value.tags.includes(tag)) {
    newTagInput.value = ''
    return
  }
  await updateCustomer(customerId, { tags: [...customer.value.tags, tag] })
  await fetchCustomers()
  newTagInput.value = ''
  toast.success('Tag adicionada')
}

const removeTag = async (tag: string) => {
  if (!customer.value) return
  await updateCustomer(customerId, { tags: customer.value.tags.filter(t => t !== tag) })
  await fetchCustomers()
}

// All unique tags in system for suggestions
const allSystemTags = computed(() => {
  const set = new Set<string>()
  customers.value.forEach(c => c.tags.forEach(t => set.add(t)))
  if (customer.value) customer.value.tags.forEach(t => set.delete(t))
  return [...set].sort()
})

// Client appointments
const clientAppointments = computed(() =>
  appointments.value
    .filter(a => a.clientId === customerId)
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)),
)

const completedAppointments = computed(() =>
  clientAppointments.value.filter(a => a.status === 'COMPLETED'),
)

const ticketMedio = computed(() => {
  if (!completedAppointments.value.length) return 0
  const total = completedAppointments.value.reduce((sum, a) => sum + a.price, 0)
  return total / completedAppointments.value.length
})

const serviceFavorito = computed(() => {
  if (!completedAppointments.value.length) return '—'
  const count: Record<string, number> = {}
  completedAppointments.value.forEach(a => {
    count[a.serviceName] = (count[a.serviceName] ?? 0) + 1
  })
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
})

const historyColumns = [
  { key: 'data', label: 'Data / Hora' },
  { key: 'servico', label: 'Serviço' },
  { key: 'profissional', label: 'Profissional' },
  { key: 'valor', label: 'Valor', align: 'right' as const },
  { key: 'status', label: 'Status' },
]

const historyRows = computed(() =>
  clientAppointments.value.map(a => ({
    id: a.id,
    data: `${formatDate(a.date)} ${a.startTime}`,
    servico: a.serviceName,
    duracao: a.serviceDuration,
    profissional: a.professionalName,
    valor: a.price,
    status: a.status,
  })),
)

const financeColumns = [
  { key: 'data', label: 'Data' },
  { key: 'servico', label: 'Serviço' },
  { key: 'profissional', label: 'Profissional' },
  { key: 'valor', label: 'Valor', align: 'right' as const },
]

const financeRows = computed(() =>
  completedAppointments.value.map(a => ({
    id: a.id,
    data: formatDate(a.date),
    servico: a.serviceName,
    profissional: a.professionalName,
    valor: a.price,
  })),
)

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (date: string) => {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const formatDateFull = (date: string | undefined) => {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

const handleSaved = () => fetchCustomers()

const saveNotesDirect = async () => {
  if (!customer.value) return
  notesSaving.value = true
  await updateCustomer(customerId, { notes: notesValue.value })
  notesSaving.value = false
  toast.success('Observações salvas')
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="customersLoading" class="flex flex-col gap-4">
      <ZimaSkeleton height="200px" />
      <ZimaSkeleton height="400px" />
    </div>

    <!-- 404 -->
    <div v-else-if="!customer" class="flex flex-col items-center gap-4 py-24">
      <Icon name="i-lucide-user-x" style="width: 48px; height: 48px; color: var(--zima-text-muted);" />
      <p style="font-size: 16px; color: var(--zima-text-muted);">Cliente não encontrado</p>
      <ZimaButton variant="ghost" @click="navigateTo('/saas/clientes')">
        Voltar para Clientes
      </ZimaButton>
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-12 gap-6">
      <!-- Sidebar -->
      <div class="col-span-4">
        <ZimaCard padding="lg">
          <div class="flex flex-col gap-5">
            <!-- Back -->
            <button
              class="flex items-center gap-1.5 self-start"
              style="background: none; border: none; cursor: pointer; color: var(--zima-text-muted); font-size: 13px; padding: 0;"
              @click="navigateTo('/saas/clientes')"
            >
              <Icon name="i-lucide-arrow-left" style="width: 14px; height: 14px;" />
              Clientes
            </button>

            <!-- Avatar + status -->
            <div class="flex flex-col items-center gap-3 text-center">
              <div
                class="flex items-center justify-center rounded-full"
                style="width: 80px; height: 80px; background: var(--zima-blue-subtle); font-size: 28px; font-weight: 700; color: var(--zima-blue-core);"
              >
                {{ getInitials(customer.name) }}
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <ZimaBadge :variant="CUSTOMER_STATUS[customer.status].variant">
                  {{ CUSTOMER_STATUS[customer.status].label }}
                </ZimaBadge>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--zima-text-primary);">{{ customer.name }}</h2>
              </div>

              <div class="flex flex-col gap-1 w-full">
                <div class="flex items-center gap-2 justify-center">
                  <Icon name="i-lucide-phone" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
                  <span style="font-size: 13px; color: var(--zima-text-secondary);">{{ customer.phone }}</span>
                </div>
                <div class="flex items-center gap-2 justify-center">
                  <Icon name="i-lucide-mail" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
                  <span style="font-size: 13px; color: var(--zima-text-secondary);">{{ customer.email }}</span>
                </div>
              </div>
            </div>

            <div style="height: 1px; background: var(--zima-border-divider);" />

            <!-- KPIs -->
            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col items-center gap-0.5">
                <span style="font-size: 20px; font-weight: 700; color: var(--zima-text-primary); font-family: 'Geist Mono', monospace;">{{ customer.visits }}</span>
                <span style="font-size: 11px; color: var(--zima-text-muted);">Visitas</span>
              </div>
              <div class="flex flex-col items-center gap-0.5">
                <span style="font-size: 15px; font-weight: 700; color: var(--zima-text-primary); font-family: 'Geist Mono', monospace;">{{ formatCurrency(customer.totalSpent).replace('R$\xa0', '') }}</span>
                <span style="font-size: 11px; color: var(--zima-text-muted);">Total Gasto</span>
              </div>
              <div class="flex flex-col items-center gap-0.5">
                <span style="font-size: 20px; font-weight: 700; color: var(--zima-text-primary); font-family: 'Geist Mono', monospace;">{{ customer.loyaltyPoints }}</span>
                <span style="font-size: 11px; color: var(--zima-text-muted);">Pontos</span>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="customer.tags.length" class="flex flex-wrap gap-1.5 justify-center">
              <ZimaBadge v-for="tag in customer.tags" :key="tag" variant="neutral" size="sm">
                {{ tag }}
              </ZimaBadge>
            </div>

            <div style="height: 1px; background: var(--zima-border-divider);" />

            <!-- Dates -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span style="font-size: 12px; color: var(--zima-text-muted);">Cliente desde</span>
                <span style="font-size: 12px; color: var(--zima-text-secondary); font-weight: 500;">{{ formatDateFull(customer.since) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span style="font-size: 12px; color: var(--zima-text-muted);">Última visita</span>
                <span style="font-size: 12px; color: var(--zima-text-secondary); font-weight: 500;">{{ formatDateFull(customer.lastVisitDate) }}</span>
              </div>
            </div>

            <div style="height: 1px; background: var(--zima-border-divider);" />

            <!-- Actions -->
            <div class="flex flex-col gap-2">
              <ZimaButton variant="primary" class="w-full" @click="modalNovoAgendamentoOpen = true">
                <template #icon-left>
                  <Icon name="i-lucide-calendar-plus" style="width: 14px; height: 14px;" />
                </template>
                Novo Agendamento
              </ZimaButton>
              <ZimaButton variant="ghost" class="w-full" @click="modalEditOpen = true">
                <template #icon-left>
                  <Icon name="i-lucide-pencil" style="width: 14px; height: 14px;" />
                </template>
                Editar Cliente
              </ZimaButton>
            </div>
          </div>
        </ZimaCard>
      </div>

      <!-- Tabs area -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- Tab nav -->
        <div
          class="flex gap-1 rounded-lg p-1"
          style="background: var(--zima-bg-surface-2);"
        >
          <button
            v-for="tab in TABS"
            :key="tab.key"
            class="flex-1 rounded-md py-2 px-3"
            :style="{
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 150ms',
              background: activeTab === tab.key ? 'var(--zima-bg-surface-1)' : 'none',
              color: activeTab === tab.key ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
              boxShadow: activeTab === tab.key ? 'var(--zima-shadow-sm)' : 'none',
            }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab: Histórico -->
        <template v-if="activeTab === 'historico'">
          <ZimaCard padding="none">
            <ZimaTable
              :columns="historyColumns"
              :rows="historyRows"
              row-clickable
              empty-title="Sem agendamentos"
              empty-description="Este cliente ainda não tem agendamentos registrados"
              @row-click="(row) => { drawerDetalheId = row.id as string }"
            >
              <template #cell-servico="{ row }">
                <div class="flex items-center gap-2">
                  <span style="font-size: 13px; color: var(--zima-text-primary);">{{ row.servico }}</span>
                  <ZimaBadge variant="neutral" size="sm">{{ row.duracao }}min</ZimaBadge>
                </div>
              </template>
              <template #cell-valor="{ row }">
                <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">
                  {{ formatCurrency(row.valor as number) }}
                </span>
              </template>
              <template #cell-status="{ row }">
                <ZimaBadge :variant="STATUS_STYLE[row.status as keyof typeof STATUS_STYLE].variant">
                  {{ STATUS_STYLE[row.status as keyof typeof STATUS_STYLE].label }}
                </ZimaBadge>
              </template>
            </ZimaTable>
          </ZimaCard>
        </template>

        <!-- Tab: Financeiro -->
        <template v-if="activeTab === 'financeiro'">
          <div class="grid grid-cols-3 gap-4">
            <ZimaCard padding="md">
              <div class="flex flex-col gap-1">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); font-weight: 600;">Total Gasto</span>
                <span style="font-size: 22px; font-weight: 700; color: var(--zima-text-primary); font-family: 'Geist Mono', monospace;">
                  {{ formatCurrency(customer.totalSpent) }}
                </span>
              </div>
            </ZimaCard>
            <ZimaCard padding="md">
              <div class="flex flex-col gap-1">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); font-weight: 600;">Ticket Médio</span>
                <span style="font-size: 22px; font-weight: 700; color: var(--zima-text-primary); font-family: 'Geist Mono', monospace;">
                  {{ formatCurrency(ticketMedio) }}
                </span>
              </div>
            </ZimaCard>
            <ZimaCard padding="md">
              <div class="flex flex-col gap-1">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--zima-text-muted); font-weight: 600;">Serviço Favorito</span>
                <span style="font-size: 15px; font-weight: 700; color: var(--zima-text-primary);">
                  {{ serviceFavorito }}
                </span>
              </div>
            </ZimaCard>
          </div>

          <ZimaCard padding="none">
            <ZimaTable
              :columns="financeColumns"
              :rows="financeRows"
              empty-title="Sem transações"
              empty-description="Nenhum atendimento concluído ainda"
            >
              <template #cell-valor="{ row }">
                <span style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 500; color: var(--zima-success);">
                  {{ formatCurrency(row.valor as number) }}
                </span>
              </template>
            </ZimaTable>
          </ZimaCard>
        </template>

        <!-- Tab: Observações -->
        <template v-if="activeTab === 'notas'">
          <ZimaCard padding="md">
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Observações sobre o cliente</span>
                <ZimaButton
                  variant="ghost"
                  size="sm"
                  :loading="notesSaving"
                  @click="saveNotesDirect"
                >
                  Salvar
                </ZimaButton>
              </div>
              <textarea
                v-model="notesValue"
                placeholder="Adicione observações sobre este cliente..."
                rows="8"
                class="rounded-lg px-3 py-2 resize-none w-full"
                style="
                  border: 1px solid var(--zima-border-default);
                  background: var(--zima-bg-input);
                  color: var(--zima-text-primary);
                  font-size: 13px;
                  font-family: inherit;
                  outline: none;
                  transition: border-color 150ms;
                "
                @blur="saveNotes()"
              />
              <p style="font-size: 11px; color: var(--zima-text-muted);">Salvo automaticamente ao sair do campo</p>
            </div>
          </ZimaCard>
        </template>

        <!-- Tab: Tags -->
        <template v-if="activeTab === 'tags'">
          <ZimaCard padding="md">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Tags atuais</span>
                <div v-if="customer.tags.length" class="flex flex-wrap gap-2">
                  <ZimaBadge
                    v-for="tag in customer.tags"
                    :key="tag"
                    variant="neutral"
                    removable
                    @remove="removeTag(tag)"
                  >
                    {{ tag }}
                  </ZimaBadge>
                </div>
                <p v-else style="font-size: 13px; color: var(--zima-text-muted);">Nenhuma tag adicionada</p>
              </div>

              <div style="height: 1px; background: var(--zima-border-divider);" />

              <div class="flex flex-col gap-2">
                <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Adicionar tag</span>
                <div class="flex gap-2">
                  <ZimaInput
                    v-model="newTagInput"
                    placeholder="Nova tag..."
                    class="flex-1"
                    @keydown.enter.prevent="addTag"
                  />
                  <ZimaButton variant="ghost" @click="addTag">
                    Adicionar
                  </ZimaButton>
                </div>
              </div>

              <div v-if="allSystemTags.length" class="flex flex-col gap-2">
                <span style="font-size: 12px; color: var(--zima-text-muted);">Sugestões do sistema</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="tag in allSystemTags"
                    :key="tag"
                    class="rounded-full px-3 py-1"
                    style="
                      font-size: 12px;
                      cursor: pointer;
                      border: 1px dashed var(--zima-border-default);
                      background: none;
                      color: var(--zima-text-muted);
                      transition: all 150ms;
                    "
                    @click="newTagInput = tag; addTag()"
                    @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-blue-core)'; ($event.currentTarget as HTMLElement).style.color = 'var(--zima-blue-core)'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'; ($event.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'"
                  >
                    + {{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </ZimaCard>
        </template>
      </div>
    </div>

    <!-- Drawer de Agendamento -->
    <DrawerDetalheAgendamento
      v-model="drawerOpen"
      :appointment-id="drawerDetalheId"
      @updated="fetchAppointments"
    />

    <!-- Modal de Edição -->
    <ModalCliente
      v-if="customer"
      v-model="modalEditOpen"
      :customer="customer"
      @saved="handleSaved"
    />

    <!-- Modal Novo Agendamento -->
    <ModalNovoAgendamento
      v-model="modalNovoAgendamentoOpen"
      :prefill="{ date: new Date().toISOString().slice(0, 10) }"
    />
  </div>
</template>
