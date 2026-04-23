<script setup lang="ts">
import type { Professional } from '../../composables/useProfessionals'
import type { Service } from '../../composables/useServices'

defineProps<{
  modelValue: boolean
  services: Service[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: Omit<Professional, 'id' | 'appointmentsThisMonth' | 'revenueThisMonth'>]
}>()

const loading = ref(false)

const form = reactive({
  name: '',
  role: '',
  phone: '',
  email: '',
  commissionRate: 30,
  status: 'active' as Professional['status'],
  services: [] as string[],
  joinedAt: new Date().toISOString().slice(0, 10),
})

const errors = reactive({
  name: '',
  role: '',
  email: '',
})

const statusOptions = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
  { label: 'Férias', value: 'vacation' },
]

const validate = () => {
  errors.name = form.name.trim() ? '' : 'Nome é obrigatório'
  errors.role = form.role.trim() ? '' : 'Cargo é obrigatório'
  errors.email = form.email.trim() ? '' : 'E-mail é obrigatório'
  return !errors.name && !errors.role && !errors.email
}

const toggleService = (id: string) => {
  const idx = form.services.indexOf(id)
  if (idx >= 0) form.services.splice(idx, 1)
  else form.services.push(id)
}

const close = () => {
  emit('update:modelValue', false)
  Object.assign(form, {
    name: '', role: '', phone: '', email: '', commissionRate: 30,
    status: 'active', services: [], joinedAt: new Date().toISOString().slice(0, 10),
  })
  Object.assign(errors, { name: '', role: '', email: '' })
}

const save = async () => {
  if (!validate()) return
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  emit('save', { ...form })
  loading.value = false
  close()
}
</script>

<template>
  <ZimaModal
    :model-value="modelValue"
    title="Novo Profissional"
    description="Preencha os dados do profissional para adicioná-lo à equipe."
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-4">
      <!-- Nome + Cargo -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ZimaInput
          v-model="form.name"
          label="Nome completo"
          placeholder="Ex: Ana Costa"
          :error="errors.name"
          @blur="validate"
        />
        <ZimaInput
          v-model="form.role"
          label="Cargo"
          placeholder="Ex: Cabeleireira"
          :error="errors.role"
          @blur="validate"
        />
      </div>

      <!-- E-mail + Telefone -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ZimaInput
          v-model="form.email"
          label="E-mail"
          type="email"
          placeholder="email@salon.com"
          :error="errors.email"
          @blur="validate"
        />
        <ZimaInput
          v-model="form.phone"
          label="Telefone"
          placeholder="(11) 99999-9999"
        />
      </div>

      <!-- Comissão + Status -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ZimaInput
          v-model.number="form.commissionRate"
          label="Comissão (%)"
          type="number"
          placeholder="30"
        />
        <ZimaSelect
          v-model="form.status"
          label="Status"
          :options="statusOptions"
        />
      </div>

      <!-- Serviços -->
      <div class="flex flex-col gap-2">
        <span class="text-xs font-medium" :style="{ color: 'var(--zima-text-secondary)' }">
          Serviços realizados
        </span>
        <div class="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
          <label
            v-for="svc in services"
            :key="svc.id"
            class="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
            :style="{
              background: form.services.includes(svc.id) ? 'var(--zima-blue-subtle)' : 'var(--zima-bg-surface-2)',
            }"
          >
            <input
              type="checkbox"
              :checked="form.services.includes(svc.id)"
              class="rounded accent-blue-500"
              @change="toggleService(svc.id)"
            >
            <span class="flex-1 text-sm" :style="{ color: 'var(--zima-text-primary)' }">
              {{ svc.name }}
            </span>
            <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
              {{ svc.duration }}min
            </span>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
      <ZimaButton :loading="loading" @click="save">Adicionar Profissional</ZimaButton>
    </template>
  </ZimaModal>
</template>
