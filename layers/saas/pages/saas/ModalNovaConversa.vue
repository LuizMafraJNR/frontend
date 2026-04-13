<script setup lang="ts">
import type { ZimaSearchItem } from '../../components/zima/ZimaSearchAutocomplete.vue'
import type { ZimaStep } from '../../components/zima/ZimaStepper.vue'
import type { Conversation } from '../../composables/useInbox'
import { useInbox } from '../../composables/useInbox'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [conv: Conversation]
}>()

const toast = useZimaToast()
const { customers, fetchAll: fetchCustomers } = useCustomers()
const { sendMessage, conversations } = useInbox()

onMounted(() => { if (!customers.value.length) fetchCustomers() })

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS: ZimaStep[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'canal',   label: 'Canal' },
  { key: 'mensagem', label: 'Mensagem' },
]
const STEP_KEYS = STEPS.map(s => s.key)

const currentStep = ref('cliente')

const nextStep = () => {
  const idx = STEP_KEYS.indexOf(currentStep.value)
  if (idx < STEP_KEYS.length - 1) currentStep.value = STEP_KEYS[idx + 1]
}
const prevStep = () => {
  const idx = STEP_KEYS.indexOf(currentStep.value)
  if (idx > 0) currentStep.value = STEP_KEYS[idx - 1]
}

// ── Step 1: Cliente ───────────────────────────────────────────────────────────
const clientSearch = ref('')
const selectedClient = ref<{ id: string; name: string; phone: string } | null>(null)
const phoneManual = ref('')
const useManualPhone = ref(false)

const clientItems = computed<ZimaSearchItem[]>(() =>
  customers.value
    .filter(c => {
      if (!clientSearch.value) return true
      const q = clientSearch.value.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.phone.includes(q)
    })
    .slice(0, 8)
    .map(c => ({ id: c.id, label: c.name, sublabel: c.phone })),
)

const handleClientSelect = (item: ZimaSearchItem) => {
  const cust = customers.value.find(c => c.id === item.id)
  if (cust) {
    selectedClient.value = { id: cust.id, name: cust.name, phone: cust.phone }
    useManualPhone.value = false
  }
}

const canNext1 = computed(() =>
  useManualPhone.value ? phoneManual.value.length >= 10 : !!selectedClient.value,
)

// ── Step 2: Canal ─────────────────────────────────────────────────────────────
const selectedChannel = ref<'whatsapp' | 'instagram' | 'webchat' | null>(null)

const channels = [
  { key: 'whatsapp' as const, label: 'WhatsApp', icon: 'i-lucide-message-circle', color: '#25D366', desc: 'Enviar mensagem via WhatsApp Business' },
  { key: 'instagram' as const, label: 'Instagram', icon: 'i-lucide-instagram', color: '#E1306C', desc: 'Iniciar DM no Instagram' },
  { key: 'webchat' as const, label: 'Web Chat', icon: 'i-lucide-globe', color: '#3B82F6', desc: 'Gerar link de chat para o cliente acessar' },
]

// ── Step 3: Mensagem ──────────────────────────────────────────────────────────
const messageText = ref('')
const selectedTemplate = ref<string | null>(null)

const TEMPLATES = [
  {
    label: 'Boas-vindas',
    text: 'Olá! Aqui é o Studio Beleza & Estética. Tudo bem? Podemos te ajudar com algo? 😊',
  },
  {
    label: 'Confirmar agendamento',
    text: 'Olá! Gostaria de confirmar seu agendamento. Você está disponível no horário combinado?',
  },
  {
    label: 'Oferta especial',
    text: 'Olá! Temos uma oferta especial esta semana. Gostaria de saber mais?',
  },
]

const templateOptions = TEMPLATES.map(t => ({ label: t.label, value: t.label }))

watch(selectedTemplate, (v) => {
  if (!v) return
  const tpl = TEMPLATES.find(t => t.label === v)
  if (tpl) messageText.value = tpl.text
})

const canNext2 = computed(() => !!selectedChannel.value)
const canSend = computed(() => messageText.value.trim().length > 0)

// ── Enviar ────────────────────────────────────────────────────────────────────
const sending = ref(false)

const handleSend = async () => {
  if (!canSend.value) return
  sending.value = true
  await new Promise(r => setTimeout(r, 600))

  // Criar conversa mock
  const clientId = selectedClient.value?.id ?? `manual-${Date.now()}`
  const clientName = selectedClient.value?.name ?? phoneManual.value
  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
    clientId,
    clientName,
    clientPhone: selectedClient.value?.phone ?? phoneManual.value,
    clientEmail: '',
    clientSince: 'agora',
    clientVisits: 0,
    clientTotalSpent: 0,
    clientTags: [],
    channel: selectedChannel.value!,
    status: 'HUMAN',
    unreadCount: 0,
    lastMessage: messageText.value,
    lastMessageType: 'text',
    lastMessageAt: new Date().toISOString(),
    attendantId: 'pro-0',
    attendantName: 'Você',
    messages: [],
  }
  conversations.value.unshift(newConv)
  sendMessage(newConv.id, messageText.value, 'human')

  sending.value = false
  toast.success(`Conversa iniciada com ${clientName}!`)
  emit('created', newConv)
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  currentStep.value = 'cliente'
  clientSearch.value = ''
  selectedClient.value = null
  phoneManual.value = ''
  useManualPhone.value = false
  selectedChannel.value = null
  messageText.value = ''
  selectedTemplate.value = null
}

watch(() => props.modelValue, (v) => { if (!v) resetForm() })
</script>

