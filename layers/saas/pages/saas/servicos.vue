<script setup lang="ts">
import type { Service, ServiceCategory } from '../../composables/useServices'
import ModalNovoServico from './ModalNovoServico.vue'
import ModalNovaCategoria from './ModalNovaCategoria.vue'

definePageMeta({ layout: 'saas' })

const {
  categories, services: _services, servicesByCategory, loading, fetchAll,
  toggleServiceActive, createService, updateService, deleteService,
  createCategory, updateCategory, deleteCategory,
  reorderServices, reorderCategories,
} = useServices()

const { professionals, fetchAll: fetchProfessionals } = useProfessionals()
const toast = useZimaToast()

onMounted(async () => {
  await fetchAll()
  if (!professionals.value.length) await fetchProfessionals()
})

const activeTab = ref<'services' | 'categories'>('services')

// Collapsible categories
const collapsedCategories = ref<Set<string>>(new Set())
const toggleCategoryCollapse = (catId: string) => {
  if (collapsedCategories.value.has(catId)) collapsedCategories.value.delete(catId)
  else collapsedCategories.value.add(catId)
}

// Modals
const modalServico = ref(false)
const modalCategoria = ref(false)

type EditingService = {
  id: string; name: string; categoryId: string; description?: string
  duration: number; price: number; priceType: 'fixed' | 'from'
  commissionRate: number; active: boolean
  onlineBooking: boolean; requiresAssessment: boolean; professionalIds: string[]
} | null

type EditingCategory = { id: string; name: string; color: string; icon?: string } | null

const editingService = ref<EditingService>(null)
const editingCategory = ref<EditingCategory>(null)

// 3-dot dropdown per service
const openDropdownId = ref<string | null>(null)

// Drag state for services
const dragSvcId = ref<string | null>(null)
const dragOverSvcId = ref<string | null>(null)
const dragCatId = ref<string | null>(null)

// Drag state for categories
const dragCategoryId = ref<string | null>(null)
const dragOverCategoryId = ref<string | null>(null)

const openNewService = () => {
  editingService.value = null
  modalServico.value = true
}

const openEditService = (svc: Service) => {
  openDropdownId.value = null
  editingService.value = {
    id: svc.id,
    name: svc.name,
    categoryId: svc.categoryId,
    description: '',
    duration: svc.duration,
    price: svc.price,
    priceType: 'fixed',
    commissionRate: svc.commissionRate,
    active: svc.active,
    onlineBooking: true,
    requiresAssessment: false,
    professionalIds: professionals.value
      .filter(p => p.services.includes(svc.id))
      .map(p => p.id),
  }
  modalServico.value = true
}

const openNewCategory = () => {
  editingCategory.value = null
  modalCategoria.value = true
}

const openEditCategory = (cat: ServiceCategory) => {
  openDropdownId.value = null
  editingCategory.value = { id: cat.id, name: cat.name, color: cat.color }
  modalCategoria.value = true
}

const handleSaveService = async (data: {
  name: string; categoryId: string; description: string
  duration: number; price: number; priceType: 'fixed' | 'from'
  commissionRate: number; active: boolean
  onlineBooking: boolean; requiresAssessment: boolean; professionalIds: string[]
}) => {
  // Only pass fields that Service interface knows about
  const serviceData = {
    name: data.name,
    categoryId: data.categoryId,
    duration: data.duration,
    price: data.price,
    commissionRate: data.commissionRate,
    active: data.active,
  }
  if (editingService.value?.id) {
    await updateService(editingService.value.id, serviceData)
    toast.success('Serviço atualizado com sucesso!')
  } else {
    await createService(serviceData)
    toast.success('Serviço criado com sucesso!')
  }
}

const handleSaveCategory = async (data: { name: string; color: string; icon: string }) => {
  if (editingCategory.value?.id) {
    await updateCategory(editingCategory.value.id, data)
    toast.success('Categoria atualizada!')
  } else {
    await createCategory(data)
    toast.success('Categoria criada!')
  }
}

