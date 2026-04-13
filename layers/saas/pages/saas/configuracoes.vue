<script setup lang="ts">
definePageMeta({ layout: 'saas' })

const toast = useZimaToast()

// ── Seção ativa ───────────────────────────────────────────────────────────────
const activeSection = ref('negocio')

const sections = [
  { key: 'negocio',        label: 'Dados do Negócio',         icon: 'i-lucide-building-2' },
  { key: 'horario',        label: 'Horário de Funcionamento',  icon: 'i-lucide-clock' },
  { key: 'permissoes',     label: 'Equipe e Permissões',       icon: 'i-lucide-shield-check' },
  { key: 'notificacoes',   label: 'Notificações',              icon: 'i-lucide-bell' },
  { key: 'integracoes',    label: 'Integrações',               icon: 'i-lucide-plug' },
  { key: 'plano',          label: 'Plano e Faturamento',       icon: 'i-lucide-credit-card' },
]

// ── Dados do Negócio ──────────────────────────────────────────────────────────
const negocio = reactive({
  nome: 'Studio Beleza & Estética',
  cnpj: '12.345.678/0001-90',
  telefone: '(11) 3456-7890',
  whatsapp: '(11) 91234-5678',
  email: 'contato@studiobeleza.com.br',
  site: 'www.studiobeleza.com.br',
  endereco: 'Rua das Flores, 123',
  complemento: 'Sala 4',
  bairro: 'Jardim Primavera',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310-100',
  descricao: 'Studio especializado em beleza, corte, coloração e estética facial.',
  segmento: 'beleza',
  timezone: 'America/Sao_Paulo',
  moeda: 'BRL',
})

// Logo upload
const logoFile = ref<File | null>(null)
const logoPreviewUrl = ref<string>('')
const logoInputRef = ref<HTMLInputElement | null>(null)

const handleLogoSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 2MB.'); return }
  logoFile.value = file
  logoPreviewUrl.value = URL.createObjectURL(file)
}

const segmentoOptions = [
  { label: 'Salão de Beleza', value: 'beleza' },
  { label: 'Barbearia', value: 'barbearia' },
  { label: 'Estética', value: 'estetica' },
  { label: 'Petshop', value: 'petshop' },
  { label: 'Clínica', value: 'clinica' },
  { label: 'Outro', value: 'outro' },
]

const estadoOptions = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
].map(s => ({ label: s, value: s }))

const timezoneOptions = [
  { label: 'America/Sao_Paulo (BRT −3)', value: 'America/Sao_Paulo' },
  { label: 'America/Manaus (AMT −4)', value: 'America/Manaus' },
  { label: 'America/Belem (BRT −3)', value: 'America/Belem' },
  { label: 'America/Fortaleza (BRT −3)', value: 'America/Fortaleza' },
  { label: 'America/Noronha (FNT −2)', value: 'America/Noronha' },
]

const moedaOptions = [
  { label: 'BRL — Real Brasileiro', value: 'BRL' },
  { label: 'USD — Dólar Americano', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
]

const savingNegocio = ref(false)
const saveNegocio = async () => {
  savingNegocio.value = true
  await new Promise(r => setTimeout(r, 600))
  savingNegocio.value = false
  toast.success('Dados do negócio atualizados')
}

// ── Horário de Funcionamento ──────────────────────────────────────────────────
type DayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

interface DaySchedule {
  key: DayKey
  label: string
  active: boolean
  open: string
  close: string
}

const schedule = reactive<DaySchedule[]>([
  { key: 'seg', label: 'Segunda-feira',  active: true,  open: '09:00', close: '19:00' },
  { key: 'ter', label: 'Terça-feira',    active: true,  open: '09:00', close: '19:00' },
  { key: 'qua', label: 'Quarta-feira',   active: true,  open: '09:00', close: '19:00' },
  { key: 'qui', label: 'Quinta-feira',   active: true,  open: '09:00', close: '19:00' },
  { key: 'sex', label: 'Sexta-feira',    active: true,  open: '09:00', close: '20:00' },
  { key: 'sab', label: 'Sábado',         active: true,  open: '08:00', close: '18:00' },
  { key: 'dom', label: 'Domingo',        active: false, open: '09:00', close: '14:00' },
])

const timeOptions = (() => {
  const times: { label: string; value: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, '0')
      const mm = m.toString().padStart(2, '0')
      times.push({ label: `${hh}:${mm}`, value: `${hh}:${mm}` })
    }
  }
  return times
})()

const savingHorario = ref(false)
const saveHorario = async () => {
  savingHorario.value = true
  await new Promise(r => setTimeout(r, 500))
  savingHorario.value = false
  toast.success('Horários atualizados')
}

// ── Equipe e Permissões ───────────────────────────────────────────────────────
interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'professional' | 'receptionist'
  status: 'active' | 'invited' | 'inactive'
}