<template>
  <ZimaModal
    :model-value="modelValue"
    title="Nova Conversa"
    description="Selecione o cliente, canal e escreva a primeira mensagem"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Stepper -->
    <ZimaStepper :steps="STEPS" :model-value="currentStep" style="margin-bottom: 24px;" />

    <!-- Step 1: Cliente -->
    <div v-if="currentStep === 'cliente'" class="flex flex-col gap-4">
      <ZimaSearchAutocomplete
        v-model="clientSearch"
        :items="clientItems"
        label="Buscar cliente"
        placeholder="Nome ou telefone..."
        @select="handleClientSelect"
      />

      <div v-if="selectedClient" class="flex items-center gap-3" style="padding: 10px 14px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-md); border: 1px solid var(--zima-border-default);">
        <ZimaAvatar :name="selectedClient.name" size="sm" />
        <div>
          <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">{{ selectedClient.name }}</div>
          <div style="font-size: 12px; color: var(--zima-text-muted);">{{ selectedClient.phone }}</div>
        </div>
        <button style="margin-left: auto; background: none; border: none; cursor: pointer; color: var(--zima-text-muted);" @click="selectedClient = null; clientSearch = ''">
          <Icon name="i-lucide-x" style="width: 14px; height: 14px;" />
        </button>
      </div>

      <div style="height: 1px; background: var(--zima-border-divider);" />

      <button
        style="background: none; border: none; cursor: pointer; color: var(--zima-blue-core); font-size: 13px; text-align: left; padding: 0;"
        @click="useManualPhone = !useManualPhone; selectedClient = null"
      >
        {{ useManualPhone ? '← Buscar cliente cadastrado' : 'Usar número de telefone manual →' }}
      </button>

      <ZimaInput
        v-if="useManualPhone"
        v-model="phoneManual"
        label="Número de telefone"
        placeholder="(11) 91234-5678"
        type="tel"
      />
    </div>

    <!-- Step 2: Canal -->
    <div v-if="currentStep === 'canal'" class="flex flex-col gap-3">
      <div style="font-size: 13px; color: var(--zima-text-secondary); margin-bottom: 4px;">
        Cliente: <strong style="color: var(--zima-text-primary);">{{ selectedClient?.name ?? phoneManual }}</strong>
      </div>
      <div
        v-for="ch in channels"
        :key="ch.key"
        style="padding: 14px 16px; border-radius: var(--zima-radius-md); cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 150ms;"
        :style="{
          background: selectedChannel === ch.key ? 'rgba(59,130,246,0.06)' : 'var(--zima-bg-surface-2)',
          border: selectedChannel === ch.key ? '1.5px solid var(--zima-blue-core)' : '1px solid var(--zima-border-default)',
        }"
        @click="selectedChannel = ch.key"
      >
        <div style="width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" :style="{ background: `${ch.color}20` }">
          <Icon :name="ch.icon" style="width: 18px; height: 18px;" :style="{ color: ch.color }" />
        </div>
        <div class="flex-1">
          <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">{{ ch.label }}</div>
          <div style="font-size: 12px; color: var(--zima-text-muted);">{{ ch.desc }}</div>
        </div>
        <Icon v-if="selectedChannel === ch.key" name="i-lucide-check-circle-2" style="width: 18px; height: 18px; color: var(--zima-blue-core);" />
      </div>
    </div>

    <!-- Step 3: Mensagem -->
    <div v-if="currentStep === 'mensagem'" class="flex flex-col gap-4">
      <div class="flex items-center gap-3" style="padding: 10px 14px; background: var(--zima-bg-surface-2); border-radius: var(--zima-radius-md);">
        <ZimaAvatar :name="selectedClient?.name ?? phoneManual" size="sm" />
        <div>
          <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">{{ selectedClient?.name ?? phoneManual }}</div>
          <div style="font-size: 12px; color: var(--zima-text-muted);">via {{ channels.find(c => c.key === selectedChannel)?.label }}</div>
        </div>
      </div>

      <ZimaSelect
        v-model="selectedTemplate"
        :options="[{ label: 'Selecionar template...', value: '' }, ...templateOptions]"
        label="Usar template (opcional)"
        placeholder="Nenhum template"
      />

      <div>
        <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary); margin-bottom: 6px;">Mensagem</div>
        <textarea
          v-model="messageText"
          rows="4"
          placeholder="Digite a primeira mensagem..."
          style="
            width: 100%; padding: 10px 12px;
            background: var(--zima-bg-surface-2);
            border: 1px solid var(--zima-border-default);
            border-radius: var(--zima-radius-md);
            color: var(--zima-text-primary);
            font-size: 14px; resize: vertical; outline: none;
            font-family: inherit; box-sizing: border-box;
          "
        />
      </div>
    </div>

    <!-- Footer -->
    <template #footer="{ close }">
      <div class="flex items-center justify-between w-full">
        <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
        <div class="flex items-center gap-2">
          <ZimaButton v-if="currentStep !== 'cliente'" variant="ghost" @click="prevStep">Voltar</ZimaButton>
          <ZimaButton
            v-if="currentStep === 'cliente'"
            :disabled="!canNext1"
            @click="nextStep"
          >
            Próximo
          </ZimaButton>
          <ZimaButton
            v-else-if="currentStep === 'canal'"
            :disabled="!canNext2"
            @click="nextStep"
          >
            Próximo
          </ZimaButton>
          <ZimaButton
            v-else
            :disabled="!canSend"
            :loading="sending"
            @click="handleSend"
          >
            <template #icon-left>
              <Icon name="i-lucide-send" style="width: 14px; height: 14px;" />
            </template>
            Enviar
          </ZimaButton>
        </div>
      </div>
    </template>
  </ZimaModal>
</template>