const handleToggleActive = async (svc: Service) => {
  await toggleServiceActive(svc.id)
  toast.success(svc.active ? 'Serviço desativado.' : 'Serviço ativado.')
}

const handleDuplicateService = async (svc: Service) => {
  openDropdownId.value = null
  await createService({
    name: `${svc.name} (cópia)`,
    categoryId: svc.categoryId,
    duration: svc.duration,
    price: svc.price,
    commissionRate: svc.commissionRate,
    active: false,
  })
  toast.success('Serviço duplicado.')
}

const handleDeleteService = async (svc: Service) => {
  openDropdownId.value = null
  if (!confirm(`Excluir "${svc.name}"?`)) return
  await deleteService(svc.id)
  toast.success('Serviço removido.')
}

const handleDeleteCategory = async (cat: ServiceCategory) => {
  openDropdownId.value = null
  const group = servicesByCategory.value.find(g => g.category.id === cat.id)
  if (group && group.services.length > 0) {
    toast.error(`Mova os ${group.services.length} serviço(s) para outra categoria antes de excluir.`)
    return
  }
  if (!confirm(`Excluir categoria "${cat.name}"?`)) return
  await deleteCategory(cat.id)
  toast.success('Categoria removida.')
}

// D&D services within category
const onServiceDragStart = (e: DragEvent, svcId: string, catId: string) => {
  dragSvcId.value = svcId
  dragCatId.value = catId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', svcId)
  }
}

const onServiceDragOver = (e: DragEvent, svcId: string) => {
  e.preventDefault()
  dragOverSvcId.value = svcId
}

const onServiceDrop = (e: DragEvent, targetSvcId: string, catId: string) => {
  e.preventDefault()
  if (!dragSvcId.value || dragCatId.value !== catId) {
    dragSvcId.value = null; dragOverSvcId.value = null; dragCatId.value = null; return
  }
  const group = servicesByCategory.value.find(g => g.category.id === catId)
  if (!group) return
  const svcs = [...group.services]
  const fromIdx = svcs.findIndex(s => s.id === dragSvcId.value)
  const toIdx = svcs.findIndex(s => s.id === targetSvcId)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
    dragSvcId.value = null; dragOverSvcId.value = null; dragCatId.value = null; return
  }
  const [moved] = svcs.splice(fromIdx, 1)
  svcs.splice(toIdx, 0, moved)
  reorderServices(catId, svcs)
  dragSvcId.value = null; dragOverSvcId.value = null; dragCatId.value = null
}

// D&D categories
const onCatDragStart = (e: DragEvent, catId: string) => {
  dragCategoryId.value = catId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', catId)
  }
}

const onCatDragOver = (e: DragEvent, catId: string) => {
  e.preventDefault()
  dragOverCategoryId.value = catId
}

