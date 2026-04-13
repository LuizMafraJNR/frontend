<script setup lang="ts">
import type { FiscalDocument, FiscalDocType, FiscalDocStatus, NfseForm, NfeForm, FiscalConfig } from '../../composables/useFiscal'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const route = useRoute()
const router = useRouter()

// ── Composables ───────────────────────────────────────────────────────────────

const {
  documents,
  fiscalConfig,
  loading,
  fetchAll,
  issueNfse,
  issueNfe,
  cancelDocument,
  saveFiscalConfig,
  SERVICE_CODES,
  CFOP_OPTIONS,
  MUNICIPIOS_NFSE,
} = useFiscal()

const { customers, fetchAll: fetchCustomers } = useCustomers()
const { products, fetchAll: fetchProducts } = useInventory()

onMounted(() => Promise.all([fetchAll(), fetchCustomers(), fetchProducts()]))

// ── Tabs ──────────────────────────────────────────────────────────────────────

const tabs = [
  { key: 'todas', label: 'Todas' },
  { key: 'nfse', label: 'NFS-e (Serviço)' },
  { key: 'nfe', label: 'NF-e (Produto)' },
  { key: 'configuracoes', label: 'Configurações Fiscais' },
]
const activeTab = ref<string>((route.query.tab as string) || 'todas')
watch(activeTab, v => router.replace({ query: { tab: v } }))

// ── Formatação ────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ── Filtros da lista ──────────────────────────────────────────────────────────

const searchQuery = ref('')
const typeFilter = ref<string>('all')
const statusFilter = ref<string>('all')
const dateFrom = ref('')
const dateTo = ref('')

const typeOptions = [
  { label: 'Todos os tipos', value: 'all' },
  { label: 'NFS-e (Serviço)', value: 'NFSE' },
  { label: 'NF-e (Produto)', value: 'NFE' },
]

const statusOptions = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Emitidas', value: 'ISSUED' },
  { label: 'Canceladas', value: 'CANCELLED' },
  { label: 'Com erro', value: 'ERROR' },
  { label: 'Pendentes', value: 'PENDING' },
]

const filteredDocs = computed(() => {
  let type: FiscalDocType | 'all' = 'all'
  if (activeTab.value === 'nfse') type = 'NFSE'
  else if (activeTab.value === 'nfe') type = 'NFE'
  else type = (typeFilter.value as FiscalDocType | 'all')

  const q = searchQuery.value.toLowerCase()
  return documents.value.filter(d => {
    if (type !== 'all' && d.type !== type) return false
    if (statusFilter.value !== 'all' && d.status !== statusFilter.value) return false
    if (dateFrom.value && d.issuedAt.slice(0, 10) < dateFrom.value) return false
    if (dateTo.value && d.issuedAt.slice(0, 10) > dateTo.value) return false
    if (q && !d.number.includes(q) && !d.clientName.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false
    return true
  })
})

const tableColumns = [
  { key: 'numero', label: 'Número' },
  { key: 'emissao', label: 'Emissão' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'valor', label: 'Valor', align: 'right' as const },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: '' },
]

const tableRows = computed(() =>
  filteredDocs.value.map(d => ({
    ...d,
    numero: d.number,
    emissao: d.issuedAt,
    tipo: d.type,
    cliente: d.clientName,
    descricao: d.description,
    valor: d.totalValue,
    status: d.status,
  })),
)

// Status configs
const statusConfig: Record<FiscalDocStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' | 'info'; pulse?: boolean }> = {
  ISSUED: { label: 'Emitida', variant: 'success' },
  CANCELLED: { label: 'Cancelada', variant: 'danger' },
  ERROR: { label: 'Com erro', variant: 'warning' },
  PENDING: { label: 'Pendente', variant: 'neutral' },
  PROCESSING: { label: 'Processando...', variant: 'info', pulse: true },
}

// ── Menu Enviar ───────────────────────────────────────────────────────────────

const activeEnviarMenuId = ref<string | null>(null)
const toggleEnviarMenu = (id: string, e: MouseEvent) => {
  e.stopPropagation()
  activeEnviarMenuId.value = activeEnviarMenuId.value === id ? null : id
}
const closeEnviarMenu = () => { activeEnviarMenuId.value = null }
onMounted(() => document.addEventListener('click', closeEnviarMenu))
onUnmounted(() => document.removeEventListener('click', closeEnviarMenu))

// ── Modal: Cancelar Nota ──────────────────────────────────────────────────────

const cancelModalOpen = ref(false)
const cancelTargetId = ref('')
const cancelReasonCode = ref('')
const cancelJustification = ref('')

const cancelReasons = [
  { label: 'Selecione o motivo...', value: '' },
  { label: 'Erro no valor do serviço', value: 'Erro no valor do serviço' },
  { label: 'Serviço não prestado', value: 'Serviço não prestado' },
  { label: 'Dados do tomador incorretos', value: 'Dados do tomador incorretos' },
  { label: 'Duplicidade de emissão', value: 'Duplicidade de emissão' },
  { label: 'Outro', value: 'Outro' },
]

const openCancel = (doc: FiscalDocument) => {
  cancelTargetId.value = doc.id
  cancelReasonCode.value = ''
  cancelJustification.value = ''
  cancelModalOpen.value = true
}

const confirmCancel = () => {
  if (!cancelReasonCode.value || !cancelJustification.value) {
    toast.error('Informe o motivo e a justificativa do cancelamento')
    return
  }
  cancelDocument(cancelTargetId.value, cancelReasonCode.value + ': ' + cancelJustification.value)
  toast.success('Nota cancelada com sucesso')
  cancelModalOpen.value = false
}

// ── MODAL: Emitir NFS-e ───────────────────────────────────────────────────────

const nfseModalOpen = ref(false)
const issuingNfse = ref(false)
const successModal = ref(false)
const successDocNumber = ref('')
const successDocType = ref<'NFS-e' | 'NF-e'>('NFS-e')

interface NfseFormLocal {
  clientId: string
  clientName: string
  clientDocument: string
  clientEmail: string
  clientCity: string
  clientState: string
  clientCep: string
  serviceDescription: string
  serviceCode: string
  serviceLabel: string
  serviceValue: number | null
  issAliquota: number
  deduction: number
  issRetidoFonte: boolean
  observations: string
  impostsExpanded: boolean
}

const defaultNfseForm = (): NfseFormLocal => ({
  clientId: '',
  clientName: '',
  clientDocument: '',
  clientEmail: '',
  clientCity: 'São Paulo',
  clientState: 'SP',
  clientCep: '',
  serviceDescription: '',
  serviceCode: fiscalConfig.value.servicoCodigoPadrao,
  serviceLabel: SERVICE_CODES.find(s => s.value === fiscalConfig.value.servicoCodigoPadrao)?.label.split(' — ')[1] || 'Cabeleireiros',
  serviceValue: null,
  issAliquota: fiscalConfig.value.issAliquotaPadrao,
  deduction: 0,
  issRetidoFonte: false,
  observations: 'Documento emitido por ME optante pelo Simples Nacional. Lei Complementar nº 123/2006.',
  impostsExpanded: true,
})

const nfseForm = ref<NfseFormLocal>(defaultNfseForm())

const issValue = computed(() => {
  if (!nfseForm.value.serviceValue) return 0
  return nfseForm.value.serviceValue * nfseForm.value.issAliquota / 100
})
const calcBase = computed(() => {
  if (!nfseForm.value.serviceValue) return 0
  return nfseForm.value.serviceValue - nfseForm.value.deduction
})
const liquidoNfse = computed(() => {
  if (!nfseForm.value.serviceValue) return 0
  return nfseForm.value.serviceValue - issValue.value
})