const teamMembers = ref<TeamMember[]>([
  { id: 'u-1', name: 'Luiz Mendes',    email: 'luiz@studiobeleza.com.br',    role: 'owner',        status: 'active' },
  { id: 'u-2', name: 'Ana Costa',      email: 'ana@studiobeleza.com.br',     role: 'professional', status: 'active' },
  { id: 'u-3', name: 'Carlos Lima',    email: 'carlos@studiobeleza.com.br',  role: 'professional', status: 'active' },
  { id: 'u-4', name: 'Julia Rocha',    email: 'julia@studiobeleza.com.br',   role: 'professional', status: 'active' },
  { id: 'u-5', name: 'Mariana Souza',  email: 'mariana@studiobeleza.com.br', role: 'receptionist', status: 'active' },
  { id: 'u-6', name: 'Roberto Alves',  email: 'roberto@gmail.com',           role: 'manager',      status: 'invited' },
])

const roleOptions = [
  { label: 'Proprietário', value: 'owner' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Gerente', value: 'manager' },
  { label: 'Profissional', value: 'professional' },
  { label: 'Recepcionista', value: 'receptionist' },
]

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  professional: 'Profissional',
  receptionist: 'Recepcionista',
}

const inviteEmail = ref('')
const inviteRole = ref<string | null>('professional')
const inviting = ref(false)

const sendInvite = async () => {
  if (!inviteEmail.value.includes('@')) {
    toast.error('E-mail inválido')
    return
  }
  inviting.value = true
  await new Promise(r => setTimeout(r, 700))
  teamMembers.value.push({
    id: `u-${Date.now()}`,
    name: inviteEmail.value.split('@')[0],
    email: inviteEmail.value,
    role: (inviteRole.value as TeamMember['role']) || 'professional',
    status: 'invited',
  })
  inviteEmail.value = ''
  inviting.value = false
  toast.success('Convite enviado com sucesso')
}

const removeTeamMember = (id: string) => {
  teamMembers.value = teamMembers.value.filter(m => m.id !== id)
  openMemberMenu.value = null
  toast.success('Membro removido')
}

const openMemberMenu = ref<string | null>(null)

const toggleMemberStatus = (member: TeamMember) => {
  member.status = member.status === 'active' ? 'inactive' : 'active'
  openMemberMenu.value = null
  toast.success(member.status === 'active' ? 'Membro reativado' : 'Membro desativado')
}

// Tabela de permissões por role
const PERMISSION_MODULES = ['Agenda', 'Clientes', 'Financeiro', 'Relatórios', 'Configurações']

const ROLE_PERMISSIONS: Record<string, boolean[]> = {
  'Proprietário':  [true, true, true, true, true],
  'Gerente':       [true, true, true, true, false],
  'Profissional':  [true, false, false, false, false],
  'Recepcionista': [true, true, false, false, false],
  'Financeiro':    [false, false, true, true, false],
}

// Uso do plano
const planUsage = [
  { label: 'Clientes',       used: 42,  limit: 100  },
  { label: 'Profissionais',  used: 4,   limit: 5    },
  { label: 'Agendamentos',   used: 287, limit: null },
]

const usageColor = (used: number, limit: number | null) => {
  if (!limit) return 'var(--zima-blue-core)'
  const pct = used / limit
  if (pct >= 0.95) return '#EF4444'
  if (pct >= 0.80) return '#F59E0B'
  return 'var(--zima-blue-core)'
}

// ── Notificações ──────────────────────────────────────────────────────────────
const notificacoes = reactive({
  emailNovosAgendamentos: true,
  emailCancelamentos: true,
  emailLembretes: false,
  whatsappConfirmacoes: true,
  whatsappLembretes: true,
  whatsappFeedback: true,
  smsLembretes: false,
  lembreteHoras: '24',
  resumoDiarioEmail: true,
  resumoDiarioHorario: '20:00',
})

const lembreteOptions = [
  { label: '1 hora antes', value: '1' },
  { label: '2 horas antes', value: '2' },
  { label: '12 horas antes', value: '12' },
  { label: '24 horas antes', value: '24' },
  { label: '48 horas antes', value: '48' },
]

const savingNotif = ref(false)
const saveNotificacoes = async () => {
  savingNotif.value = true
  await new Promise(r => setTimeout(r, 500))
  savingNotif.value = false
  toast.success('Preferências de notificações salvas')
}

// ── Integrações ───────────────────────────────────────────────────────────────
interface Integration {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  category: string
  comingSoon?: boolean
}