const onCatDrop = (e: DragEvent, targetCatId: string) => {
  e.preventDefault()
  if (!dragCategoryId.value || dragCategoryId.value === targetCatId) {
    dragCategoryId.value = null; dragOverCategoryId.value = null; return
  }
  const cats = [...categories.value]
  const fromIdx = cats.findIndex(c => c.id === dragCategoryId.value)
  const toIdx = cats.findIndex(c => c.id === targetCatId)
  if (fromIdx === -1 || toIdx === -1) return
  const [moved] = cats.splice(fromIdx, 1)
  cats.splice(toIdx, 0, moved)
  reorderCategories(cats)
  dragCategoryId.value = null; dragOverCategoryId.value = null
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h${m}min` : `${h}h`
}

const formatPrice = (price: number) =>
  price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
</script>

<template>
  <div>
  <div class="flex flex-col gap-6" data-testid="page-servicos">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold" :style="{ color: 'var(--zima-text-primary)' }">
          Serviços
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--zima-text-muted)' }">
          Gerencie os serviços e categorias oferecidos pelo seu negócio
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <ZimaButton variant="ghost" @click="openNewCategory">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 14px; height: 14px;" /></template>
          Nova Categoria
        </ZimaButton>
        <ZimaButton @click="openNewService">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 14px; height: 14px;" /></template>
          Novo Serviço
        </ZimaButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 p-1 rounded-lg w-fit" :style="{ background: 'var(--zima-bg-surface-2)' }">
      <button
        v-for="tab in [{ key: 'services', label: 'Serviços' }, { key: 'categories', label: 'Categorias' }]"
        :key="tab.key"
        class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
        :style="{
          background: activeTab === tab.key ? 'var(--zima-bg-surface-3)' : 'transparent',
          color: activeTab === tab.key ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
          boxShadow: activeTab === tab.key ? 'var(--zima-shadow-sm)' : 'none',
          border: 'none',
          cursor: 'pointer',
        }"
        @click="activeTab = tab.key as 'services' | 'categories'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <div class="flex flex-col gap-4">
        <ZimaSkeleton v-for="i in 3" :key="i" preset="card" height="160px" />
      </div>
    </template>

    <!-- Tab: Serviços -->
    <template v-else-if="activeTab === 'services'">
      <div v-if="servicesByCategory.length === 0" class="flex flex-col items-center justify-center py-16 gap-3">
        <Icon name="i-lucide-scissors" style="width: 40px; height: 40px; color: var(--zima-text-muted);" />
        <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">Nenhum serviço cadastrado.</p>
        <ZimaButton size="sm" @click="openNewService">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 14px; height: 14px;" /></template>
          Criar primeiro serviço
        </ZimaButton>
      </div>

      <div v-else class="flex flex-col gap-3">
        <ZimaCard
          v-for="group in servicesByCategory"
          :key="group.category.id"
          padding="none"
          :style="{ opacity: dragOverSvcId && dragCatId === group.category.id ? '0.95' : '1' }"
        >
          <!-- Category header (colapsável) -->
          <button
            class="flex items-center gap-3 w-full px-4 py-3 text-left"
            :style="{
              borderBottom: collapsedCategories.has(group.category.id) ? 'none' : '1px solid var(--zima-border-divider)',
              background: 'none',
              cursor: 'pointer',
            }"
            @click="toggleCategoryCollapse(group.category.id)"
          >
            <Icon
              name="i-lucide-chevron-down"
              :style="{
                width: '14px', height: '14px',
                color: 'var(--zima-text-muted)',
                transform: collapsedCategories.has(group.category.id) ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 200ms',
                flexShrink: 0,
              }"
            />
            <div
              class="rounded-full shrink-0"
              :style="{ width: '10px', height: '10px', background: group.category.color }"
            />
            <span class="text-sm font-semibold flex-1" :style="{ color: 'var(--zima-text-primary)' }">
              {{ group.category.name }}
            </span>
            <span style="font-size: 12px; color: var(--zima-text-muted);">
              {{ group.services.length }} {{ group.services.length === 1 ? 'serviço' : 'serviços' }}
            </span>
          </button>

          <!-- Services list -->
          <div v-if="!collapsedCategories.has(group.category.id)">
            <div
              v-if="group.services.length === 0"
              class="flex items-center justify-center py-6"
              style="font-size: 13px; color: var(--zima-text-muted);"
            >
              Nenhum serviço nesta categoria
            </div>

            <div v-else>
              <div
                v-for="(svc, idx) in group.services"
                :key="svc.id"
                draggable="true"
                class="flex items-center gap-3 px-4"
                :style="{
                  height: '52px',
                  borderBottom: idx < group.services.length - 1 ? '1px solid var(--zima-border-divider)' : 'none',
                  background: dragOverSvcId === svc.id && dragCatId === group.category.id
                    ? 'var(--zima-blue-subtle)'
                    : dragSvcId === svc.id ? 'var(--zima-bg-surface-3)' : 'none',
                  transition: 'background 100ms',
                  cursor: 'pointer',
                  opacity: dragSvcId === svc.id ? '0.5' : '1',
                }"
                @dragstart="onServiceDragStart($event, svc.id, group.category.id)"
                @dragover="onServiceDragOver($event, svc.id)"
                @drop="onServiceDrop($event, svc.id, group.category.id)"
                @dragend="dragSvcId = null; dragOverSvcId = null"
                @click="openEditService(svc)"
              >
                <!-- Drag handle -->
                <Icon
                  name="i-lucide-grip-vertical"
                  style="width: 14px; height: 14px; flex-shrink: 0; cursor: grab; color: var(--zima-text-muted);"
                  @click.stop
                />

                <!-- Nome -->
                <span
                  class="flex-1 text-sm font-medium truncate"
                  :style="{ color: svc.active ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)', fontSize: '14px' }"
                >
                  {{ svc.name }}
                </span>

                <!-- Badge duração (estilo especificado no spec) -->
                <span
                  class="rounded-full px-2 py-0.5 shrink-0"
                  style="
                    font-size: 11px;
                    font-weight: 500;
                    background: rgba(59,130,246,0.1);
                    color: #60A5FA;
                    white-space: nowrap;
                  "
                >
                  {{ formatDuration(svc.duration) }}
                </span>

                <!-- Preço -->
                <span
                  class="shrink-0"
                  style="
                    font-family: 'Geist Mono', monospace;
                    font-size: 13px;
                    color: var(--zima-text-primary);
                    min-width: 76px;
                    text-align: right;
                  "
                >
                  {{ formatPrice(svc.price) }}
                </span>

                <!-- Toggle ativo -->
                <div @click.stop>
                  <ZimaToggle
                    :model-value="svc.active"
                    size="sm"
                    @update:model-value="handleToggleActive(svc)"
                  />
                </div>

                <!-- Menu 3-dot -->
                <div class="relative" @click.stop>
                  <button
                    class="flex items-center justify-center rounded-md"
                    :style="{
                      width: '28px', height: '28px',
                      color: 'var(--zima-text-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }"
                    @click="openDropdownId = openDropdownId === svc.id ? null : svc.id"
                    @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                  >
                    <Icon name="i-lucide-more-horizontal" style="width: 14px; height: 14px;" />
                  </button>

                  <div
                    v-if="openDropdownId === svc.id"
                    class="absolute right-0 rounded-lg py-1 z-50"
                    style="
                      top: calc(100% + 4px);
                      min-width: 140px;
                      background: var(--zima-bg-surface-2);
                      border: 1px solid var(--zima-border-default);
                      box-shadow: var(--zima-shadow-lg);
                    "
                  >
                    <button
                      class="flex items-center gap-2 w-full px-3 py-2 text-left"
                      style="font-size: 13px; color: var(--zima-text-primary); cursor: pointer; background: none; border: none; transition: background 100ms;"
                      @click="openEditService(svc)"
                      @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                      @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                    >
                      <Icon name="i-lucide-pencil" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
                      Editar
                    </button>
                    <button
                      class="flex items-center gap-2 w-full px-3 py-2 text-left"
                      style="font-size: 13px; color: var(--zima-text-primary); cursor: pointer; background: none; border: none; transition: background 100ms;"
                      @click="handleDuplicateService(svc)"
                      @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                      @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                    >
                      <Icon name="i-lucide-copy" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
                      Duplicar
                    </button>
                    <button
                      class="flex items-center gap-2 w-full px-3 py-2 text-left"
                      style="font-size: 13px; color: var(--zima-text-primary); cursor: pointer; background: none; border: none; transition: background 100ms;"
                      @click="handleToggleActive(svc); openDropdownId = null"
                      @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                      @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                    >
                      <Icon
                        :name="svc.active ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        style="width: 13px; height: 13px; color: var(--zima-text-muted);"
                      />
                      {{ svc.active ? 'Desativar' : 'Ativar' }}
                    </button>
                    <div style="height: 1px; background: var(--zima-border-divider); margin: 4px 0;" />
                    <button
                      class="flex items-center gap-2 w-full px-3 py-2 text-left"
                      style="font-size: 13px; color: var(--zima-danger); cursor: pointer; background: none; border: none; transition: background 100ms;"
                      @click="handleDeleteService(svc)"
                      @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'"
                      @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                    >
                      <Icon name="i-lucide-trash-2" style="width: 13px; height: 13px;" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ZimaCard>
      </div>
    </template>

    <!-- Tab: Categorias -->
    <template v-else>
      <div v-if="categories.length === 0" class="flex flex-col items-center justify-center py-16 gap-3">
        <Icon name="i-lucide-folder" style="width: 40px; height: 40px; color: var(--zima-text-muted);" />
        <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">Nenhuma categoria cadastrada.</p>
        <ZimaButton size="sm" @click="openNewCategory">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 14px; height: 14px;" /></template>
          Criar primeira categoria
        </ZimaButton>
      </div>

      <ZimaCard v-else padding="none">
        <div
          v-for="(cat, idx) in categories"
          :key="cat.id"
          draggable="true"
          class="flex items-center gap-3 px-4"
          :style="{
            height: '56px',
            borderBottom: idx < categories.length - 1 ? '1px solid var(--zima-border-divider)' : 'none',
            background: dragOverCategoryId === cat.id && dragCategoryId !== cat.id
              ? 'var(--zima-blue-subtle)'
              : dragCategoryId === cat.id ? 'var(--zima-bg-surface-3)' : 'none',
            transition: 'background 100ms',
            opacity: dragCategoryId === cat.id ? '0.5' : '1',
          }"
          @dragstart="onCatDragStart($event, cat.id)"
          @dragover="onCatDragOver($event, cat.id)"
          @drop="onCatDrop($event, cat.id)"
          @dragend="dragCategoryId = null; dragOverCategoryId = null"
        >
          <!-- Drag handle -->
          <Icon
            name="i-lucide-grip-vertical"
            style="width: 14px; height: 14px; cursor: grab; flex-shrink: 0; color: var(--zima-text-muted);"
          />

          <!-- Color dot + Name -->
          <div
            class="flex items-center justify-center rounded-lg shrink-0"
            :style="{ width: '28px', height: '28px', background: cat.color + '1A' }"
          >
            <div class="rounded-full" :style="{ width: '10px', height: '10px', background: cat.color }" />
          </div>

          <span class="flex-1 text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
            {{ cat.name }}
          </span>

          <!-- Count badge -->
          <span
            class="rounded-full px-2 py-0.5"
            style="font-size: 12px; color: var(--zima-text-muted); background: var(--zima-bg-surface-3);"
          >
            {{ cat.servicesCount }} {{ cat.servicesCount === 1 ? 'serviço' : 'serviços' }}
          </span>

          <!-- Actions menu -->
          <div class="relative" @click.stop>
            <button
              class="flex items-center justify-center rounded-md"
              :style="{
                width: '28px', height: '28px',
                color: 'var(--zima-text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
              }"
              @click="openDropdownId = openDropdownId === `cat-${cat.id}` ? null : `cat-${cat.id}`"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
            >
              <Icon name="i-lucide-more-horizontal" style="width: 14px; height: 14px;" />
            </button>

            <div
              v-if="openDropdownId === `cat-${cat.id}`"
              class="absolute right-0 rounded-lg py-1 z-50"
              style="
                top: calc(100% + 4px);
                min-width: 140px;
                background: var(--zima-bg-surface-2);
                border: 1px solid var(--zima-border-default);
                box-shadow: var(--zima-shadow-lg);
              "
            >
              <button
                class="flex items-center gap-2 w-full px-3 py-2 text-left"
                style="font-size: 13px; color: var(--zima-text-primary); cursor: pointer; background: none; border: none; transition: background 100ms;"
                @click="openEditCategory(cat)"
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
                @click="handleDeleteCategory(cat)"
                @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
              >
                <Icon name="i-lucide-trash-2" style="width: 13px; height: 13px;" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      </ZimaCard>
    </template>

    <!-- Modais -->
    <ModalNovoServico
      v-model="modalServico"
      :categories="categories"
      :professionals="professionals"
      :editing-service="editingService"
      @save="handleSaveService"
    />

    <ModalNovaCategoria
      v-model="modalCategoria"
      :editing-category="editingCategory"
      @save="handleSaveCategory"
    />
  </div>

  <!-- Close dropdowns on outside click -->
  <div
    v-if="openDropdownId"
    class="fixed inset-0 z-40"
    @click="openDropdownId = null"
  />
  </div>
</template>