const customerOptions = computed(() => [
  { label: 'Selecionar cliente...', value: '' },
  ...customers.value.map(c => ({ label: c.name + ' — ' + (c.cpf || c.phone), value: c.id })),
])

const onCustomerSelect = (customerId: string) => {
  const c = customers.value.find(x => x.id === customerId)
  if (c) {
    nfseForm.value.clientId = c.id
    nfseForm.value.clientName = c.name
    nfseForm.value.clientEmail = c.email || ''
    nfseForm.value.clientDocument = c.cpf || ''
  }
}

const onServiceCodeSelect = (code: string) => {
  const opt = SERVICE_CODES.find(s => s.value === code)
  if (opt) {
    nfseForm.value.serviceCode = code
    nfseForm.value.serviceLabel = opt.label.split(' — ')[1] || ''
  }
}

const openNfse = (prefill?: Partial<NfseFormLocal>) => {
  nfseForm.value = { ...defaultNfseForm(), ...prefill }
  nfseModalOpen.value = true
}

const saveDraftNfse = () => {
  if (!nfseForm.value.clientName || !nfseForm.value.serviceValue) {
    toast.error('Preencha pelo menos o cliente e o valor para salvar o rascunho')
    return
  }
  toast.success('Rascunho salvo! Acesse na tab "Pendentes"')
  nfseModalOpen.value = false
}

const emitirNfse = async () => {
  if (!nfseForm.value.clientName || !nfseForm.value.serviceDescription || !nfseForm.value.serviceValue) {
    toast.error('Preencha todos os campos obrigatórios')
    return
  }
  issuingNfse.value = true
  try {
    const doc = await issueNfse({
      clientId: nfseForm.value.clientId,
      clientName: nfseForm.value.clientName,
      clientDocument: nfseForm.value.clientDocument,
      clientEmail: nfseForm.value.clientEmail,
      clientCity: nfseForm.value.clientCity,
      clientState: nfseForm.value.clientState,
      clientCep: nfseForm.value.clientCep,
      serviceDescription: nfseForm.value.serviceDescription,
      serviceCode: nfseForm.value.serviceCode,
      serviceLabel: nfseForm.value.serviceLabel,
      serviceValue: nfseForm.value.serviceValue,
      issAliquota: nfseForm.value.issAliquota,
      deduction: nfseForm.value.deduction,
      issRetidoFonte: nfseForm.value.issRetidoFonte,
      observations: nfseForm.value.observations,
    } as NfseForm)
    if (doc.status === 'ERROR') {
      toast.error('Erro ao emitir NFS-e: ' + (doc.errorMessage || 'Erro desconhecido'))
    } else {
      nfseModalOpen.value = false
      successDocNumber.value = doc.number
      successDocType.value = 'NFS-e'
      successModal.value = true
    }
  } finally {
    issuingNfse.value = false
  }
}

// ── MODAL: Emitir NF-e ────────────────────────────────────────────────────────

const nfeModalOpen = ref(false)
const issuingNfe = ref(false)

interface NfeItemLocal {
  productId: string
  productName: string
  ncm: string
  cfop: string
  qty: number
  unitValue: number | null
  icmsAliquota: number
}

interface NfeFormLocal {
  clientId: string
  clientName: string
  clientDocument: string
  clientEmail: string
  items: NfeItemLocal[]
  naturezaOperacao: string
  frete: string
  freteValue: number | null
  additionalInfo: string
}

const defaultNfeForm = (): NfeFormLocal => ({
  clientId: '',
  clientName: '',
  clientDocument: '',
  clientEmail: '',
  items: [{ productId: '', productName: '', ncm: '', cfop: fiscalConfig.value.cfopPadrao, qty: 1, unitValue: null, icmsAliquota: 12 }],
  naturezaOperacao: '5102',
  frete: 'sem-frete',
  freteValue: null,
  additionalInfo: '',
})

const nfeForm = ref<NfeFormLocal>(defaultNfeForm())

const nfeProductOptions = computed(() => [
  { label: 'Selecionar produto...', value: '' },
  ...products.value.filter(p => p.active).map(p => ({ label: p.name + ' (Estoque: ' + p.stock + ')', value: p.id })),
])

const freteOptions = [
  { label: 'Sem frete', value: 'sem-frete' },
  { label: 'Por conta do emitente', value: 'emitente' },
  { label: 'Por conta do destinatário', value: 'destinatario' },
]

const naturezaOptions = [
  { label: '5102 — Venda de mercadoria adquirida ou recebida de terceiros', value: '5102' },
  { label: '5101 — Venda de produção do estabelecimento', value: '5101' },
  { label: '6102 — Venda interestadual de mercadoria', value: '6102' },
]

const cfopOptions = CFOP_OPTIONS

const nfeSubtotal = computed(() => nfeForm.value.items.reduce((s, i) => s + (i.qty || 0) * (i.unitValue || 0), 0))
const nfeTotalIcms = computed(() => nfeForm.value.items.reduce((s, i) => s + (i.qty || 0) * (i.unitValue || 0) * i.icmsAliquota / 100, 0))
const nfeTotal = computed(() => nfeSubtotal.value + (nfeForm.value.frete !== 'sem-frete' ? (nfeForm.value.freteValue || 0) : 0))

const onNfeProductSelect = (idx: number, productId: string) => {
  const p = products.value.find(x => x.id === productId)
  if (p) {
    nfeForm.value.items[idx].productId = p.id
    nfeForm.value.items[idx].productName = p.name
    nfeForm.value.items[idx].unitValue = p.salePrice
    nfeForm.value.items[idx].ncm = '33059000'  // NCM padrão (cosméticos)
  }
}

const onNfeCustomerSelect = (customerId: string) => {
  const c = customers.value.find(x => x.id === customerId)
  if (c) {
    nfeForm.value.clientId = c.id
    nfeForm.value.clientName = c.name
    nfeForm.value.clientEmail = c.email || ''
    nfeForm.value.clientDocument = c.cpf || ''
  }
}

const addNfeItem = () => {
  nfeForm.value.items.push({ productId: '', productName: '', ncm: '', cfop: fiscalConfig.value.cfopPadrao, qty: 1, unitValue: null, icmsAliquota: 12 })
}

const removeNfeItem = (idx: number) => {
  if (nfeForm.value.items.length > 1) nfeForm.value.items.splice(idx, 1)
}

const openNfe = () => {
  nfeForm.value = defaultNfeForm()
  nfeModalOpen.value = true
}

const emitirNfe = async () => {
  const validItems = nfeForm.value.items.filter(i => i.productId && i.qty > 0 && i.unitValue)
  if (!nfeForm.value.clientName || validItems.length === 0) {
    toast.error('Preencha o cliente e pelo menos um produto para emitir')
    return
  }
  issuingNfe.value = true
  try {
    const doc = await issueNfe({
      clientId: nfeForm.value.clientId,
      clientName: nfeForm.value.clientName,
      clientDocument: nfeForm.value.clientDocument,
      clientEmail: nfeForm.value.clientEmail,
      items: validItems.map(i => ({
        productId: i.productId,
        productName: i.productName,
        ncm: i.ncm,
        cfop: i.cfop,
        qty: i.qty,
        unitValue: i.unitValue as number,
        icmsAliquota: i.icmsAliquota,
      })),
      naturezaOperacao: nfeForm.value.naturezaOperacao,
      frete: nfeForm.value.frete,
      freteValue: nfeForm.value.freteValue || 0,
      additionalInfo: nfeForm.value.additionalInfo,
    } as NfeForm)
    if (doc.status === 'ERROR') {
      toast.error('Erro ao emitir NF-e: ' + (doc.errorMessage || 'Erro desconhecido'))
    } else {
      nfeModalOpen.value = false
      successDocNumber.value = doc.number
      successDocType.value = 'NF-e'
      successModal.value = true
    }
  } finally {
    issuingNfe.value = false
  }
}

