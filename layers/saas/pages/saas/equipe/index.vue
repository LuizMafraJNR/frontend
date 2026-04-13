<script setup lang="ts">
import ModalProfissional from '../ModalProfissional.vue'

definePageMeta({ layout: 'saas' })

const { professionals, loading, fetchAll, createProfessional, statusLabel, statusVariant } = useProfessionals()
const { services, fetchAll: fetchServices } = useServices()
const toast = useZimaToast()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchServices()])
})

const modalOpen = ref(false)

const handleSave = async (data: Parameters<typeof createProfessional>[0]) => {
  await createProfessional(data)
  toast.success('Profissional adicionado à equipe!')
}

const formatRevenue = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const activeCount = computed(() => professionals.value.filter(p => p.status === 'active').length)
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="page-equipe">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1
          class="text-2xl font-semibold"
          :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
        >
          Equipe
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--zima-text-muted)' }">
          {{ professionals.length }} profissionais · {{ activeCount }} ativos
        </p>
      </div>

      <ZimaButton @click="modalOpen = true">
        <template #icon-left><Icon name="i-lucide-user-plus" style="width: 14px; height: 14px;" /></template>
        Novo Profissional
      </ZimaButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-3 gap-4">
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

    <!-- Grid de profissionais -->
    <div v-else class="grid grid-cols-3 gap-4">
      <NuxtLink
        v-for="pro in professionals"
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
              <ZimaBadge :variant="statusVariant(pro.status)" class="shrink-0">
                {{ statusLabel(pro.status) }}
              </ZimaBadge>
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
