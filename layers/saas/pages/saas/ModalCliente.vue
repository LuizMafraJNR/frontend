<script setup lang="ts">
import type { Customer } from '../../composables/useCustomers'
import { useCustomers } from '../../composables/useCustomers'

const props = defineProps<{
  modelValue: boolean
  customer?: Customer | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [customer: Customer]
}>()

const toast = useZimaToast()
const { createCustomer, updateCustomer } = useCustomers()

const isEditing = computed(() => !!props.customer)
const title = computed(() => isEditing.value ? 'Editar Cliente' : 'Novo Cliente')

// Form state
const form = reactive({
  name: '',
  phone: '',
  email: '',
  cpf: '',
  birthDate: '',
  gender: null as 'M' | 'F' | 'OTHER' | null,
  origin: null as 'REFERRAL' | 'INSTAGRAM' | 'GOOGLE' | 'WALK_IN' | 'OTHER' | null,
  status: 'ACTIVE' as Customer['status'],
  tagInput: '',
  tags: [] as string[],
  // Address
  zip: '',
  street: '',
  addressNumber: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: null as string | null,
  // Additional
  notes: '',
  loyaltyPoints: 0,
})

const errors = reactive({
  name: '',
  email: '',
  phone: '',
})

// Collapsible sections
const addressOpen = ref(false)
const additionalOpen = ref(false)

const saving = ref(false)

// Populate form when editing
watch(() => props.modelValue, (open) => {
  if (open) {
    if (props.customer) {
      form.name = props.customer.name
      form.phone = props.customer.phone
      form.email = props.customer.email
      form.cpf = props.customer.cpf ?? ''
      form.birthDate = props.customer.birthDate ?? ''
      form.gender = props.customer.gender ?? null
      form.origin = props.customer.origin ?? null
      form.status = props.customer.status
      form.tags = [...(props.customer.tags ?? [])]
      form.zip = props.customer.address?.zip ?? ''
      form.street = props.customer.address?.street ?? ''
      form.addressNumber = props.customer.address?.number ?? ''
      form.complement = props.customer.address?.complement ?? ''
      form.neighborhood = props.customer.address?.neighborhood ?? ''
      form.city = props.customer.address?.city ?? ''
      form.state = props.customer.address?.state ?? null
      form.notes = props.customer.notes ?? ''
      form.loyaltyPoints = props.customer.loyaltyPoints
    } else {
      form.name = ''
      form.phone = ''
      form.email = ''
      form.cpf = ''
      form.birthDate = ''
      form.gender = null
      form.origin = null
      form.status = 'ACTIVE'
      form.tags = []
      form.tagInput = ''
      form.zip = ''
      form.street = ''
      form.addressNumber = ''
      form.complement = ''
      form.neighborhood = ''
      form.city = ''
      form.state = null
      form.notes = ''
      form.loyaltyPoints = 0
      errors.name = ''
      errors.email = ''
      errors.phone = ''
    }
    addressOpen.value = false
    additionalOpen.value = false
  }
})

const BR_STATES = [
  { label: 'Acre', value: 'AC' }, { label: 'Alagoas', value: 'AL' },
  { label: 'Amapá', value: 'AP' }, { label: 'Amazonas', value: 'AM' },
  { label: 'Bahia', value: 'BA' }, { label: 'Ceará', value: 'CE' },
  { label: 'Distrito Federal', value: 'DF' }, { label: 'Espírito Santo', value: 'ES' },
  { label: 'Goiás', value: 'GO' }, { label: 'Maranhão', value: 'MA' },
  { label: 'Mato Grosso', value: 'MT' }, { label: 'Mato Grosso do Sul', value: 'MS' },
  { label: 'Minas Gerais', value: 'MG' }, { label: 'Pará', value: 'PA' },
  { label: 'Paraíba', value: 'PB' }, { label: 'Paraná', value: 'PR' },
  { label: 'Pernambuco', value: 'PE' }, { label: 'Piauí', value: 'PI' },
  { label: 'Rio de Janeiro', value: 'RJ' }, { label: 'Rio Grande do Norte', value: 'RN' },
  { label: 'Rio Grande do Sul', value: 'RS' }, { label: 'Rondônia', value: 'RO' },
  { label: 'Roraima', value: 'RR' }, { label: 'Santa Catarina', value: 'SC' },
  { label: 'São Paulo', value: 'SP' }, { label: 'Sergipe', value: 'SE' },
  { label: 'Tocantins', value: 'TO' },
]

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'M' },
  { label: 'Feminino', value: 'F' },
  { label: 'Outro', value: 'OTHER' },
]