// ── Tab Configurações ─────────────────────────────────────────────────────────

const configForm = ref<FiscalConfig>({ ...fiscalConfig.value })
watch(fiscalConfig, v => { configForm.value = { ...v } }, { immediate: true })

const savingConfig = ref(false)

const saveConfig = async () => {
  savingConfig.value = true
  await new Promise(r => setTimeout(r, 600))
  saveFiscalConfig(configForm.value)
  savingConfig.value = false
  toast.success('Configurações fiscais salvas!')
}

const testingConnection = ref(false)
const testConnection = async () => {
  testingConnection.value = true
  await new Promise(r => setTimeout(r, 1000))
  testingConnection.value = false
  toast.success('Conexão estabelecida com sucesso! Credenciais válidas.')
}

const validatingCert = ref(false)
const validateCert = async () => {
  validatingCert.value = true
  await new Promise(r => setTimeout(r, 800))
  validatingCert.value = false
  toast.success('Certificado válido! CNPJ: ' + configForm.value.cnpj + ' · Validade: 15/09/2027')
}

const maskCnpj = (e: Event) => {
  const input = e.target as HTMLInputElement
  let v = input.value.replace(/\D/g, '').slice(0, 14)
  if (v.length > 12) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5, 8) + '/' + v.slice(8, 12) + '-' + v.slice(12)
  else if (v.length > 8) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5, 8) + '/' + v.slice(8)
  else if (v.length > 5) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5)
  else if (v.length > 2) v = v.slice(0, 2) + '.' + v.slice(2)
  configForm.value.cnpj = v
}

const onMunicipioSelect = (value: string) => {
  const mun = MUNICIPIOS_NFSE.find(m => m.value === value)
  if (mun) configForm.value.nfseWebserviceUrl = mun.url
}

const regimeTribOptions = [
  { label: 'MEI — Microempreendedor Individual', value: 'MEI' },
  { label: 'Simples Nacional', value: 'SN' },
  { label: 'Lucro Presumido', value: 'LP' },
  { label: 'Lucro Real', value: 'LR' },
]

const snAnexoOptions = [
  { label: 'Anexo I — Comércio', value: 'I' },
  { label: 'Anexo II — Indústria', value: 'II' },
  { label: 'Anexo III — Serviços (ISS)', value: 'III' },
  { label: 'Anexo IV — Serviços (ISSQN)', value: 'IV' },
  { label: 'Anexo V — Serviços (Fator R)', value: 'V' },
]

