<script setup lang="ts">
import ModalProfissional from '../ModalProfissional.vue'

definePageMeta({ layout: 'saas' })

const { professionals, loading, fetchAll, createProfessional, updateProfessional, statusLabel, statusVariant } = useProfessionals()
const { services, fetchAll: fetchServices } = useServices()
const toast = useZimaToast()
const router = useRouter()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchServices()])
})

const modalOpen = ref(false)

const handleSave = async (data: Parameters<typeof createProfessional>[0]) => {
  await createProfessional(data)
  toast.success('Profissional adicionado à equipe!')
}

// ── Menu 3-dot do card ────────────────────────────────────────────────────────
const openCardMenu = ref<string | null>(null)
const openNewPro = () => { modalOpen.value = true }
const editPro = (pro: typeof professionals.value[number]) => {
  openCardMenu.value = null
  router.push(`/saas/equipe/${pro.id}`) // edição completa (horários/comissões) no detalhe
}
const viewAgenda = (pro: typeof professionals.value[number]) => {
  openCardMenu.value = null
  router.push({ path: '/saas/agenda', query: { professional: pro.id } })
}
const toggleProStatus = async (pro: typeof professionals.value[number]) => {
  const next = pro.status === 'active' ? 'inactive' : 'active'
  await updateProfessional(pro.id, { status: next })
  toast.success(next === 'active' ? 'Profissional reativado' : 'Profissional desativado')
  openCardMenu.value = null
}
onMounted(() => {
  const close = () => { openCardMenu.value = null }
  document.addEventListener('click', close)
  onUnmounted(() => document.removeEventListener('click', close))
})

const formatRevenue = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const activeCount = computed(() => professionals.value.filter(p => p.status === 'active').length)

// ── Busca e filtro ────────────────────────────────────────────────────────────
const search = ref('')
const debouncedSearch = useDebounce(search, 250)
const statusFilter = ref<string>('all')
const statusFilterOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
  { label: 'Em férias', value: 'vacation' },
]
const sortBy = ref<string>('name')
const sortOptions = [
  { label: 'Nome (A-Z)', value: 'name' },
  { label: 'Mais receita', value: 'revenue' },
  { label: 'Mais agendamentos', value: 'appointments' },
]

