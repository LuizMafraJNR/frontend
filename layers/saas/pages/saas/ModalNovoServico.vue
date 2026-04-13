<script setup lang="ts">
import type { ServiceCategory } from '../../composables/useServices'
import type { Professional } from '../../composables/useProfessionals'

const props = defineProps<{
  modelValue: boolean
  categories: ServiceCategory[]
  professionals: Professional[]
  editingService?: {
    id: string
    name: string
    categoryId: string
    description?: string
    duration: number
    price: number
    priceType: 'fixed' | 'from'
    commissionRate: number
    active: boolean
    onlineBooking: boolean
    requiresAssessment: boolean
    professionalIds: string[]
  } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: {
    name: string
    categoryId: string
    description: string
    duration: number
    price: number
    priceType: 'fixed' | 'from'
    commissionRate: number
    active: boolean
    onlineBooking: boolean
    requiresAssessment: boolean
    professionalIds: string[]
  }]
}>()

const loading = ref(false)

const form = reactive({
  name: '',
  categoryId: '',
  description: '',
  duration: 30,
  price: 0,
  priceDisplay: '',
  priceType: 'fixed' as 'fixed' | 'from',
  commissionRate: 30,
  active: true,
  onlineBooking: true,
  requiresAssessment: false,
  professionalIds: [] as string[],
})

const errors = reactive({
  name: '',
  categoryId: '',
  price: '',
})

// Image upload state
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isDraggingImage = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const isEditing = computed(() => !!props.editingService)
const title = computed(() => isEditing.value ? 'Editar Serviço' : 'Novo Serviço')

const durationOptions = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1h 30min', value: 90 },
  { label: '2 horas', value: 120 },
  { label: '2h 30min', value: 150 },
  { label: '3 horas', value: 180 },
]

const categoryOptions = computed(() =>
  props.categories.map(c => ({ label: c.name, value: c.id })),
)

// Populate form when opening
watch(() => props.modelValue, (open) => {
  if (open) {
    if (props.editingService) {
      form.name = props.editingService.name
      form.categoryId = props.editingService.categoryId
      form.description = props.editingService.description ?? ''
      form.duration = props.editingService.duration
      form.price = props.editingService.price
      form.priceDisplay = props.editingService.price.toFixed(2).replace('.', ',')
      form.priceType = props.editingService.priceType ?? 'fixed'
      form.commissionRate = props.editingService.commissionRate
      form.active = props.editingService.active
      form.onlineBooking = props.editingService.onlineBooking ?? true
      form.requiresAssessment = props.editingService.requiresAssessment ?? false
      form.professionalIds = [...(props.editingService.professionalIds ?? [])]
    } else {
      Object.assign(form, {
        name: '', categoryId: '', description: '',
        duration: 30, price: 0, priceDisplay: '',
        priceType: 'fixed', commissionRate: 30, active: true,
        onlineBooking: true, requiresAssessment: false, professionalIds: [],
      })
    }
    imageFile.value = null
    imagePreview.value = null
    errors.name = ''
    errors.categoryId = ''
    errors.price = ''
  }
})

// Price input handling
const handlePriceInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  const num = parseInt(raw || '0') / 100
  form.price = num
  form.priceDisplay = num > 0 ? num.toFixed(2).replace('.', ',') : ''
}

// Professionals toggle
const toggleProfessional = (id: string) => {
  const idx = form.professionalIds.indexOf(id)
  if (idx >= 0) form.professionalIds.splice(idx, 1)
  else form.professionalIds.push(id)
}

const allSelected = computed(() =>
  props.professionals.length > 0 &&
  props.professionals.every(p => form.professionalIds.includes(p.id)),
)

const toggleAll = () => {
  if (allSelected.value) {
    form.professionalIds = []
  } else {
    form.professionalIds = props.professionals.map(p => p.id)
  }
}