const certStatusConfig = computed(() => {
  switch (configForm.value.certStatus) {
    case 'valid': return { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', color: '#10B981', icon: 'i-lucide-shield-check', text: 'Certificado digital válido até ' + (configForm.value.certExpiry || '—') }
    case 'expiring': return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', color: '#F59E0B', icon: 'i-lucide-shield-alert', text: 'Certificado expira em breve! Renove antes do vencimento.' }
    case 'expired': return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', color: '#EF4444', icon: 'i-lucide-shield-x', text: 'Certificado vencido. Renove para continuar emitindo NF-e.' }
    default: return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', color: '#EF4444', icon: 'i-lucide-shield-off', text: 'Nenhum certificado digital configurado.' }
  }
})

// ── Estilo de card de seção (configs) ────────────────────────────────────────

const sectionCard = {
  background: 'var(--zima-bg-surface-1)',
  border: '1px solid var(--zima-border-default)',
  borderRadius: 'var(--zima-radius-lg)',
  padding: '24px',
  marginBottom: '16px',
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 :style="{ fontSize: '24px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '4px' }">
          Notas Fiscais
        </h1>
        <p :style="{ fontSize: '14px', color: 'var(--zima-text-muted)' }">
          Emissão e gestão de NFS-e e NF-e
        </p>
      </div>
      <div class="flex items-center gap-2">
        <ZimaButton variant="ghost" size="sm" @click="openNfe">
          <Icon name="i-lucide-file-plus" style="width:14px;height:14px;margin-right:6px;" />
          + Emitir NF-e
        </ZimaButton>
        <ZimaButton size="sm" @click="openNfse()">
          <Icon name="i-lucide-file-plus" style="width:14px;height:14px;margin-right:6px;" />
          + Emitir NFS-e
        </ZimaButton>
      </div>
    </div>

    <!-- Sub-tabs -->
    <div style="border-bottom: 1px solid var(--zima-border-divider); display: flex; gap: 4px; margin-bottom: 24px;">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        style="padding: 10px 16px; font-size: 13px; font-weight: 500; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 150ms; white-space: nowrap;"
        :style="{
          color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
          borderBottomColor: activeTab === tab.key ? 'var(--zima-blue-core)' : 'transparent',
          marginBottom: '-1px',
        }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- TABS: Todas | NFS-e | NF-e -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab !== 'configuracoes'">
      <!-- Filtros -->
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <div :style="{ position: 'relative', flex: '1', minWidth: '220px' }">
          <Icon
            name="i-lucide-search"
            :style="{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--zima-text-muted)', pointerEvents: 'none' }"
          />
          <input
            v-model="searchQuery"
            placeholder="Buscar por número, cliente, descrição..."
            :style="{
              width: '100%',
              paddingLeft: '34px',
              paddingRight: '12px',
              height: '36px',
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              borderRadius: 'var(--zima-radius-md)',
              color: 'var(--zima-text-primary)',
              fontSize: '14px',
              outline: 'none',
            }"
          />
        </div>
        <ZimaSelect v-if="activeTab === 'todas'" v-model="typeFilter" :options="typeOptions" style="min-width:150px" />
        <ZimaSelect v-model="statusFilter" :options="statusOptions" style="min-width:150px" />
        <input
          v-model="dateFrom"
          type="date"
          :style="{ height: '36px', padding: '0 10px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '13px' }"
        />
        <span :style="{ color: 'var(--zima-text-muted)', fontSize: '13px' }">até</span>
        <input
          v-model="dateTo"
          type="date"
          :style="{ height: '36px', padding: '0 10px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '13px' }"
        />
        <ZimaButton variant="ghost" size="sm" @click="toast.info('Exportando notas fiscais...')">
          <Icon name="i-lucide-download" style="width:14px;height:14px;margin-right:6px;" />
          Exportar
        </ZimaButton>
        <span :style="{ fontSize: '13px', color: 'var(--zima-text-muted)', marginLeft: 'auto' }">{{ filteredDocs.length }} notas</span>
      </div>

      <!-- Tabela -->
      <ZimaTable
        :columns="tableColumns"
        :rows="tableRows"
        :loading="loading"
        empty-title="Nenhuma nota fiscal encontrada"
        empty-description="Emita sua primeira nota fiscal ou ajuste os filtros"
        empty-icon="i-lucide-file-text"
      >
        <!-- Número -->
        <template #cell-numero="{ row }">
          <span :style="{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', color: 'var(--zima-text-primary)' }">
            {{ (row as FiscalDocument).type === 'NFSE' ? 'NFS-e' : 'NF-e' }} #{{ (row as FiscalDocument).number }}
          </span>
          <div :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', fontFamily: 'monospace' }">
            Série {{ (row as FiscalDocument).serie }}
          </div>
        </template>

        <!-- Emissão -->
        <template #cell-emissao="{ row }">
          <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">
            {{ (row as FiscalDocument).issuedAt }}
          </span>
        </template>

        <!-- Tipo -->
        <template #cell-tipo="{ row }">
          <span :style="{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '600',
            background: (row as FiscalDocument).type === 'NFSE' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
            color: (row as FiscalDocument).type === 'NFSE' ? '#3B82F6' : '#8B5CF6',
          }">
            {{ (row as FiscalDocument).type === 'NFSE' ? 'NFS-e' : 'NF-e' }}
          </span>
        </template>

        <!-- Cliente -->
        <template #cell-cliente="{ row }">
          <div :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ (row as FiscalDocument).clientName }}</div>
          <div :style="{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">{{ (row as FiscalDocument).clientDocument }}</div>
        </template>

        <!-- Descrição -->
        <template #cell-descricao="{ row }">
          <span :style="{ fontSize: '13px', color: 'var(--zima-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }">
            {{ (row as FiscalDocument).description }}
          </span>
        </template>

        <!-- Valor -->
        <template #cell-valor="{ row }">
          <span :style="{ fontSize: '14px', fontFamily: 'monospace', fontWeight: '600', color: 'var(--zima-text-primary)' }">
            {{ fmt((row as FiscalDocument).totalValue) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ row }">
          <div v-if="(row as FiscalDocument).status === 'PROCESSING'" class="flex items-center gap-2">
            <span
              class="animate-pulse"
              :style="{ display: 'inline-flex', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }"
            >
              <Icon name="i-lucide-loader-2" class="animate-spin" style="width:12px;height:12px;margin-right:4px;" />
              Processando...
            </span>
          </div>
          <div v-else>
            <ZimaBadge :variant="statusConfig[(row as FiscalDocument).status].variant">
              {{ statusConfig[(row as FiscalDocument).status].label }}
            </ZimaBadge>
            <div v-if="(row as FiscalDocument).status === 'ERROR'" :style="{ fontSize: '11px', color: '#F59E0B', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
              {{ (row as FiscalDocument).errorMessage }}
            </div>
          </div>
        </template>

        <!-- Ações -->
        <template #cell-acoes="{ row }">
          <div class="flex items-center gap-1" @click.stop>
            <!-- PDF -->
            <button
              :style="{ background: 'transparent', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: 'var(--zima-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }"
              @click="toast.info('Abrindo PDF da nota ' + (row as FiscalDocument).number + '...')"
            >
              <Icon name="i-lucide-file-text" style="width:13px;height:13px;" />
              PDF
            </button>

            <!-- Enviar dropdown -->
            <div :style="{ position: 'relative' }">
              <button
                :style="{ background: 'transparent', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: 'var(--zima-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }"
                @click="toggleEnviarMenu((row as FiscalDocument).id, $event)"
              >
                <Icon name="i-lucide-send" style="width:13px;height:13px;" />
                Enviar
                <Icon name="i-lucide-chevron-down" style="width:11px;height:11px;" />
              </button>
              <div
                v-if="activeEnviarMenuId === (row as FiscalDocument).id"
                :style="{ position: 'absolute', right: '0', top: '32px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', boxShadow: 'var(--zima-shadow-lg)', zIndex: '50', minWidth: '160px', overflow: 'hidden' }"
              >
                <button
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm"
                  :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-text-primary)', textAlign: 'left' }"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-3)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
                  @click="closeEnviarMenu(); toast.success('Email enviado para ' + (row as FiscalDocument).clientEmail)"
                >
                  <Icon name="i-lucide-mail" style="width:14px;height:14px;" />
                  Enviar por Email
                </button>
                <button
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm"
                  :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-text-primary)', textAlign: 'left' }"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-3)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
                  @click="closeEnviarMenu(); toast.success('WhatsApp enviado para ' + (row as FiscalDocument).clientName)"
                >
                  <Icon name="i-lucide-message-circle" style="width:14px;height:14px;" />
                  Enviar por WhatsApp
                </button>
              </div>
            </div>

            <!-- Cancelar -->
            <button
              v-if="(row as FiscalDocument).status === 'ISSUED'"
              :style="{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--zima-radius-md)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }"
              @click="openCancel(row as FiscalDocument)"
            >
              <Icon name="i-lucide-x-circle" style="width:13px;height:13px;" />
              Cancelar
            </button>

            <!-- XML -->
            <button
              v-if="(row as FiscalDocument).xmlKey"
              :style="{ background: 'transparent', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: 'var(--zima-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }"
              @click="toast.info('Baixando XML...')"
            >
              <Icon name="i-lucide-code" style="width:13px;height:13px;" />
              XML
            </button>

            <!-- Reemitir (error/cancelled) -->
            <button
              v-if="(row as FiscalDocument).status === 'ERROR' || (row as FiscalDocument).status === 'CANCELLED'"
              :style="{ background: 'transparent', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: 'var(--zima-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }"
              @click="(row as FiscalDocument).type === 'NFSE' ? openNfse({ clientName: (row as FiscalDocument).clientName, clientDocument: (row as FiscalDocument).clientDocument, clientEmail: (row as FiscalDocument).clientEmail, serviceDescription: (row as FiscalDocument).description }) : openNfe()"
            >
              <Icon name="i-lucide-refresh-cw" style="width:13px;height:13px;" />
              Reemitir
            </button>
          </div>
        </template>
      </ZimaTable>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- TAB: CONFIGURAÇÕES FISCAIS -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'configuracoes'">
      <!-- Seção 1: Dados do Emitente -->
      <div :style="sectionCard">
        <h2 :style="{ fontSize: '15px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '16px' }">
          Dados do Emitente
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">CNPJ *</label>
            <input
              :value="configForm.cnpj"
              maxlength="18"
              placeholder="XX.XXX.XXX/XXXX-XX"
              :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px', fontFamily: 'monospace' }"
              @input="maskCnpj"
            />
          </div>
          <ZimaInput v-model="configForm.razaoSocial" label="Razão Social *" placeholder="Studio Beleza LTDA ME" />
          <ZimaInput v-model="configForm.nomeFantasia" label="Nome Fantasia" placeholder="Studio Beleza" />
          <ZimaInput v-model="configForm.inscricaoMunicipal" label="Inscrição Municipal *" placeholder="12.345.678-9" />
          <ZimaInput v-model="configForm.inscricaoEstadual" label="Inscrição Estadual" placeholder="Apenas para NF-e" />
          <ZimaInput v-model="configForm.municipioIbge" label="Código IBGE do Município" placeholder="3550308" />
          <div class="col-span-2">
            <ZimaInput v-model="configForm.endereco" label="Endereço completo *" placeholder="Rua das Flores, 123 — Jardim América — São Paulo/SP — CEP 01234-567" />
          </div>
        </div>
      </div>

      <!-- Seção 2: Regime Tributário -->
      <div :style="sectionCard">
        <h2 :style="{ fontSize: '15px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '16px' }">
          Regime Tributário
        </h2>
        <ZimaSelect v-model="configForm.regimeTributario" label="Regime tributário" :options="regimeTribOptions" style="max-width:360px;margin-bottom:16px;" />

        <!-- MEI -->
        <div v-if="configForm.regimeTributario === 'MEI'" :style="{ padding: '16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--zima-radius-md)' }">
          <div class="flex items-start gap-3">
            <Icon name="i-lucide-info" style="width:16px;height:16px;color:#3B82F6;flex-shrink:0;margin-top:2px;" />
            <div>
              <p :style="{ fontSize: '14px', fontWeight: '500', color: '#3B82F6', marginBottom: '4px' }">Microempreendedor Individual (MEI)</p>
              <p :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">Como MEI, você paga um DAS mensal fixo que cobre todos os impostos (INSS + ISS ou ICMS). Notas fiscais emitidas pelo MEI não destacam impostos separadamente.</p>
            </div>
          </div>
        </div>

        <!-- Simples Nacional -->
        <div v-else-if="configForm.regimeTributario === 'SN'" class="grid grid-cols-3 gap-4">
          <ZimaSelect v-model="configForm.snAnexo" label="Anexo do Simples" :options="snAnexoOptions" />
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Alíquota Efetiva (%)</label>
            <input v-model.number="configForm.snAliquotaEfetiva" type="number" step="0.01" min="0" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
          </div>
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">RBT12 (Receita Bruta 12 meses)</label>
            <input v-model.number="configForm.snRbt12" type="number" min="0" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
          </div>
        </div>

        <!-- Lucro Presumido -->
        <div v-else-if="configForm.regimeTributario === 'LP'" class="grid grid-cols-2 gap-4">
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">PIS (%)</label>
            <input v-model.number="configForm.lpPisAliquota" type="number" step="0.01" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
          </div>
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">COFINS (%)</label>
            <input v-model.number="configForm.lpCofinsAliquota" type="number" step="0.01" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
          </div>
          <div class="col-span-2" :style="{ padding: '12px', background: 'rgba(148,163,184,0.06)', borderRadius: 'var(--zima-radius-md)' }">
            <p :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">IRPJ e CSLL são calculados trimestralmente sobre o lucro presumido e devem ser recolhidos separadamente. Consulte seu contador para as alíquotas corretas.</p>
          </div>
        </div>

        <!-- Lucro Real -->
        <div v-else-if="configForm.regimeTributario === 'LR'" :style="{ padding: '16px', background: 'rgba(148,163,184,0.06)', borderRadius: 'var(--zima-radius-md)' }">
          <p :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">Para empresas no Lucro Real, os impostos são calculados com base no lucro real apurado. Configure as alíquotas junto ao seu contador. A emissão de notas fiscais segue o mesmo processo.</p>
        </div>
      </div>

      <!-- Seção 3: Certificado Digital -->
      <div :style="sectionCard">
        <h2 :style="{ fontSize: '15px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '16px' }">
          Certificado Digital
        </h2>

        <!-- Status banner -->
        <div
          :style="{
            padding: '12px 16px',
            background: certStatusConfig.bg,
            border: '1px solid ' + certStatusConfig.border,
            borderRadius: 'var(--zima-radius-md)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }"
        >
          <Icon :name="certStatusConfig.icon" :style="{ width: '18px', height: '18px', color: certStatusConfig.color, flexShrink: '0' }" />
          <span :style="{ fontSize: '14px', color: certStatusConfig.color, fontWeight: '500' }">{{ certStatusConfig.text }}</span>
        </div>

        <!-- Upload area -->
        <div
          :style="{
            border: '2px dashed var(--zima-border-default)',
            borderRadius: 'var(--zima-radius-lg)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            cursor: 'pointer',
          }"
          @click="toast.info('Upload de certificado em breve!')"
        >
          <Icon name="i-lucide-upload-cloud" style="width:32px;height:32px;opacity:0.4;" />
          <p :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)' }">Carregar certificado A1</p>
          <p :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">Arraste e solte o arquivo .pfx ou .p12 aqui</p>
          <p :style="{ fontSize: '12px', color: 'var(--zima-text-muted)' }">Formato: .pfx ou .p12</p>
        </div>

        <div class="flex items-end gap-3">
          <div style="flex:1">
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Senha do certificado</label>
            <input
              type="password"
              placeholder="••••••••"
              :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }"
            />
          </div>
          <ZimaButton variant="ghost" :loading="validatingCert" @click="validateCert">
            <Icon name="i-lucide-shield-check" style="width:14px;height:14px;margin-right:6px;" />
            Validar certificado
          </ZimaButton>
        </div>

        <div :style="{ marginTop: '12px', padding: '10px 12px', background: 'rgba(148,163,184,0.06)', borderRadius: 'var(--zima-radius-md)' }">
          <p :style="{ fontSize: '12px', color: 'var(--zima-text-muted)' }">
            <Icon name="i-lucide-info" style="width:12px;height:12px;display:inline;margin-right:4px;" />
            O certificado digital A1 é necessário para emitir NF-e. Para NFS-e, a necessidade depende da prefeitura do seu município.
          </p>
        </div>
      </div>

      <!-- Seção 4: Configurações NFS-e -->
      <div :style="sectionCard">
        <h2 :style="{ fontSize: '15px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '16px' }">
          Configurações NFS-e
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Prefeitura / Município</label>
            <select
              :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }"
              @change="onMunicipioSelect(($event.target as HTMLSelectElement).value)"
            >
              <option value="">Selecionar prefeitura...</option>
              <option v-for="m in MUNICIPIOS_NFSE" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <ZimaInput v-model="configForm.nfseWebserviceUrl" label="URL do Webservice" placeholder="https://nfe.prefeitura.sp.gov.br/..." />
          </div>
          <ZimaInput v-model="configForm.nfseUsuario" label="Usuário do Webservice" placeholder="usuario@empresa" />
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Senha do Webservice</label>
            <input
              v-model="configForm.nfseSenha"
              type="password"
              placeholder="••••••••"
              :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }"
            />
          </div>
          <div class="col-span-2">
            <ZimaButton variant="ghost" size="sm" :loading="testingConnection" @click="testConnection">
              <Icon name="i-lucide-wifi" style="width:14px;height:14px;margin-right:6px;" />
              Testar conexão
            </ZimaButton>
          </div>
          <ZimaInput v-model="configForm.nfseSerie" label="Série da NFS-e" placeholder="1" />
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Próximo número</label>
            <input v-model.number="configForm.nfseProximoNumero" type="number" min="1" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px', fontFamily: 'monospace' }" />
          </div>
        </div>
      </div>

      <!-- Seção 5: Configurações NF-e -->
      <div :style="sectionCard">
        <h2 :style="{ fontSize: '15px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '16px' }">
          Configurações NF-e
        </h2>

        <!-- Ambiente radio -->
        <div class="flex gap-4 mb-4">
          <label
            v-for="opt in [{ label: 'Homologação (testes)', value: 'homologacao' }, { label: 'Produção', value: 'producao' }]"
            :key="opt.value"
            class="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              :value="opt.value"
              v-model="configForm.nfeAmbiente"
              :style="{ accentColor: 'var(--zima-primary)' }"
            />
            <span :style="{ fontSize: '14px', color: 'var(--zima-text-primary)' }">{{ opt.label }}</span>
          </label>
        </div>

        <!-- Aviso homologação -->
        <div
          v-if="configForm.nfeAmbiente === 'homologacao'"
          :style="{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--zima-radius-md)', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }"
        >
          <Icon name="i-lucide-alert-triangle" style="width:16px;height:16px;color:#F59E0B;flex-shrink:0;margin-top:1px;" />
          <p :style="{ fontSize: '13px', color: '#F59E0B' }">Em homologação, as notas emitidas são apenas para testes e não têm validade fiscal. Mude para Produção quando estiver pronto para emitir notas reais.</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <ZimaInput v-model="configForm.nfeSerie" label="Série da NF-e" placeholder="1" />
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Próximo número</label>
            <input v-model.number="configForm.nfeProximoNumero" type="number" min="1" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px', fontFamily: 'monospace' }" />
          </div>
          <ZimaInput v-model="configForm.nfeCsc" label="CSC — Código de Segurança do Contribuinte" placeholder="Obtido no portal SEFAZ" />
          <ZimaInput v-model="configForm.nfeCscId" label="ID do CSC" placeholder="000001" />
        </div>
      </div>

      <!-- Seção 6: Padrões -->
      <div :style="sectionCard">
        <h2 :style="{ fontSize: '15px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '16px' }">
          Configurações Padrão
        </h2>
        <div class="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Alíquota ISS padrão (%)</label>
            <input v-model.number="configForm.issAliquotaPadrao" type="number" step="0.01" min="0" max="100" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
          </div>
          <ZimaSelect v-model="configForm.servicoCodigoPadrao" label="Código de serviço padrão" :options="SERVICE_CODES" />
          <ZimaSelect v-model="configForm.cfopPadrao" label="CFOP padrão para vendas" :options="CFOP_OPTIONS" />
        </div>
        <div class="flex flex-col gap-3">
          <ZimaToggle v-model="configForm.enviarEmailAuto" label="Enviar NF automaticamente por email após emissão" />
          <ZimaToggle v-model="configForm.enviarWhatsappAuto" label="Enviar NF automaticamente por WhatsApp após emissão" />
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end pt-2 pb-6">
        <ZimaButton :loading="savingConfig" @click="saveConfig">
          <Icon name="i-lucide-save" style="width:14px;height:14px;margin-right:6px;" />
          Salvar Configurações
        </ZimaButton>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Cancelar Nota -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="cancelModalOpen" title="Cancelar Nota Fiscal" size="sm" :danger="true">
      <div class="p-1 flex flex-col gap-4">
        <div :style="{ padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--zima-radius-md)' }">
          <p :style="{ fontSize: '13px', color: '#EF4444', lineHeight: '1.5' }">
            Ao cancelar, esta nota será invalidada junto à prefeitura/SEFAZ. Esta ação não pode ser desfeita.
          </p>
        </div>
        <ZimaSelect v-model="cancelReasonCode" label="Motivo do cancelamento *" :options="cancelReasons" />
        <div>
          <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Justificativa *</label>
          <textarea
            v-model="cancelJustification"
            rows="3"
            placeholder="Descreva detalhadamente o motivo do cancelamento..."
            :style="{ width: '100%', padding: '8px 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px', resize: 'vertical' }"
          />
        </div>
      </div>
      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <ZimaButton variant="ghost" @click="close">Voltar</ZimaButton>
          <ZimaButton
            :style="{ background: '#EF4444', color: '#fff', border: 'none' }"
            @click="confirmCancel"
          >
            <Icon name="i-lucide-x-circle" style="width:14px;height:14px;margin-right:6px;" />
            Cancelar Nota
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Emitir NFS-e -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="nfseModalOpen" title="Emitir NFS-e — Nota Fiscal de Serviço" size="xl">
      <div class="p-1">
        <div class="flex gap-6">
          <!-- Coluna esquerda: formulário -->
          <div style="flex:0 0 58%">
            <!-- Seção 1: Tomador -->
            <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Tomador do Serviço</p>
            <div class="flex flex-col gap-3 mb-5">
              <div>
                <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Cliente *</label>
                <select
                  :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }"
                  @change="onCustomerSelect(($event.target as HTMLSelectElement).value)"
                >
                  <option value="">Selecionar cliente...</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <ZimaInput v-model="nfseForm.clientDocument" label="CPF / CNPJ *" placeholder="000.000.000-00" />
                <ZimaInput v-model="nfseForm.clientName" label="Nome / Razão Social *" placeholder="Nome do cliente" />
              </div>
              <ZimaInput v-model="nfseForm.clientEmail" label="E-mail para envio da NF" placeholder="email@cliente.com" />
              <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                  <ZimaInput v-model="nfseForm.clientCity" label="Cidade" placeholder="São Paulo" />
                </div>
                <ZimaInput v-model="nfseForm.clientState" label="UF" placeholder="SP" />
              </div>
            </div>

            <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '0 0 16px' }" />

            <!-- Seção 2: Serviço -->
            <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Descrição do Serviço</p>
            <div class="flex flex-col gap-3 mb-5">
              <div>
                <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Descrição *</label>
                <textarea
                  v-model="nfseForm.serviceDescription"
                  rows="2"
                  placeholder="Ex: Corte Feminino + Escova Progressiva"
                  :style="{ width: '100%', padding: '8px 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px', resize: 'vertical' }"
                />
              </div>
              <div>
                <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Código do serviço (CNAE/LC 116) *</label>
                <select
                  :value="nfseForm.serviceCode"
                  :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }"
                  @change="onServiceCodeSelect(($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="s in SERVICE_CODES" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
              <div>
                <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Valor do serviço (R$) *</label>
                <input
                  v-model.number="nfseForm.serviceValue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px', fontFamily: 'monospace' }"
                />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Alíquota ISS (%)</label>
                  <input v-model.number="nfseForm.issAliquota" type="number" step="0.01" min="0" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
                </div>
                <div>
                  <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Valor ISS</label>
                  <div :style="{ height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', display: 'flex', alignItems: 'center', fontSize: '14px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">
                    {{ fmt(issValue) }}
                  </div>
                </div>
                <div>
                  <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Dedução (R$)</label>
                  <input v-model.number="nfseForm.deduction" type="number" step="0.01" min="0" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
                </div>
              </div>
              <div class="flex items-center justify-between" :style="{ padding: '8px 12px', background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-md)', fontSize: '13px' }">
                <span :style="{ color: 'var(--zima-text-muted)' }">Base de cálculo</span>
                <span :style="{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--zima-text-primary)' }">{{ fmt(calcBase) }}</span>
              </div>
            </div>

            <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '0 0 16px' }" />

            <!-- Seção 3: Impostos -->
            <button
              class="flex items-center gap-2 w-full mb-3"
              :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-text-primary)', textAlign: 'left', padding: '0' }"
              @click="nfseForm.impostsExpanded = !nfseForm.impostsExpanded"
            >
              <Icon :name="nfseForm.impostsExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" style="width:15px;height:15px;" />
              <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }">Impostos e Regime</p>
            </button>
            <div v-if="nfseForm.impostsExpanded" class="mb-5">
              <div v-if="fiscalConfig.regimeTributario === 'SN' || fiscalConfig.regimeTributario === 'MEI'" class="flex flex-col gap-3">
                <div :style="{ padding: '10px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--zima-radius-md)', fontSize: '13px', color: 'var(--zima-text-muted)' }">
                  Regime: <strong style="color:var(--zima-text-primary)">{{ fiscalConfig.regimeTributario === 'MEI' ? 'MEI' : 'Simples Nacional' }}</strong>
                  — Os impostos estão incluídos no DAS mensal.
                </div>
                <ZimaToggle v-model="nfseForm.issRetidoFonte" label="ISS retido na fonte pelo tomador" />
              </div>
              <div v-else-if="fiscalConfig.regimeTributario === 'LP'" class="grid grid-cols-2 gap-3">
                <div class="flex items-center justify-between" :style="{ padding: '8px 12px', background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-md)' }">
                  <span :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">PIS ({{ fiscalConfig.lpPisAliquota }}%)</span>
                  <span :style="{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ fmt((nfseForm.serviceValue || 0) * fiscalConfig.lpPisAliquota / 100) }}</span>
                </div>
                <div class="flex items-center justify-between" :style="{ padding: '8px 12px', background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-md)' }">
                  <span :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">COFINS ({{ fiscalConfig.lpCofinsAliquota }}%)</span>
                  <span :style="{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ fmt((nfseForm.serviceValue || 0) * fiscalConfig.lpCofinsAliquota / 100) }}</span>
                </div>
              </div>
              <!-- Preview líquido -->
              <div
                v-if="nfseForm.serviceValue"
                :style="{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--zima-radius-md)', fontSize: '13px' }"
              >
                <span :style="{ color: 'var(--zima-text-muted)' }">{{ fmt(nfseForm.serviceValue) }}</span>
                <span :style="{ color: 'var(--zima-text-muted)', margin: '0 6px' }">→ ISS: {{ fmt(issValue) }}</span>
                <span :style="{ color: 'var(--zima-text-muted)', margin: '0 6px' }">→ Líquido:</span>
                <strong :style="{ color: '#10B981', fontFamily: 'monospace' }">{{ fmt(liquidoNfse) }}</strong>
              </div>
            </div>

            <!-- Seção 4: Observações -->
            <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Observações</p>
            <textarea
              v-model="nfseForm.observations"
              rows="2"
              :style="{ width: '100%', padding: '8px 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-muted)', fontSize: '13px', resize: 'vertical' }"
            />
          </div>

          <!-- Coluna direita: Preview da nota -->
          <div style="flex:0 0 38%">
            <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Preview da Nota</p>
            <div
              :style="{
                background: '#fff',
                color: '#1a1a2e',
                borderRadius: 'var(--zima-radius-lg)',
                padding: '20px',
                fontSize: '11px',
                lineHeight: '1.5',
                border: '1px solid rgba(148,163,184,0.2)',
              }"
            >
              <!-- Header da nota -->
              <div :style="{ borderBottom: '2px solid #1a1a2e', paddingBottom: '10px', marginBottom: '10px', textAlign: 'center' }">
                <p :style="{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', color: '#1a1a2e' }">NOTA FISCAL DE SERVIÇOS ELETRÔNICA</p>
                <p :style="{ fontSize: '9px', color: '#555' }">NFS-e</p>
                <p :style="{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', fontFamily: 'monospace' }">
                  Nº {{ fiscalConfig.nfseProximoNumero }}
                </p>
              </div>
              <!-- Emitente -->
              <div :style="{ marginBottom: '8px' }">
                <p :style="{ fontSize: '10px', fontWeight: '700', marginBottom: '2px', color: '#333' }">PRESTADOR DE SERVIÇOS</p>
                <p :style="{ fontWeight: '600' }">{{ fiscalConfig.razaoSocial }}</p>
                <p :style="{ color: '#555' }">CNPJ: {{ fiscalConfig.cnpj }}</p>
                <p :style="{ color: '#555', fontSize: '10px' }">{{ fiscalConfig.endereco }}</p>
              </div>
              <!-- Tomador -->
              <div :style="{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid #ddd' }">
                <p :style="{ fontSize: '10px', fontWeight: '700', marginBottom: '2px', color: '#333' }">TOMADOR DE SERVIÇOS</p>
                <p :style="{ fontWeight: '600' }">{{ nfseForm.clientName || '—' }}</p>
                <p :style="{ color: '#555' }">CPF/CNPJ: {{ nfseForm.clientDocument || '—' }}</p>
                <p v-if="nfseForm.clientCity" :style="{ color: '#555' }">{{ nfseForm.clientCity }}{{ nfseForm.clientState ? '/' + nfseForm.clientState : '' }}</p>
              </div>
              <!-- Serviço -->
              <div :style="{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid #ddd' }">
                <p :style="{ fontSize: '10px', fontWeight: '700', marginBottom: '4px', color: '#333' }">DESCRIÇÃO DO SERVIÇO</p>
                <p :style="{ color: '#333', marginBottom: '4px' }">{{ nfseForm.serviceDescription || '—' }}</p>
                <p :style="{ color: '#555', fontSize: '10px' }">Cód. LC 116: {{ nfseForm.serviceCode }}</p>
              </div>
              <!-- Valores -->
              <div :style="{ paddingTop: '8px', borderTop: '1px solid #ddd' }">
                <div class="flex justify-between mb-1">
                  <span :style="{ color: '#555' }">Valor do serviço</span>
                  <span :style="{ fontFamily: 'monospace' }">{{ fmt(nfseForm.serviceValue || 0) }}</span>
                </div>
                <div v-if="nfseForm.deduction > 0" class="flex justify-between mb-1">
                  <span :style="{ color: '#555' }">Deduções</span>
                  <span :style="{ fontFamily: 'monospace' }">- {{ fmt(nfseForm.deduction) }}</span>
                </div>
                <div class="flex justify-between mb-1">
                  <span :style="{ color: '#555' }">ISS ({{ nfseForm.issAliquota }}%)</span>
                  <span :style="{ fontFamily: 'monospace' }">{{ fmt(issValue) }}</span>
                </div>
                <div class="flex justify-between" :style="{ paddingTop: '6px', borderTop: '1px solid #ddd', fontWeight: '700', fontSize: '13px' }">
                  <span>VALOR LÍQUIDO</span>
                  <span :style="{ fontFamily: 'monospace' }">{{ fmt(liquidoNfse) }}</span>
                </div>
              </div>
              <!-- Rodapé -->
              <p :style="{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '9px', color: '#777', textAlign: 'center' }">
                {{ nfseForm.observations }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton variant="ghost" @click="saveDraftNfse">Salvar Rascunho</ZimaButton>
          <ZimaButton :loading="issuingNfse" @click="emitirNfse">
            {{ issuingNfse ? 'Emitindo nota...' : 'Emitir Nota Fiscal' }}
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Emitir NF-e -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="nfeModalOpen" title="Emitir NF-e — Nota Fiscal Eletrônica de Produto" size="xl">
      <div class="p-1">
        <div class="flex gap-6">
          <!-- Coluna esquerda -->
          <div style="flex:1">
            <!-- Tomador -->
            <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Destinatário</p>
            <div class="grid grid-cols-2 gap-3 mb-5">
              <div class="col-span-2">
                <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Cliente *</label>
                <select
                  :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }"
                  @change="onNfeCustomerSelect(($event.target as HTMLSelectElement).value)"
                >
                  <option value="">Selecionar cliente...</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <ZimaInput v-model="nfeForm.clientDocument" label="CPF / CNPJ" placeholder="CPF ou CNPJ" />
              <ZimaInput v-model="nfeForm.clientName" label="Nome / Razão Social" placeholder="Nome" />
              <div class="col-span-2">
                <ZimaInput v-model="nfeForm.clientEmail" label="E-mail" placeholder="email@cliente.com" />
              </div>
            </div>

            <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '0 0 16px' }" />

            <!-- Produtos -->
            <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Produtos</p>
            <div :style="{ border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', overflow: 'hidden', marginBottom: '8px' }">
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr :style="{ background: 'var(--zima-bg-surface-2)' }">
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left' }">Produto</th>
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left', width: '80px' }">NCM</th>
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left', width: '60px' }">CFOP</th>
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '50px' }">Qtd</th>
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '90px' }">Vl. Unit.</th>
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '90px' }">Subtotal</th>
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '55px' }">ICMS%</th>
                    <th :style="{ padding: '7px 10px', fontSize: '11px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '80px' }">ICMS R$</th>
                    <th style="width:28px" />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, idx) in nfeForm.items"
                    :key="idx"
                    :style="{ borderTop: idx === 0 ? 'none' : '1px solid var(--zima-border-default)' }"
                  >
                    <td :style="{ padding: '6px 10px' }">
                      <select
                        :value="item.productId"
                        :style="{ width: '100%', background: 'transparent', border: 'none', color: item.productId ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)', fontSize: '12px', outline: 'none', cursor: 'pointer' }"
                        @change="onNfeProductSelect(idx, ($event.target as HTMLSelectElement).value)"
                      >
                        <option value="" disabled>Selecionar...</option>
                        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                      </select>
                    </td>
                    <td :style="{ padding: '6px 10px' }">
                      <input v-model="item.ncm" placeholder="NCM" :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-muted)', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }" />
                    </td>
                    <td :style="{ padding: '6px 10px' }">
                      <select
                        v-model="item.cfop"
                        :style="{ background: 'transparent', border: 'none', color: 'var(--zima-text-muted)', fontSize: '12px', fontFamily: 'monospace', outline: 'none', cursor: 'pointer' }"
                      >
                        <option v-for="o in cfopOptions" :key="o.value" :value="o.value">{{ o.value }}</option>
                      </select>
                    </td>
                    <td :style="{ padding: '6px 10px' }">
                      <input v-model.number="item.qty" type="number" min="1" :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-primary)', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', outline: 'none' }" />
                    </td>
                    <td :style="{ padding: '6px 10px' }">
                      <input v-model.number="item.unitValue" type="number" step="0.01" min="0" :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-primary)', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', outline: 'none' }" />
                    </td>
                    <td :style="{ padding: '6px 10px', textAlign: 'right', fontSize: '12px', fontFamily: 'monospace', color: 'var(--zima-text-primary)', fontWeight: '500' }">
                      {{ fmt((item.qty || 0) * (item.unitValue || 0)) }}
                    </td>
                    <td :style="{ padding: '6px 10px' }">
                      <input v-model.number="item.icmsAliquota" type="number" step="0.1" min="0" :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-muted)', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', outline: 'none' }" />
                    </td>
                    <td :style="{ padding: '6px 10px', textAlign: 'right', fontSize: '12px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">
                      {{ fmt((item.qty || 0) * (item.unitValue || 0) * item.icmsAliquota / 100) }}
                    </td>
                    <td :style="{ padding: '6px 6px', textAlign: 'center' }">
                      <button :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-text-muted)', padding: '2px' }" @click="removeNfeItem(idx)">
                        <Icon name="i-lucide-x" style="width:13px;height:13px;" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="flex items-center gap-2 mb-4"
              :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-primary)', fontSize: '13px', fontWeight: '500', padding: '0' }"
              @click="addNfeItem"
            >
              <Icon name="i-lucide-plus" style="width:14px;height:14px;" />
              Adicionar item
            </button>

            <!-- Totais NF-e -->
            <div :style="{ border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', overflow: 'hidden', marginBottom: '16px' }">
              <div v-for="row in [{ label: 'Subtotal produtos', value: nfeSubtotal }, { label: 'Total ICMS', value: nfeTotalIcms }, { label: 'Frete', value: nfeForm.frete !== 'sem-frete' ? (nfeForm.freteValue || 0) : 0 }]" :key="row.label" class="flex items-center justify-between" :style="{ padding: '8px 14px', borderBottom: '1px solid var(--zima-border-default)' }">
                <span :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">{{ row.label }}</span>
                <span :style="{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ fmt(row.value) }}</span>
              </div>
              <div class="flex items-center justify-between" :style="{ padding: '10px 14px', background: 'var(--zima-bg-surface-2)' }">
                <span :style="{ fontSize: '14px', fontWeight: '700', color: 'var(--zima-text-primary)' }">VALOR TOTAL DA NOTA</span>
                <span :style="{ fontFamily: 'monospace', fontSize: '16px', fontWeight: '700', color: 'var(--zima-primary)' }">{{ fmt(nfeTotal) }}</span>
              </div>
            </div>

            <!-- Campos adicionais -->
            <div class="grid grid-cols-2 gap-3">
              <ZimaSelect v-model="nfeForm.naturezaOperacao" label="Natureza da operação" :options="naturezaOptions" />
              <ZimaSelect v-model="nfeForm.frete" label="Frete" :options="freteOptions" />
              <div v-if="nfeForm.frete !== 'sem-frete'" class="col-span-2">
                <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Valor do frete (R$)</label>
                <input v-model.number="nfeForm.freteValue" type="number" step="0.01" min="0" :style="{ width: '100%', height: '38px', padding: '0 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px' }" />
              </div>
              <div class="col-span-2">
                <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Informações adicionais</label>
                <textarea v-model="nfeForm.additionalInfo" rows="2" :style="{ width: '100%', padding: '8px 12px', background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', color: 'var(--zima-text-primary)', fontSize: '14px', resize: 'vertical' }" />
              </div>
            </div>
          </div>

          <!-- Coluna direita: mini preview NF-e -->
          <div style="flex:0 0 220px">
            <p :style="{ fontSize: '12px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Resumo</p>
            <div :style="{ background: '#fff', color: '#1a1a2e', borderRadius: 'var(--zima-radius-lg)', padding: '16px', fontSize: '11px', border: '1px solid rgba(148,163,184,0.2)' }">
              <p :style="{ fontWeight: '700', fontSize: '10px', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #ddd' }">NF-e Nº {{ fiscalConfig.nfeProximoNumero }}</p>
              <p :style="{ fontWeight: '600', marginBottom: '6px' }">{{ nfeForm.clientName || '—' }}</p>
              <div v-for="item in nfeForm.items.filter(i => i.productId)" :key="item.productId" class="flex justify-between mb-1">
                <span :style="{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }">{{ item.productName }} ({{ item.qty }}x)</span>
                <span :style="{ fontFamily: 'monospace', flexShrink: '0' }">{{ fmt((item.qty || 0) * (item.unitValue || 0)) }}</span>
              </div>
              <div v-if="nfeForm.items.filter(i => i.productId).length === 0" :style="{ color: '#aaa', fontStyle: 'italic', marginBottom: '8px' }">Nenhum produto</div>
              <div :style="{ borderTop: '1px solid #ddd', paddingTop: '6px', marginTop: '6px' }">
                <div class="flex justify-between">
                  <span :style="{ color: '#555' }">ICMS total</span>
                  <span :style="{ fontFamily: 'monospace' }">{{ fmt(nfeTotalIcms) }}</span>
                </div>
                <div class="flex justify-between font-bold" :style="{ fontSize: '12px', marginTop: '4px' }">
                  <span>TOTAL</span>
                  <span :style="{ fontFamily: 'monospace' }">{{ fmt(nfeTotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton :loading="issuingNfe" @click="emitirNfe">
            {{ issuingNfe ? 'Emitindo nota...' : 'Emitir NF-e' }}
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Sucesso pós-emissão -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="successModal" title="Nota Fiscal Emitida!" size="sm">
      <div class="p-4 flex flex-col items-center text-center gap-4">
        <Icon name="i-lucide-check-circle" style="width:52px;height:52px;color:#10B981;" />
        <div>
          <h3 :style="{ fontSize: '18px', fontWeight: '700', color: 'var(--zima-text-primary)', marginBottom: '6px' }">
            {{ successDocType }} #{{ successDocNumber }} emitida!
          </h3>
          <p :style="{ fontSize: '14px', color: 'var(--zima-text-muted)' }">
            A nota foi enviada para a prefeitura e emitida com sucesso.
          </p>
        </div>
        <div class="flex flex-col gap-2 w-full">
          <ZimaButton variant="ghost" @click="toast.info('Abrindo PDF da nota...')">
            <Icon name="i-lucide-file-text" style="width:15px;height:15px;margin-right:6px;" />
            Ver PDF
          </ZimaButton>
          <ZimaButton variant="ghost" @click="toast.success('Nota enviada para o cliente!')">
            <Icon name="i-lucide-send" style="width:15px;height:15px;margin-right:6px;" />
            Enviar para o cliente
          </ZimaButton>
        </div>
      </div>
      <template #footer="{ close }">
        <div class="flex justify-end">
          <ZimaButton @click="close">Fechar</ZimaButton>
        </div>
      </template>
    </ZimaModal>
  </div>
</template>