const integrations = ref<Integration[]>([
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sincronize agendamentos automaticamente com o Google Calendar.',
    icon: 'i-lucide-calendar-days',
    connected: true,
    category: 'Calendário',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Envie confirmações e lembretes via WhatsApp automaticamente.',
    icon: 'i-lucide-message-circle',
    connected: true,
    category: 'Mensagens',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Botão de agendamento direto no perfil do Instagram.',
    icon: 'i-lucide-instagram',
    connected: false,
    category: 'Redes Sociais',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Aceite pagamentos online e gere links de cobrança.',
    icon: 'i-lucide-credit-card',
    connected: false,
    category: 'Pagamentos',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Processamento de pagamentos internacional.',
    icon: 'i-lucide-landmark',
    connected: false,
    category: 'Pagamentos',
    comingSoon: true,
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Acompanhe o tráfego do seu site de agendamento.',
    icon: 'i-lucide-bar-chart-3',
    connected: false,
    category: 'Analytics',
    comingSoon: true,
  },
])

const togglingIntegration = ref<string | null>(null)

const toggleIntegration = async (integration: Integration) => {
  if (integration.comingSoon) {
    toast.info('Em breve disponível')
    return
  }
  togglingIntegration.value = integration.id
  await new Promise(r => setTimeout(r, 800))
  integration.connected = !integration.connected
  togglingIntegration.value = null
  if (integration.connected) {
    toast.success(`${integration.name} conectado com sucesso`)
  } else {
    toast.success(`${integration.name} desconectado`)
  }
}

// ── Plano e Faturamento ───────────────────────────────────────────────────────
const currentPlan = {
  name: 'Profissional',
  price: 'R$ 149,90',
  period: 'mês',
  renewDate: '05/05/2026',
  features: [
    'Até 5 profissionais',
    'Agendamentos ilimitados',
    'WhatsApp Business integrado',
    'Relatórios avançados',
    'Suporte prioritário',
  ],
}