// Image drop
const handleImageDrop = (e: DragEvent) => {
  isDraggingImage.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const handleImageSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const validate = () => {
  errors.name = form.name.trim() ? '' : 'Nome é obrigatório'
  errors.categoryId = form.categoryId ? '' : 'Categoria é obrigatória'
  errors.price = form.price > 0 ? '' : 'Preço deve ser maior que zero'
  return !errors.name && !errors.categoryId && !errors.price
}

const close = () => {
  emit('update:modelValue', false)
}

const save = async () => {
  if (!validate()) return
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  emit('save', {
    name: form.name.trim(),
    categoryId: form.categoryId,
    description: form.description.trim(),
    duration: form.duration,
    price: form.price,
    priceType: form.priceType,
    commissionRate: form.commissionRate,
    active: form.active,
    onlineBooking: form.onlineBooking,
    requiresAssessment: form.requiresAssessment,
    professionalIds: [...form.professionalIds],
  })
  loading.value = false
  close()
}
</script>

<template>
  <ZimaModal
    :model-value="modelValue"
    :title="title"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-5">
      <!-- Nome + Categoria -->
      <div class="grid grid-cols-2 gap-4">
        <ZimaInput
          v-model="form.name"
          label="Nome do Serviço *"
          placeholder="Ex: Corte Feminino"
          :error="errors.name"
          @blur="() => { errors.name = form.name.trim() ? '' : 'Nome é obrigatório' }"
        />
        <ZimaSelect
          :model-value="form.categoryId"
          label="Categoria *"
          placeholder="Selecionar..."
          :options="categoryOptions"
          :error="errors.categoryId"
          @update:model-value="form.categoryId = $event as string; errors.categoryId = ''"
        />
      </div>

      <!-- Descrição -->
      <div class="flex flex-col gap-1">
        <label style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Descrição</label>
        <textarea
          v-model="form.description"
          placeholder="Descreva o serviço para seus clientes..."
          rows="2"
          class="rounded-lg px-3 py-2 resize-none w-full"
          style="border: 1px solid var(--zima-border-default); background: var(--zima-bg-input); color: var(--zima-text-primary); font-size: 13px; font-family: inherit; outline: none;"
        />
      </div>

      <!-- Duração + Preço -->
      <div class="grid grid-cols-2 gap-4">
        <ZimaSelect
          :model-value="form.duration"
          label="Duração"
          :options="durationOptions"
          @update:model-value="form.duration = $event as number"
        />
        <div class="flex flex-col gap-1">
          <label style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Preço (R$) *</label>
          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2"
              style="font-size: 13px; color: var(--zima-text-muted); pointer-events: none;"
            >R$</span>
            <input
              :value="form.priceDisplay"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="w-full rounded-lg pl-9 pr-3 py-2"
              :style="{
                border: errors.price ? '1px solid var(--zima-danger)' : '1px solid var(--zima-border-default)',
                background: 'var(--zima-bg-input)',
                color: 'var(--zima-text-primary)',
                fontFamily: 'var(--zima-font-mono)',
                fontSize: '13px',
                outline: 'none',
              }"
              @input="handlePriceInput"
              @blur="errors.price = form.price > 0 ? '' : 'Preço deve ser maior que zero'"
            >
          </div>
          <p v-if="errors.price" style="font-size: 11px; color: var(--zima-danger);">{{ errors.price }}</p>
        </div>
      </div>

      <!-- Tipo de preço -->
      <div class="flex flex-col gap-1.5">
        <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Tipo de preço</span>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.priceType"
              type="radio"
              value="fixed"
              style="accent-color: var(--zima-blue-core);"
            >
            <span style="font-size: 13px; color: var(--zima-text-primary);">Preço fixo</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.priceType"
              type="radio"
              value="from"
              style="accent-color: var(--zima-blue-core);"
            >
            <span style="font-size: 13px; color: var(--zima-text-primary);">A partir de</span>
          </label>
        </div>
      </div>

      <!-- Comissão -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Comissão override (%)</label>
          <ZimaInput
            v-model.number="form.commissionRate"
            type="number"
            placeholder="Vazio = usar comissão do profissional"
            hint="Deixe 0 para usar a comissão padrão do profissional"
          />
        </div>
      </div>

      <!-- Upload de imagem -->
      <div class="flex flex-col gap-1.5">
        <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Imagem do serviço</span>
        <div v-if="imagePreview" class="relative rounded-lg overflow-hidden" style="height: 120px;">
          <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover">
          <button
            class="absolute top-2 right-2 flex items-center justify-center rounded-full"
            style="width: 24px; height: 24px; background: rgba(0,0,0,0.5); border: none; cursor: pointer; color: white;"
            @click="removeImage"
          >
            <Icon name="i-lucide-x" style="width: 12px; height: 12px;" />
          </button>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer"
          :style="{
            height: '96px',
            border: `2px dashed ${isDraggingImage ? 'var(--zima-blue-core)' : 'var(--zima-border-default)'}`,
            background: isDraggingImage ? 'var(--zima-blue-subtle)' : 'var(--zima-bg-surface-2)',
            transition: 'all 150ms',
          }"
          @dragover.prevent="isDraggingImage = true"
          @dragleave="isDraggingImage = false"
          @drop.prevent="handleImageDrop"
          @click="fileInputRef?.click()"
        >
          <Icon name="i-lucide-image-plus" style="width: 20px; height: 20px; color: var(--zima-text-muted);" />
          <span style="font-size: 12px; color: var(--zima-text-muted);">Arraste uma imagem ou clique para selecionar</span>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageSelect"
          >
        </div>
      </div>

      <!-- Toggles -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between py-2.5 px-3 rounded-lg" style="background: var(--zima-bg-surface-2);">
          <div class="flex flex-col gap-0.5">
            <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">Disponível para agendamento online</span>
            <span style="font-size: 12px; color: var(--zima-text-muted);">Clientes podem agendar diretamente pelo app</span>
          </div>
          <ZimaToggle v-model="form.onlineBooking" />
        </div>
        <div class="flex items-center justify-between py-2.5 px-3 rounded-lg" style="background: var(--zima-bg-surface-2);">
          <div class="flex flex-col gap-0.5">
            <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">Requer avaliação prévia</span>
            <span style="font-size: 12px; color: var(--zima-text-muted);">Um profissional deve avaliar antes de confirmar</span>
          </div>
          <ZimaToggle v-model="form.requiresAssessment" />
        </div>
      </div>

      <!-- Profissionais que realizam -->
      <div class="flex flex-col gap-2">
        <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Profissionais que realizam</span>
        <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--zima-border-default);">
          <!-- Selecionar todos -->
          <label
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
            :style="{
              background: 'var(--zima-bg-surface-2)',
              borderBottom: '1px solid var(--zima-border-divider)',
            }"
          >
            <input
              type="checkbox"
              :checked="allSelected"
              style="accent-color: var(--zima-blue-core); width: 14px; height: 14px;"
              @change="toggleAll"
            >
            <span style="font-size: 12px; font-weight: 600; color: var(--zima-text-muted); text-transform: uppercase; letter-spacing: 0.06em;">
              Selecionar todos
            </span>
          </label>
          <!-- Lista de profissionais -->
          <label
            v-for="pro in professionals"
            :key="pro.id"
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
            :style="{
              borderBottom: pro !== professionals[professionals.length - 1] ? '1px solid var(--zima-border-divider)' : 'none',
              background: form.professionalIds.includes(pro.id) ? 'rgba(59,130,246,0.04)' : 'none',
              transition: 'background 100ms',
            }"
          >
            <input
              type="checkbox"
              :checked="form.professionalIds.includes(pro.id)"
              style="accent-color: var(--zima-blue-core); width: 14px; height: 14px;"
              @change="toggleProfessional(pro.id)"
            >
            <ZimaAvatar :name="pro.name" size="sm" />
            <div class="flex flex-col">
              <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ pro.name }}</span>
              <span style="font-size: 11px; color: var(--zima-text-muted);">{{ pro.role }}</span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
      <ZimaButton :loading="loading" @click="save">
        {{ isEditing ? 'Salvar Alterações' : 'Criar Serviço' }}
      </ZimaButton>
    </template>
  </ZimaModal>
</template>