const ORIGIN_OPTIONS = [
  { label: 'Indicação', value: 'REFERRAL' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'Google', value: 'GOOGLE' },
  { label: 'Passante', value: 'WALK_IN' },
  { label: 'Outro', value: 'OTHER' },
]

const STATUS_OPTIONS = [
  { label: 'Ativo', value: 'ACTIVE' },
  { label: 'Inativo', value: 'INACTIVE' },
  { label: 'VIP', value: 'VIP' },
  { label: 'Novo', value: 'NEW' },
]

const validateName = () => {
  errors.name = form.name.trim() ? '' : 'Nome é obrigatório'
}

const validateEmail = () => {
  if (!form.email.trim()) {
    errors.email = 'E-mail é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'E-mail inválido'
  } else {
    errors.email = ''
  }
}

const validatePhone = () => {
  errors.phone = form.phone.replace(/\D/g, '').length >= 10 ? '' : 'Telefone inválido (mínimo 10 dígitos)'
}

const addTag = () => {
  const tag = form.tagInput.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  form.tagInput = ''
}

const removeTag = (tag: string) => {
  form.tags = form.tags.filter(t => t !== tag)
}

const handleSave = async () => {
  validateName()
  validateEmail()
  validatePhone()
  if (errors.name || errors.email || errors.phone) return

  saving.value = true
  try {
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      cpf: form.cpf || undefined,
      birthDate: form.birthDate || undefined,
      gender: form.gender || undefined,
      origin: form.origin || undefined,
      status: form.status,
      tags: form.tags,
      notes: form.notes || undefined,
      loyaltyPoints: form.loyaltyPoints,
      address: (form.street || form.zip || form.city) ? {
        street: form.street || undefined,
        number: form.addressNumber || undefined,
        complement: form.complement || undefined,
        neighborhood: form.neighborhood || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zip: form.zip || undefined,
      } : undefined,
    }

    if (isEditing.value && props.customer) {
      await updateCustomer(props.customer.id, data)
      toast.success('Cliente atualizado com sucesso')
      emit('saved', { ...props.customer, ...data })
    } else {
      const newCustomer = await createCustomer(data)
      toast.add({
        type: 'success',
        title: 'Cliente cadastrado!',
        description: data.name,
        action: () => navigateTo(`/saas/clientes/${newCustomer.id}`),
        actionLabel: 'Ver perfil',
      })
      emit('saved', newCustomer)
    }
    emit('update:modelValue', false)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ZimaModal
    :model-value="modelValue"
    :title="title"
    size="lg"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-6">
      <!-- Dados Pessoais -->
      <div class="flex flex-col gap-4">
        <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--zima-text-muted);">
          Dados Pessoais
        </p>

        <ZimaInput
          v-model="form.name"
          label="Nome completo"
          placeholder="Nome do cliente"
          required
          :error="errors.name"
          @blur="validateName"
        />

        <div class="grid grid-cols-2 gap-4">
          <ZimaInput
            v-model="form.phone"
            label="Telefone"
            placeholder="(11) 99999-9999"
            type="tel"
            :error="errors.phone"
            @blur="validatePhone"
          />
          <ZimaInput
            v-model="form.email"
            label="E-mail"
            placeholder="email@exemplo.com"
            type="email"
            :error="errors.email"
            @blur="validateEmail"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <ZimaInput
            v-model="form.cpf"
            label="CPF"
            placeholder="000.000.000-00"
          />
          <ZimaInput
            v-model="form.birthDate"
            label="Data de Nascimento"
            type="date"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <ZimaSelect
            :model-value="form.gender"
            label="Gênero"
            placeholder="Selecionar..."
            :options="GENDER_OPTIONS"
            clearable
            @update:model-value="form.gender = $event as 'M' | 'F' | 'OTHER' | null"
          />
          <ZimaSelect
            :model-value="form.origin"
            label="Origem"
            placeholder="Como nos encontrou?"
            :options="ORIGIN_OPTIONS"
            clearable
            @update:model-value="form.origin = $event as Customer['origin']"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <ZimaSelect
            :model-value="form.status"
            label="Status"
            :options="STATUS_OPTIONS"
            @update:model-value="form.status = $event as Customer['status']"
          />
          <!-- Tags field -->
          <div class="flex flex-col gap-1">
            <label style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Tags</label>
            <div
              class="flex flex-wrap items-center gap-1.5 min-h-[38px] rounded-lg px-3 py-2"
              style="border: 1px solid var(--zima-border-default); background: var(--zima-bg-input);"
            >
              <ZimaBadge
                v-for="tag in form.tags"
                :key="tag"
                variant="neutral"
                size="sm"
                removable
                @remove="removeTag(tag)"
              >
                {{ tag }}
              </ZimaBadge>
              <input
                v-model="form.tagInput"
                placeholder="Adicionar tag..."
                class="flex-1 min-w-[80px] bg-transparent border-none outline-none"
                style="font-size: 13px; color: var(--zima-text-primary);"
                @keydown.enter.prevent="addTag"
                @keydown.comma.prevent="addTag"
              >
            </div>
            <p style="font-size: 11px; color: var(--zima-text-muted);">Pressione Enter para adicionar</p>
          </div>
        </div>
      </div>

      <!-- Endereço (colapsável) -->
      <div style="border: 1px solid var(--zima-border-default); border-radius: var(--zima-radius-lg);">
        <button
          class="flex items-center justify-between w-full px-4 py-3"
          style="cursor: pointer; background: none; border: none;"
          @click="addressOpen = !addressOpen"
        >
          <div class="flex items-center gap-2">
            <Icon name="i-lucide-map-pin" style="width: 14px; height: 14px; color: var(--zima-text-muted);" />
            <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Endereço</span>
            <span v-if="form.street || form.city" style="font-size: 12px; color: var(--zima-text-muted);">(preenchido)</span>
          </div>
          <Icon
            name="i-lucide-chevron-down"
            :style="{
              width: '14px', height: '14px',
              color: 'var(--zima-text-muted)',
              transform: addressOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }"
          />
        </button>

        <div v-if="addressOpen" class="flex flex-col gap-3 px-4 pb-4">
          <div class="grid grid-cols-4 gap-3">
            <div class="col-span-3">
              <ZimaInput
                v-model="form.zip"
                label="CEP"
                placeholder="00000-000"
              />
            </div>
            <div class="col-span-1 flex items-end">
              <ZimaButton
                variant="ghost"
                size="sm"
                class="w-full"
                @click="toast.info('Busca de CEP em breve')"
              >
                Buscar
              </ZimaButton>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div class="col-span-3">
              <ZimaInput v-model="form.street" label="Rua / Logradouro" placeholder="Nome da rua" />
            </div>
            <div class="col-span-1">
              <ZimaInput v-model="form.addressNumber" label="Número" placeholder="Nº" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <ZimaInput v-model="form.complement" label="Complemento" placeholder="Apto, sala..." />
            <ZimaInput v-model="form.neighborhood" label="Bairro" placeholder="Nome do bairro" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <ZimaInput v-model="form.city" label="Cidade" placeholder="Nome da cidade" />
            <ZimaSelect
              :model-value="form.state"
              label="Estado"
              placeholder="UF"
              :options="BR_STATES"
              clearable
              @update:model-value="form.state = $event as string | null"
            />
          </div>
        </div>
      </div>

      <!-- Informações Adicionais (colapsável) -->
      <div style="border: 1px solid var(--zima-border-default); border-radius: var(--zima-radius-lg);">
        <button
          class="flex items-center justify-between w-full px-4 py-3"
          style="cursor: pointer; background: none; border: none;"
          @click="additionalOpen = !additionalOpen"
        >
          <div class="flex items-center gap-2">
            <Icon name="i-lucide-info" style="width: 14px; height: 14px; color: var(--zima-text-muted);" />
            <span style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Informações Adicionais</span>
          </div>
          <Icon
            name="i-lucide-chevron-down"
            :style="{
              width: '14px', height: '14px',
              color: 'var(--zima-text-muted)',
              transform: additionalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }"
          />
        </button>

        <div v-if="additionalOpen" class="flex flex-col gap-3 px-4 pb-4">
          <div class="flex flex-col gap-1">
            <label style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary);">Observações</label>
            <textarea
              v-model="form.notes"
              placeholder="Observações sobre o cliente..."
              rows="3"
              class="rounded-lg px-3 py-2 resize-none"
              style="
                border: 1px solid var(--zima-border-default);
                background: var(--zima-bg-input);
                color: var(--zima-text-primary);
                font-size: 13px;
                font-family: inherit;
                outline: none;
                transition: border-color 150ms;
              "
            />
          </div>

          <ZimaInput
            v-model.number="form.loyaltyPoints"
            label="Pontos de Fidelidade"
            type="number"
            :readonly="isEditing"
            :hint="isEditing ? 'Pontos são gerenciados automaticamente' : undefined"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <ZimaButton variant="ghost" @click="$emit('update:modelValue', false)">
          Cancelar
        </ZimaButton>
        <ZimaButton variant="primary" :loading="saving" @click="handleSave">
          {{ isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente' }}
        </ZimaButton>
      </div>
    </template>
  </ZimaModal>
</template>