const invoices = [
  { id: 'inv-1', date: '05/04/2026', amount: 'R$ 149,90', status: 'Pago' },
  { id: 'inv-2', date: '05/03/2026', amount: 'R$ 149,90', status: 'Pago' },
  { id: 'inv-3', date: '05/02/2026', amount: 'R$ 149,90', status: 'Pago' },
  { id: 'inv-4', date: '05/01/2026', amount: 'R$ 149,90', status: 'Pago' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRole = (role: string) => roleLabels[role] ?? role
</script>

<template>
  <!-- TODO: i18n -->
  <div class="flex gap-6" style="min-height: calc(100vh - var(--zima-topbar-height) - 48px);">

    <!-- Sub-nav vertical -->
    <aside
      class="flex-shrink-0 flex flex-col gap-1"
      style="width: 220px; position: sticky; top: 24px; align-self: flex-start;"
    >
      <div
        style="font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: var(--zima-text-muted); text-transform: uppercase; margin-bottom: 8px; padding: 0 8px;"
      >
        Configurações
      </div>
      <button
        v-for="section in sections"
        :key="section.key"
        class="flex items-center gap-3 text-left rounded-lg transition-all"
        :style="{
          padding: '8px 10px',
          fontSize: '14px',
          fontWeight: activeSection === section.key ? '500' : '400',
          color: activeSection === section.key ? 'var(--zima-blue-core)' : 'var(--zima-text-secondary)',
          background: activeSection === section.key ? 'rgba(59,130,246,0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
        }"
        @click="activeSection = section.key"
      >
        <Icon
          :name="section.icon"
          :style="{
            width: '16px',
            height: '16px',
            flexShrink: '0',
            color: activeSection === section.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
          }"
        />
        {{ section.label }}
      </button>
    </aside>

    <!-- Conteúdo -->
    <div class="flex-1 flex flex-col gap-6">

      <!-- ═══════════════════════════════ DADOS DO NEGÓCIO ═══════════════════════════════ -->
      <template v-if="activeSection === 'negocio'">
        <div>
          <h1 style="font-size: 22px; font-weight: 600; color: var(--zima-text-primary); margin: 0 0 4px;">
            Dados do Negócio
          </h1>
          <p style="font-size: 14px; color: var(--zima-text-muted); margin: 0;">
            Informações públicas e de contato do seu estabelecimento.
          </p>
        </div>

        <ZimaCard padding="lg">
          <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">
            Informações Básicas
          </div>

          <!-- Logo upload -->
          <div class="flex items-start gap-5" style="margin-bottom: 20px;">
            <div>
              <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-secondary); margin-bottom: 8px;">Logo</div>
              <button
                type="button"
                style="
                  width: 96px; height: 96px; border-radius: 12px;
                  border: 2px dashed var(--zima-border-default);
                  background: var(--zima-bg-surface-2);
                  display: flex; flex-direction: column; align-items: center; justify-content: center;
                  cursor: pointer; overflow: hidden; padding: 0;
                "
                @click="logoInputRef?.click()"
              >
                <img
                  v-if="logoPreviewUrl"
                  :src="logoPreviewUrl"
                  alt="Logo preview"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
                <template v-else>
                  <Icon name="i-lucide-image-plus" style="width: 22px; height: 22px; color: var(--zima-text-muted);" />
                </template>
              </button>
              <input
                ref="logoInputRef"
                type="file"
                accept="image/jpeg,image/png,image/svg+xml"
                style="display: none;"
                @change="handleLogoSelect"
              />
            </div>
            <div style="padding-top: 24px;">
              <p style="font-size: 13px; color: var(--zima-text-muted); margin: 0 0 6px;">
                Clique para selecionar uma imagem.
              </p>
              <p style="font-size: 12px; color: var(--zima-text-muted); margin: 0;">
                JPG, PNG ou SVG · Máx. 2MB
              </p>
              <ZimaButton
                v-if="logoPreviewUrl"
                variant="ghost"
                size="sm"
                style="margin-top: 8px; color: var(--zima-danger);"
                @click="logoPreviewUrl = ''; logoFile = null"
              >
                Remover logo
              </ZimaButton>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <ZimaInput
                v-model="negocio.nome"
                label="Nome do Estabelecimento"
                placeholder="Ex.: Studio Beleza & Estética"
              />
            </div>
            <ZimaSelect
              v-model="negocio.segmento"
              :options="segmentoOptions"
              label="Segmento"
              placeholder="Selecione..."
            />
            <ZimaInput
              v-model="negocio.cnpj"
              label="CNPJ"
              placeholder="00.000.000/0001-00"
            />
            <ZimaInput
              v-model="negocio.telefone"
              label="Telefone"
              placeholder="(11) 3456-7890"
            />
            <ZimaInput
              v-model="negocio.whatsapp"
              label="WhatsApp"
              placeholder="(11) 91234-5678"
            />
            <ZimaInput
              v-model="negocio.email"
              label="E-mail de Contato"
              type="email"
              placeholder="contato@seusite.com.br"
            />
            <ZimaInput
              v-model="negocio.site"
              label="Site"
              placeholder="www.seusite.com.br"
            />
            <ZimaSelect
              v-model="negocio.timezone"
              :options="timezoneOptions"
              label="Fuso Horário"
              placeholder="Selecione..."
            />
            <ZimaSelect
              v-model="negocio.moeda"
              :options="moedaOptions"
              label="Moeda"
              placeholder="Selecione..."
            />
          </div>

          <div
            style="height: 1px; background: var(--zima-border-divider); margin: 20px 0;"
          />

          <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">
            Endereço
          </div>

          <div class="grid grid-cols-4 gap-4">
            <ZimaInput
              v-model="negocio.cep"
              label="CEP"
              placeholder="00000-000"
              class="col-span-1"
            />
            <ZimaInput
              v-model="negocio.endereco"
              label="Logradouro"
              placeholder="Rua, Avenida..."
              class="col-span-3"
            />
            <ZimaInput
              v-model="negocio.complemento"
              label="Complemento"
              placeholder="Sala, Andar..."
              class="col-span-2"
            />
            <ZimaInput
              v-model="negocio.bairro"
              label="Bairro"
              placeholder="Bairro"
              class="col-span-2"
            />
            <ZimaInput
              v-model="negocio.cidade"
              label="Cidade"
              placeholder="Cidade"
              class="col-span-3"
            />
            <ZimaSelect
              v-model="negocio.estado"
              :options="estadoOptions"
              label="Estado"
              placeholder="UF"
              class="col-span-1"
            />
          </div>

          <div
            style="height: 1px; background: var(--zima-border-divider); margin: 20px 0;"
          />

          <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
            Descrição
          </div>

          <textarea
            v-model="negocio.descricao"
            rows="3"
            placeholder="Descreva brevemente seu estabelecimento para os clientes..."
            style="
              width: 100%;
              padding: 8px 12px;
              background: var(--zima-bg-surface-2);
              border: 1px solid var(--zima-border-default);
              border-radius: var(--zima-radius-md);
              color: var(--zima-text-primary);
              font-size: 14px;
              resize: vertical;
              outline: none;
              font-family: inherit;
              box-sizing: border-box;
            "
          />

          <div class="flex justify-end" style="margin-top: 20px;">
            <ZimaButton :loading="savingNegocio" @click="saveNegocio">
              Salvar Alterações
            </ZimaButton>
          </div>
        </ZimaCard>
      </template>

      <!-- ═══════════════════════════════ HORÁRIO ═══════════════════════════════ -->
      <template v-if="activeSection === 'horario'">
        <div>
          <h1 style="font-size: 22px; font-weight: 600; color: var(--zima-text-primary); margin: 0 0 4px;">
            Horário de Funcionamento
          </h1>
          <p style="font-size: 14px; color: var(--zima-text-muted); margin: 0;">
            Configure os dias e horários em que seu estabelecimento atende.
          </p>
        </div>

        <ZimaCard padding="lg">
          <div class="flex flex-col gap-3">
            <div
              v-for="day in schedule"
              :key="day.key"
              class="flex items-center gap-4"
              style="padding: 10px 0; border-bottom: 1px solid var(--zima-border-divider);"
            >
              <!-- Toggle -->
              <ZimaToggle v-model="day.active" />

              <!-- Nome do dia -->
              <span
                style="width: 140px; font-size: 14px; flex-shrink: 0;"
                :style="{ color: day.active ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)' }"
              >
                {{ day.label }}
              </span>

              <!-- Horários -->
              <template v-if="day.active">
                <ZimaSelect
                  v-model="day.open"
                  :options="timeOptions"
                  placeholder="Abertura"
                  style="width: 120px;"
                />
                <span style="color: var(--zima-text-muted); font-size: 14px;">até</span>
                <ZimaSelect
                  v-model="day.close"
                  :options="timeOptions"
                  placeholder="Fechamento"
                  style="width: 120px;"
                />
              </template>
              <span v-else style="font-size: 14px; color: var(--zima-text-muted); font-style: italic;">
                Fechado
              </span>
            </div>
          </div>

          <div class="flex justify-end" style="margin-top: 20px;">
            <ZimaButton :loading="savingHorario" @click="saveHorario">
              Salvar Horários
            </ZimaButton>
          </div>
        </ZimaCard>
      </template>

      <!-- ═══════════════════════════════ PERMISSÕES ═══════════════════════════════ -->
      <template v-if="activeSection === 'permissoes'">
        <div>
          <h1 style="font-size: 22px; font-weight: 600; color: var(--zima-text-primary); margin: 0 0 4px;">
            Equipe e Permissões
          </h1>
          <p style="font-size: 14px; color: var(--zima-text-muted); margin: 0;">
            Gerencie os membros da equipe e seus níveis de acesso.
          </p>
        </div>

        <!-- Convidar novo membro -->
        <ZimaCard padding="lg">
          <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px;">
            Convidar Membro
          </div>
          <div class="flex gap-3 items-end">
            <div class="flex-1">
              <ZimaInput
                v-model="inviteEmail"
                label="E-mail"
                type="email"
                placeholder="email@exemplo.com"
              />
            </div>
            <div style="width: 180px;">
              <ZimaSelect
                v-model="inviteRole"
                :options="roleOptions.filter(r => r.value !== 'owner')"
                label="Função"
                placeholder="Selecione..."
              />
            </div>
            <ZimaButton :loading="inviting" @click="sendInvite">
              <template #icon-left>
                <Icon name="i-lucide-send" style="width: 14px; height: 14px;" />
              </template>
              Enviar Convite
            </ZimaButton>
          </div>
        </ZimaCard>

        <!-- Lista de membros -->
        <ZimaCard padding="none">
          <!-- overlay para fechar dropdown -->
          <div
            v-if="openMemberMenu"
            style="position: fixed; inset: 0; z-index: 40;"
            @click="openMemberMenu = null"
          />
          <div
            v-for="(member, idx) in teamMembers"
            :key="member.id"
            class="flex items-center gap-4"
            :style="{
              padding: '14px 20px',
              borderBottom: idx < teamMembers.length - 1 ? '1px solid var(--zima-border-divider)' : 'none',
              opacity: member.status === 'inactive' ? '0.55' : '1',
            }"
          >
            <ZimaAvatar :name="member.name" size="sm" />
            <div class="flex-1">
              <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">
                {{ member.name }}
                <ZimaBadge
                  v-if="member.status === 'invited'"
                  variant="warning"
                  style="margin-left: 8px; font-size: 11px; vertical-align: middle;"
                >
                  Convite pendente
                </ZimaBadge>
                <ZimaBadge
                  v-if="member.status === 'inactive'"
                  variant="neutral"
                  style="margin-left: 8px; font-size: 11px; vertical-align: middle;"
                >
                  Inativo
                </ZimaBadge>
              </div>
              <div style="font-size: 13px; color: var(--zima-text-muted);">{{ member.email }}</div>
            </div>
            <ZimaBadge :variant="member.role === 'owner' ? 'blue' : 'neutral'">
              {{ formatRole(member.role) }}
            </ZimaBadge>
            <!-- Menu 3-dot -->
            <div style="position: relative;">
              <button
                v-if="member.role !== 'owner'"
                style="
                  width: 30px; height: 30px; border-radius: 6px; border: none;
                  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
                  color: var(--zima-text-muted);
                "
                @click.stop="openMemberMenu = openMemberMenu === member.id ? null : member.id"
              >
                <Icon name="i-lucide-more-horizontal" style="width: 16px; height: 16px;" />
              </button>
              <span v-else style="width: 30px;" />
              <!-- Dropdown -->
              <div
                v-if="openMemberMenu === member.id"
                style="
                  position: absolute; right: 0; top: 36px; z-index: 50;
                  background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);
                  border-radius: var(--zima-radius-md); padding: 4px; min-width: 160px;
                  box-shadow: var(--zima-shadow-md);
                "
              >
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="toast.info('Editar função em breve'); openMemberMenu = null"
                >
                  <Icon name="i-lucide-pencil" style="width: 13px; height: 13px;" />
                  Editar função
                </button>
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="toggleMemberStatus(member)"
                >
                  <Icon
                    :name="member.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check'"
                    style="width: 13px; height: 13px;"
                  />
                  {{ member.status === 'active' ? 'Desativar' : 'Ativar' }}
                </button>
                <div style="height: 1px; background: var(--zima-border-divider); margin: 4px 0;" />
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-danger); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="removeTeamMember(member.id)"
                >
                  <Icon name="i-lucide-trash-2" style="width: 13px; height: 13px;" />
                  Remover
                </button>
              </div>
            </div>
          </div>
        </ZimaCard>

        <!-- Matriz de Permissões -->
        <ZimaCard padding="none">
          <div style="padding: 14px 20px; border-bottom: 1px solid var(--zima-border-divider);">
            <span style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">
              Matriz de Permissões
            </span>
          </div>
          <div style="padding: 16px 20px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 6px 12px 10px 0; color: var(--zima-text-muted); font-weight: 500; width: 140px;">
                    Função
                  </th>
                  <th
                    v-for="mod in PERMISSION_MODULES"
                    :key="mod"
                    style="text-align: center; padding: 6px 12px 10px; color: var(--zima-text-muted); font-weight: 500; white-space: nowrap;"
                  >
                    {{ mod }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(perms, role) in ROLE_PERMISSIONS"
                  :key="role"
                  style="border-top: 1px solid var(--zima-border-divider);"
                >
                  <td style="padding: 10px 12px 10px 0; color: var(--zima-text-primary); font-weight: 500;">
                    {{ role }}
                  </td>
                  <td
                    v-for="(allowed, i) in perms"
                    :key="i"
                    style="text-align: center; padding: 10px 12px;"
                  >
                    <Icon
                      v-if="allowed"
                      name="i-lucide-check"
                      style="width: 15px; height: 15px; color: var(--zima-success);"
                    />
                    <Icon
                      v-else
                      name="i-lucide-x"
                      style="width: 15px; height: 15px; color: var(--zima-text-muted);"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ZimaCard>
      </template>

      <!-- ═══════════════════════════════ NOTIFICAÇÕES ═══════════════════════════════ -->
      <template v-if="activeSection === 'notificacoes'">
        <div>
          <h1 style="font-size: 22px; font-weight: 600; color: var(--zima-text-primary); margin: 0 0 4px;">
            Notificações
          </h1>
          <p style="font-size: 14px; color: var(--zima-text-muted); margin: 0;">
            Configure como e quando enviar notificações para você e seus clientes.
          </p>
        </div>

        <!-- E-mail -->
        <ZimaCard padding="lg">
          <div class="flex items-center gap-2" style="margin-bottom: 16px;">
            <Icon name="i-lucide-mail" style="width: 16px; height: 16px; color: var(--zima-blue-core);" />
            <span style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">
              E-mail
            </span>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Novos agendamentos</div>
                <div style="font-size: 13px; color: var(--zima-text-muted);">Receba um e-mail a cada novo agendamento confirmado</div>
              </div>
              <ZimaToggle v-model="notificacoes.emailNovosAgendamentos" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Cancelamentos</div>
                <div style="font-size: 13px; color: var(--zima-text-muted);">Alerta quando um cliente cancelar um agendamento</div>
              </div>
              <ZimaToggle v-model="notificacoes.emailCancelamentos" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Lembretes para clientes</div>
                <div style="font-size: 13px; color: var(--zima-text-muted);">Enviar lembretes por e-mail aos clientes antes do atendimento</div>
              </div>
              <ZimaToggle v-model="notificacoes.emailLembretes" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Resumo diário</div>
                <div style="font-size: 13px; color: var(--zima-text-muted);">Receba um resumo dos agendamentos do dia</div>
              </div>
              <ZimaToggle v-model="notificacoes.resumoDiarioEmail" />
            </div>
            <div v-if="notificacoes.resumoDiarioEmail" class="flex items-center gap-3" style="padding-left: 0; padding-top: 4px;">
              <span style="font-size: 14px; color: var(--zima-text-secondary);">Horário do resumo:</span>
              <ZimaSelect
                v-model="notificacoes.resumoDiarioHorario"
                :options="timeOptions"
                style="width: 110px;"
              />
            </div>
          </div>
        </ZimaCard>

        <!-- WhatsApp -->
        <ZimaCard padding="lg">
          <div class="flex items-center gap-2" style="margin-bottom: 16px;">
            <Icon name="i-lucide-message-circle" style="width: 16px; height: 16px; color: #25D366;" />
            <span style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">
              WhatsApp
            </span>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Confirmações de agendamento</div>
                <div style="font-size: 13px; color: var(--zima-text-muted);">Enviar mensagem de confirmação após o agendamento</div>
              </div>
              <ZimaToggle v-model="notificacoes.whatsappConfirmacoes" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Lembretes automáticos</div>
                <div style="font-size: 13px; color: var(--zima-text-muted);">Lembrar o cliente antes do atendimento</div>
              </div>
              <ZimaToggle v-model="notificacoes.whatsappLembretes" />
            </div>
            <div v-if="notificacoes.whatsappLembretes" class="flex items-center gap-3" style="padding-top: 4px;">
              <span style="font-size: 14px; color: var(--zima-text-secondary);">Enviar lembrete:</span>
              <ZimaSelect
                v-model="notificacoes.lembreteHoras"
                :options="lembreteOptions"
                style="width: 180px;"
              />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Solicitação de feedback</div>
                <div style="font-size: 13px; color: var(--zima-text-muted);">Pedir avaliação após o atendimento concluído</div>
              </div>
              <ZimaToggle v-model="notificacoes.whatsappFeedback" />
            </div>
          </div>
        </ZimaCard>

        <div class="flex justify-end">
          <ZimaButton :loading="savingNotif" @click="saveNotificacoes">
            Salvar Preferências
          </ZimaButton>
        </div>
      </template>

      <!-- ═══════════════════════════════ INTEGRAÇÕES ═══════════════════════════════ -->
      <template v-if="activeSection === 'integracoes'">
        <div>
          <h1 style="font-size: 22px; font-weight: 600; color: var(--zima-text-primary); margin: 0 0 4px;">
            Integrações
          </h1>
          <p style="font-size: 14px; color: var(--zima-text-muted); margin: 0;">
            Conecte ferramentas externas para automatizar o seu negócio.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <ZimaCard
            v-for="integration in integrations"
            :key="integration.id"
            padding="lg"
          >
            <div class="flex items-start gap-4">
              <div
                style="
                  width: 42px; height: 42px; border-radius: 10px;
                  display: flex; align-items: center; justify-content: center;
                  flex-shrink: 0;
                "
                :style="{
                  background: integration.connected ? 'rgba(59,130,246,0.12)' : 'var(--zima-bg-surface-3)',
                }"
              >
                <Icon
                  :name="integration.icon"
                  :style="{
                    width: '20px',
                    height: '20px',
                    color: integration.connected ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
                  }"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2" style="margin-bottom: 4px;">
                  <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">
                    {{ integration.name }}
                  </span>
                  <ZimaBadge v-if="integration.comingSoon" variant="info">Em breve</ZimaBadge>
                  <ZimaBadge v-else-if="integration.connected" variant="success">Conectado</ZimaBadge>
                </div>
                <p style="font-size: 13px; color: var(--zima-text-muted); margin: 0 0 12px; line-height: 1.5;">
                  {{ integration.description }}
                </p>
                <ZimaButton
                  :variant="integration.connected ? 'ghost' : 'primary'"
                  size="sm"
                  :loading="togglingIntegration === integration.id"
                  :style="integration.connected ? { color: 'var(--zima-danger)' } : {}"
                  @click="toggleIntegration(integration)"
                >
                  {{ integration.comingSoon ? 'Em breve' : integration.connected ? 'Desconectar' : 'Conectar' }}
                </ZimaButton>
              </div>
            </div>
          </ZimaCard>
        </div>
      </template>

      <!-- ═══════════════════════════════ PLANO ═══════════════════════════════ -->
      <template v-if="activeSection === 'plano'">
        <div>
          <h1 style="font-size: 22px; font-weight: 600; color: var(--zima-text-primary); margin: 0 0 4px;">
            Plano e Faturamento
          </h1>
          <p style="font-size: 14px; color: var(--zima-text-muted); margin: 0;">
            Gerencie sua assinatura e visualize seu histórico de pagamentos.
          </p>
        </div>

        <!-- Plano atual -->
        <ZimaCard padding="lg">
          <div class="flex items-start justify-between" style="margin-bottom: 20px;">
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">
                Plano Atual
              </div>
              <div class="flex items-center gap-3">
                <span style="font-size: 24px; font-weight: 700; color: var(--zima-text-primary);">
                  {{ currentPlan.name }}
                </span>
                <ZimaBadge variant="blue">Ativo</ZimaBadge>
              </div>
              <div style="margin-top: 4px; font-size: 14px; color: var(--zima-text-muted);">
                <span style="font-size: 20px; font-weight: 600; color: var(--zima-blue-core); font-family: 'Geist Mono', monospace;">
                  {{ currentPlan.price }}
                </span>
                /{{ currentPlan.period }} · Renova em {{ currentPlan.renewDate }}
              </div>
            </div>
            <ZimaButton variant="ghost">Mudar Plano</ZimaButton>
          </div>

          <div
            style="height: 1px; background: var(--zima-border-divider); margin-bottom: 16px;"
          />

          <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); margin-bottom: 10px;">
            Recursos incluídos:
          </div>
          <ul class="flex flex-col gap-2" style="list-style: none; margin: 0; padding: 0;">
            <li
              v-for="feature in currentPlan.features"
              :key="feature"
              class="flex items-center gap-2"
            >
              <Icon name="i-lucide-check" style="width: 14px; height: 14px; color: var(--zima-success); flex-shrink: 0;" />
              <span style="font-size: 14px; color: var(--zima-text-primary);">{{ feature }}</span>
            </li>
          </ul>
        </ZimaCard>

        <!-- Barras de uso -->
        <ZimaCard padding="lg">
          <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">
            Uso do Plano
          </div>
          <div class="flex flex-col gap-5">
            <div v-for="item in planUsage" :key="item.label">
              <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                <span style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">{{ item.label }}</span>
                <span style="font-size: 13px; font-family: 'Geist Mono', monospace; color: var(--zima-text-muted);">
                  <template v-if="item.limit">
                    {{ item.used }} / {{ item.limit }}
                  </template>
                  <template v-else>
                    {{ item.used }}
                    <ZimaBadge variant="info" style="margin-left: 6px; font-size: 11px; vertical-align: middle;">Ilimitado</ZimaBadge>
                  </template>
                </span>
              </div>
              <div
                v-if="item.limit"
                style="height: 6px; border-radius: 9999px; background: var(--zima-bg-surface-3); overflow: hidden;"
              >
                <div
                  :style="{
                    height: '100%',
                    borderRadius: '9999px',
                    width: `${Math.min((item.used / item.limit) * 100, 100)}%`,
                    background: usageColor(item.used, item.limit),
                    transition: 'width 0.4s ease',
                  }"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-end" style="margin-top: 16px;">
            <ZimaButton @click="toast.info('Página de planos em breve')">
              <template #icon-left>
                <Icon name="i-lucide-zap" style="width: 14px; height: 14px;" />
              </template>
              Fazer Upgrade
            </ZimaButton>
          </div>
        </ZimaCard>

        <!-- Forma de pagamento -->
        <ZimaCard padding="lg">
          <div class="flex items-center justify-between" style="margin-bottom: 14px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">
              Forma de Pagamento
            </div>
            <ZimaButton variant="ghost" size="sm">
              <template #icon-left>
                <Icon name="i-lucide-pencil" style="width: 13px; height: 13px;" />
              </template>
              Alterar
            </ZimaButton>
          </div>
          <div class="flex items-center gap-3">
            <div
              style="
                padding: 6px 10px;
                background: var(--zima-bg-surface-3);
                border: 1px solid var(--zima-border-default);
                border-radius: var(--zima-radius-md);
              "
            >
              <Icon name="i-lucide-credit-card" style="width: 20px; height: 20px; color: var(--zima-text-muted);" />
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Cartão de Crédito ···· 4242</div>
              <div style="font-size: 13px; color: var(--zima-text-muted);">Expira em 08/2028</div>
            </div>
          </div>
        </ZimaCard>

        <!-- Histórico de faturas -->
        <ZimaCard padding="none">
          <div
            style="padding: 16px 20px; border-bottom: 1px solid var(--zima-border-divider);"
          >
            <span style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">
              Histórico de Faturas
            </span>
          </div>
          <div
            v-for="(inv, idx) in invoices"
            :key="inv.id"
            class="flex items-center justify-between"
            :style="{
              padding: '12px 20px',
              borderBottom: idx < invoices.length - 1 ? '1px solid var(--zima-border-divider)' : 'none',
            }"
          >
            <div>
              <span style="font-size: 14px; color: var(--zima-text-primary);">Plano Profissional</span>
              <span style="font-size: 13px; color: var(--zima-text-muted); margin-left: 8px;">{{ inv.date }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span style="font-size: 14px; font-family: 'Geist Mono', monospace; color: var(--zima-text-primary);">{{ inv.amount }}</span>
              <ZimaBadge variant="success">{{ inv.status }}</ZimaBadge>
              <ZimaButton variant="ghost" size="sm">
                <template #icon-left>
                  <Icon name="i-lucide-download" style="width: 13px; height: 13px;" />
                </template>
                PDF
              </ZimaButton>
            </div>
          </div>
        </ZimaCard>

        <!-- Zona de perigo -->
        <ZimaCard padding="lg" style="border: 1px solid var(--zima-danger-border, rgba(239,68,68,0.3));">
          <div style="font-size: 13px; font-weight: 600; color: var(--zima-danger); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
            Zona de Perigo
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div style="font-size: 14px; font-weight: 500; color: var(--zima-text-primary);">Cancelar Assinatura</div>
              <div style="font-size: 13px; color: var(--zima-text-muted);">Ao cancelar, você perderá acesso ao plano no final do período pago.</div>
            </div>
            <ZimaButton variant="ghost" style="color: var(--zima-danger);" @click="toast.error('Funcionalidade restrita para demonstração')">
              Cancelar Assinatura
            </ZimaButton>
          </div>
        </ZimaCard>
      </template>

    </div>
  </div>
</template>