const filteredProfessionals = computed(() => {
  let result = [...professionals.value]
  if (debouncedSearch.value) {
    const q = debouncedSearch.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
  }
  if (statusFilter.value !== 'all') {
    result = result.filter(p => p.status === statusFilter.value)
  }
  result.sort((a, b) => {
    if (sortBy.value === 'revenue') return b.revenueThisMonth - a.revenueThisMonth
    if (sortBy.value === 'appointments') return b.appointmentsThisMonth - a.appointmentsThisMonth
    return a.name.localeCompare(b.name)
  })
  return result
})
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="page-equipe">
    <!-- Header -->
    <ZimaPageHeader
      title="Equipe"
      :description="`${professionals.length} profissionais · ${activeCount} ativos`"
    >
      <template #actions>
        <ZimaButton @click="openNewPro">
          <template #icon-left><Icon name="i-lucide-user-plus" style="width: 14px; height: 14px;" /></template>
          Novo Profissional
        </ZimaButton>
      </template>
    </ZimaPageHeader>

    <!-- Toolbar: busca + filtros -->
    <div v-if="!loading && professionals.length" class="flex flex-col sm:flex-row gap-2 sm:items-center">
      <div class="flex-1">
        <ZimaInput v-model="search" type="search" placeholder="Buscar por nome ou função...">
          <template #prefix><Icon name="i-lucide-search" style="width: 14px; height: 14px;" /></template>
        </ZimaInput>
      </div>
      <ZimaSelect v-model="statusFilter" :options="statusFilterOptions" style="min-width: 150px;" />
      <ZimaSelect v-model="sortBy" :options="sortOptions" style="min-width: 180px;" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ZimaSkeleton v-for="i in 4" :key="i" preset="card" height="200px" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="professionals.length === 0"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <Icon name="i-lucide-users" style="width: 40px; height: 40px;" :style="{ color: 'var(--zima-text-muted)' }" />
      <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">Nenhum profissional cadastrado.</p>
      <ZimaButton size="sm" @click="modalOpen = true">
        <template #icon-left><Icon name="i-lucide-user-plus" style="width: 14px; height: 14px;" /></template>
        Adicionar profissional
      </ZimaButton>
    </div>

    <!-- Sem resultados para o filtro -->
    <div
      v-else-if="filteredProfessionals.length === 0"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <Icon name="i-lucide-search-x" style="width: 36px; height: 36px;" :style="{ color: 'var(--zima-text-muted)' }" />
      <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">Nenhum profissional encontrado para os filtros.</p>
      <ZimaButton size="sm" variant="ghost" @click="search = ''; statusFilter = 'all'">Limpar filtros</ZimaButton>
    </div>

    <!-- Grid de profissionais -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="pro in filteredProfessionals"
        :key="pro.id"
        :to="`/saas/equipe/${pro.id}`"
        class="block no-underline"
      >
        <ZimaCard
          class="h-full transition-all cursor-pointer"
          :style="{}"
          hoverable
        >
          <div class="flex flex-col gap-4">
            <!-- Header do card -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <ZimaAvatar
                  :src="pro.avatar"
                  :name="pro.name"
                  size="lg"
                />
                <div class="min-w-0">
                  <p
                    class="text-sm font-semibold truncate"
                    :style="{ color: 'var(--zima-text-primary)' }"
                  >
                    {{ pro.name }}
                  </p>
                  <p
                    class="text-xs truncate"
                    :style="{ color: 'var(--zima-text-muted)' }"
                  >
                    {{ pro.role }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <ZimaBadge :variant="statusVariant(pro.status)">
                  {{ statusLabel(pro.status) }}
                </ZimaBadge>
                <!-- Menu 3-dot -->
                <div style="position: relative;">
                  <button
                    style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; border: none; background: transparent; color: var(--zima-text-muted); cursor: pointer;"
                    @click.stop.prevent="openCardMenu = openCardMenu === pro.id ? null : pro.id"
                    @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
                  >
                    <Icon name="i-lucide-more-vertical" style="width: 15px; height: 15px;" />
                  </button>
                  <div
                    v-if="openCardMenu === pro.id"
                    style="position: absolute; right: 0; top: 30px; z-index: 60; min-width: 160px; padding: 4px; border-radius: var(--zima-radius-md); background: var(--zima-bg-surface-3); border: 1px solid var(--zima-border-default); box-shadow: var(--zima-shadow-md);"
                    @click.stop.prevent
                  >
                    <button class="eq-menu-item" @click.stop.prevent="editPro(pro)">
                      <Icon name="i-lucide-pencil" style="width: 13px; height: 13px;" /> Editar
                    </button>
                    <button class="eq-menu-item" @click.stop.prevent="viewAgenda(pro)">
                      <Icon name="i-lucide-calendar" style="width: 13px; height: 13px;" /> Ver agenda
                    </button>
                    <button class="eq-menu-item" @click.stop.prevent="toggleProStatus(pro)">
                      <Icon :name="pro.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check'" style="width: 13px; height: 13px;" />
                      {{ pro.status === 'active' ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Serviços -->
            <div class="flex flex-wrap gap-1">
              <ZimaBadge
                v-for="svcId in pro.services.slice(0, 3)"
                :key="svcId"
                variant="neutral"
                size="sm"
              >
                {{ services.find(s => s.id === svcId)?.name ?? svcId }}
              </ZimaBadge>
              <ZimaBadge
                v-if="pro.services.length > 3"
                variant="neutral"
                size="sm"
              >
                +{{ pro.services.length - 3 }}
              </ZimaBadge>
            </div>

            <!-- KPIs do mês -->
            <div
              class="grid grid-cols-2 gap-3 pt-3"
              :style="{ borderTop: '1px solid var(--zima-border-divider)' }"
            >
              <div>
                <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
                  Agendamentos
                </p>
                <p
                  class="text-lg font-bold tabular-nums"
                  :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-mono)' }"
                >
                  {{ pro.appointmentsThisMonth }}
                </p>
              </div>
              <div>
                <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
                  Receita/mês
                </p>
                <p
                  class="text-base font-bold tabular-nums"
                  :style="{ color: 'var(--zima-blue-light)', fontFamily: 'var(--zima-font-mono)' }"
                >
                  {{ formatRevenue(pro.revenueThisMonth) }}
                </p>
              </div>
            </div>

            <!-- Comissão -->
            <div class="flex items-center justify-between">
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
                Comissão
              </span>
              <span class="text-xs font-semibold" :style="{ color: 'var(--zima-text-secondary)' }">
                {{ pro.commissionRate }}%
              </span>
            </div>
          </div>
        </ZimaCard>
      </NuxtLink>
    </div>

    <!-- Modal -->
    <ModalProfissional
      v-model="modalOpen"
      :services="services"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.eq-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: var(--zima-text-primary);
  cursor: pointer;
  transition: background 120ms;
}
.eq-menu-item:hover {
  background: var(--zima-bg-surface-hover);
}
</style>
