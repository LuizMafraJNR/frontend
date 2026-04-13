<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  editingCategory?: { id: string; name: string; color: string; icon?: string } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: { name: string; color: string; icon: string }]
}>()

const loading = ref(false)

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Âmbar' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#14B8A6', label: 'Teal' },
]

const ICON_OPTIONS = [
  { value: 'scissors', label: 'Tesoura', icon: 'i-lucide-scissors' },
  { value: 'sparkles', label: 'Estética', icon: 'i-lucide-sparkles' },
  { value: 'heart', label: 'Cuidado', icon: 'i-lucide-heart' },
  { value: 'star', label: 'Destaque', icon: 'i-lucide-star' },
  { value: 'zap', label: 'Energia', icon: 'i-lucide-zap' },
  { value: 'leaf', label: 'Natural', icon: 'i-lucide-leaf' },
  { value: 'droplets', label: 'Hidratação', icon: 'i-lucide-droplets' },
  { value: 'sun', label: 'Sol', icon: 'i-lucide-sun' },
  { value: 'flower', label: 'Flor', icon: 'i-lucide-flower' },
  { value: 'smile', label: 'Bem-estar', icon: 'i-lucide-smile' },
  { value: 'paw', label: 'Pet', icon: 'i-lucide-paw-print' },
  { value: 'tag', label: 'Genérico', icon: 'i-lucide-tag' },
]

const isEditing = computed(() => !!props.editingCategory)
const title = computed(() => isEditing.value ? 'Editar Categoria' : 'Nova Categoria')

const form = reactive({
  name: '',
  color: '#3B82F6',
  icon: 'scissors',
})

const nameError = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    if (props.editingCategory) {
      form.name = props.editingCategory.name
      form.color = props.editingCategory.color
      form.icon = props.editingCategory.icon ?? 'scissors'
    } else {
      form.name = ''
      form.color = '#3B82F6'
      form.icon = 'scissors'
    }
    nameError.value = ''
  }
})

const validate = () => {
  nameError.value = form.name.trim() ? '' : 'Nome é obrigatório'
  return !nameError.value
}

const close = () => {
  emit('update:modelValue', false)
}

const save = async () => {
  if (!validate()) return
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  emit('save', { name: form.name.trim(), color: form.color, icon: form.icon })
  loading.value = false
  close()
}
</script>

<template>
  <ZimaModal
    :model-value="modelValue"
    :title="title"
    description="Defina um nome, ícone e cor para identificar a categoria."
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-4">
      <ZimaInput
        v-model="form.name"
        label="Nome da Categoria *"
        placeholder="Ex: Cabelo"
        :error="nameError"
        @blur="validate"
      />

      <!-- Seletor de ícone -->
      <div class="flex flex-col gap-2">
        <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Ícone</span>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="opt in ICON_OPTIONS"
            :key="opt.value"
            :title="opt.label"
            class="flex items-center justify-center rounded-lg"
            :style="{
              height: '40px',
              border: form.icon === opt.value
                ? `2px solid var(--zima-blue-core)`
                : '1px solid var(--zima-border-default)',
              background: form.icon === opt.value ? 'var(--zima-blue-subtle)' : 'var(--zima-bg-surface-2)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }"
            @click="form.icon = opt.value"
          >
            <Icon
              :name="opt.icon"
              :style="{
                width: '16px',
                height: '16px',
                color: form.icon === opt.value ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
              }"
            />
          </button>
        </div>
      </div>

      <!-- Seletor de cor -->
      <div class="flex flex-col gap-2">
        <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Cor</span>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-for="opt in COLOR_OPTIONS"
            :key="opt.value"
            :title="opt.label"
            class="rounded-full transition-all"
            :style="{
              width: '28px',
              height: '28px',
              background: opt.value,
              outline: form.color === opt.value ? `2px solid ${opt.value}` : 'none',
              outlineOffset: '2px',
              transform: form.color === opt.value ? 'scale(1.15)' : 'scale(1)',
              border: 'none',
              cursor: 'pointer',
            }"
            @click="form.color = opt.value"
          />
        </div>
        <!-- Preview -->
        <div class="flex items-center gap-2 mt-1">
          <div
            class="flex items-center justify-center rounded-lg"
            :style="{ width: '32px', height: '32px', background: form.color + '1A' }"
          >
            <Icon
              :name="ICON_OPTIONS.find(o => o.value === form.icon)?.icon ?? 'i-lucide-tag'"
              :style="{ width: '14px', height: '14px', color: form.color }"
            />
          </div>
          <span style="font-size: 13px; color: var(--zima-text-primary);">{{ form.name || 'Pré-visualização' }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
      <ZimaButton :loading="loading" @click="save">
        {{ isEditing ? 'Salvar Alterações' : 'Criar Categoria' }}
      </ZimaButton>
    </template>
  </ZimaModal>
</template>
