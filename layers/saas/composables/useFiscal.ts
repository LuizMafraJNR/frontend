// ── Tipos exportados ──────────────────────────────────────────────────────────

export type FiscalDocType = 'NFSE' | 'NFE'
export type FiscalDocStatus = 'ISSUED' | 'CANCELLED' | 'ERROR' | 'PENDING' | 'PROCESSING'

export interface FiscalServiceItem {
  description: string
  serviceCode: string
  serviceLabel: string
  value: number
  issAliquota: number
  issValue: number
  deduction: number
  calcBase: number
}

export interface FiscalProductItem {
  productId: string
  productName: string
  ncm: string
  cfop: string
  qty: number
  unitValue: number
  subtotal: number
  icmsAliquota: number
  icmsValue: number
}

export interface FiscalDocument {
  id: string
  number: string
  serie: string
  type: FiscalDocType
  status: FiscalDocStatus
  issuedAt: string
  clientId?: string
  clientName: string
  clientDocument: string
  clientEmail?: string
  description: string
  totalValue: number
  issValue?: number
  xmlKey?: string
  cancelledAt?: string
  cancelReason?: string
  errorMessage?: string
  saleId?: string
  transactionId?: string
  items?: FiscalServiceItem[] | FiscalProductItem[]
}

export interface FiscalConfig {
  cnpj: string
  inscricaoMunicipal: string
  inscricaoEstadual: string
  razaoSocial: string
  nomeFantasia: string
  endereco: string
  municipioIbge: string
  regimeTributario: 'MEI' | 'SN' | 'LP' | 'LR'
  snAnexo: string
  snAliquotaEfetiva: number
  snRbt12: number
  lpPisAliquota: number
  lpCofinsAliquota: number
  certStatus: 'valid' | 'expiring' | 'expired' | 'none'
  certExpiry?: string
  certCnpj?: string
  nfseWebserviceUrl: string
  nfseUsuario: string
  nfseSenha: string
  nfseSerie: string
  nfseProximoNumero: number
  nfeAmbiente: 'homologacao' | 'producao'
  nfeSerie: string
  nfeProximoNumero: number
  nfeCsc: string
  nfeCscId: string
  issAliquotaPadrao: number
  servicoCodigoPadrao: string
  cfopPadrao: string
  enviarEmailAuto: boolean
  enviarWhatsappAuto: boolean
}

export interface NfseForm {
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
  serviceValue: number
  issAliquota: number
  deduction: number
  issRetidoFonte: boolean
  observations: string
}

export interface NfeItem {
  productId: string
  productName: string
  ncm: string
  cfop: string
  qty: number
  unitValue: number
  icmsAliquota: number
}

export interface NfeForm {
  clientId: string
  clientName: string
  clientDocument: string
  clientEmail: string
  items: NfeItem[]
  naturezaOperacao: string
  frete: string
  freteValue: number
  additionalInfo: string
}

// ── Constantes ────────────────────────────────────────────────────────────────

export const SERVICE_CODES = [
  { label: '9602-5/01 — Cabeleireiros', value: '9602-5/01' },
  { label: '9602-5/02 — Tratamento de beleza', value: '9602-5/02' },
  { label: '9602-5/03 — Manicure e pedicure', value: '9602-5/03' },
  { label: '9602-5/04 — Atividades de estética e outros serviços de cuidados com a beleza', value: '9602-5/04' },
  { label: '8630-5/06 — Serviços de vacinação e imunização humana', value: '8630-5/06' },
  { label: '7500-1/00 — Atividades veterinárias', value: '7500-1/00' },
  { label: '9609-2/08 — Higiene e embelezamento de animais domésticos', value: '9609-2/08' },
  { label: '8011-1/01 — Atividades de vigilância e segurança privada', value: '8011-1/01' },
  { label: '4120-4/00 — Construção de edifícios', value: '4120-4/00' },
  { label: '6201-5/01 — Desenvolvimento de programas de computador sob encomenda', value: '6201-5/01' },
]

export const CFOP_OPTIONS = [
  { label: '5102 — Venda de mercadoria adquirida ou recebida de terceiros', value: '5102' },
  { label: '5101 — Venda de produção do estabelecimento', value: '5101' },
  { label: '5405 — Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária', value: '5405' },
  { label: '6102 — Venda de mercadoria adquirida ou recebida de terceiros (outra UF)', value: '6102' },
  { label: '5152 — Transferência de mercadoria adquirida ou recebida de terceiros', value: '5152' },
  { label: '5949 — Outra saída de mercadoria ou prestação de serviço não especificado', value: '5949' },
]

export const MUNICIPIOS_NFSE = [
  { label: 'São Paulo/SP', value: 'sao-paulo', url: 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx' },
  { label: 'Rio de Janeiro/RJ', value: 'rio-janeiro', url: 'https://notacarioca.rio.gov.br/WSNFe/loteRPS.asmx' },
  { label: 'Belo Horizonte/MG', value: 'belo-horizonte', url: 'https://bhissdigital.pbh.gov.br/bhiss-ws/nfse' },
  { label: 'Curitiba/PR', value: 'curitiba', url: 'https://www.curitiba.pr.gov.br/nfse' },
  { label: 'Porto Alegre/RS', value: 'porto-alegre', url: 'https://nfse.portoalegre.rs.gov.br/nfse' },
  { label: 'Salvador/BA', value: 'salvador', url: 'https://nfse.salvador.ba.gov.br/ws/nfse.asmx' },
  { label: 'Fortaleza/CE', value: 'fortaleza', url: 'https://nfe.fortaleza.ce.gov.br/nfse' },
  { label: 'Recife/PE', value: 'recife', url: 'https://nfse.recife.pe.gov.br/NFSe' },
  { label: 'Campinas/SP', value: 'campinas', url: 'https://issdigital.campinas.sp.gov.br/ws/nfse.asmx' },
  { label: 'Florianópolis/SC', value: 'florianopolis', url: 'https://www.pmf.sc.gov.br/sistemas/tln/ws/nfse.asmx' },
]

// ── Helpers de data ───────────────────────────────────────────────────────────

const dDateTime = (offset: number, time = '10:00'): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10) + ' ' + time
}

const _dDate = (offset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONFIG: FiscalConfig = {
  cnpj: '12.345.678/0001-90',
  inscricaoMunicipal: '12.345.678-9',
  inscricaoEstadual: '',
  razaoSocial: 'Studio Beleza LTDA ME',
  nomeFantasia: 'Studio Beleza',
  endereco: 'Rua das Flores, 123 — Jardim América — São Paulo/SP — CEP 01234-567',
  municipioIbge: '3550308',
  regimeTributario: 'SN',
  snAnexo: 'III',
  snAliquotaEfetiva: 6.0,
  snRbt12: 180000,
  lpPisAliquota: 0.65,
  lpCofinsAliquota: 3.0,
  certStatus: 'valid',
  certExpiry: '2027-09-15',
  certCnpj: '12.345.678/0001-90',
  nfseWebserviceUrl: 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx',
  nfseUsuario: 'studio.beleza',
  nfseSenha: '',
  nfseSerie: '1',
  nfseProximoNumero: 1235,
  nfeAmbiente: 'homologacao',
  nfeSerie: '1',
  nfeProximoNumero: 1,
  nfeCsc: 'ABC123DEF456',
  nfeCscId: '000001',
  issAliquotaPadrao: 5.0,
  servicoCodigoPadrao: '9602-5/01',
  cfopPadrao: '5102',
  enviarEmailAuto: true,
  enviarWhatsappAuto: false,
}

const MOCK_DOCUMENTS: FiscalDocument[] = [
  {
    id: 'nf-001',
    number: '1234',
    serie: '1',
    type: 'NFSE',
    status: 'ISSUED',
    issuedAt: dDateTime(-1, '14:32'),
    clientId: 'cli-1',
    clientName: 'Maria Silva',
    clientDocument: '123.456.789-00',
    clientEmail: 'maria.silva@email.com',
    description: 'Corte Feminino + Escova Progressiva',
    totalValue: 280.00,
    issValue: 14.00,
    xmlKey: '35240112345678000190650010001234000123456789',
    items: [{
      description: 'Corte Feminino + Escova Progressiva',
      serviceCode: '9602-5/01',
      serviceLabel: 'Cabeleireiros',
      value: 280.00,
      issAliquota: 5,
      issValue: 14.00,
      deduction: 0,
      calcBase: 280.00,
    }],
  },
  {
    id: 'nf-002',
    number: '1233',
    serie: '1',
    type: 'NFSE',
    status: 'ISSUED',
    issuedAt: dDateTime(-2, '11:15'),
    clientId: 'cli-2',
    clientName: 'João Carlos Mendes',
    clientDocument: '234.567.890-11',
    clientEmail: 'joao.mendes@empresa.com.br',
    description: 'Corte Masculino + Barba',
    totalValue: 95.00,
    issValue: 4.75,
    xmlKey: '35240112345678000190650010001233000123456788',
    items: [{
      description: 'Corte Masculino + Barba',
      serviceCode: '9602-5/01',
      serviceLabel: 'Cabeleireiros',
      value: 95.00,
      issAliquota: 5,
      issValue: 4.75,
      deduction: 0,
      calcBase: 95.00,
    }],
  },
  {
    id: 'nf-003',
    number: '1232',
    serie: '1',
    type: 'NFSE',
    status: 'CANCELLED',
    issuedAt: dDateTime(-3, '09:45'),
    cancelledAt: dDateTime(-3, '16:00'),
    cancelReason: 'Erro no valor — serviço não prestado conforme descrito',
    clientName: 'Ana Paula Costa',
    clientDocument: '345.678.901-22',
    description: 'Coloração + Hidratação',
    totalValue: 320.00,
    issValue: 16.00,
    xmlKey: '35240112345678000190650010001232000123456787',
  },
  {
    id: 'nf-004',
    number: '1231',
    serie: '1',
    type: 'NFSE',
    status: 'ERROR',
    issuedAt: dDateTime(-4, '13:20'),
    clientName: 'Roberto Almeida',
    clientDocument: '456.789.012-33',
    description: 'Manicure + Pedicure',
    totalValue: 130.00,
    issValue: 6.50,
    errorMessage: 'E004: Inscrição municipal inválida para o tipo de serviço informado. Verifique o código LC 116.',
  },
  {
    id: 'nf-005',
    number: '—',
    serie: '1',
    type: 'NFSE',
    status: 'PENDING',
    issuedAt: dDateTime(0, '08:30'),
    clientName: 'Fernanda Lima',
    clientDocument: '567.890.123-44',
    clientEmail: 'fernanda@email.com',
    description: 'Tratamento capilar completo',
    totalValue: 450.00,
    issValue: 22.50,
  },
  {
    id: 'nf-006',
    number: '42',
    serie: '1',
    type: 'NFE',
    status: 'ISSUED',
    issuedAt: dDateTime(-5, '10:00'),
    clientName: 'Boutique Elegance LTDA',
    clientDocument: '12.345.678/0001-99',
    clientEmail: 'compras@boutique.com.br',
    description: 'Shampoo Wella Fusion (x3) + Óleo Moroccan Oil (x2)',
    totalValue: 709.50,
    xmlKey: '35240112345678000190550010000000420123456785',
    items: [
      { productId: 'prod-1', productName: 'Shampoo Wella Fusion', ncm: '33051000', cfop: '5102', qty: 3, unitValue: 89.90, subtotal: 269.70, icmsAliquota: 12, icmsValue: 32.36 },
      { productId: 'prod-4', productName: 'Óleo de Argan Moroccan Oil', ncm: '33059000', cfop: '5102', qty: 2, unitValue: 219.90, subtotal: 439.80, icmsAliquota: 12, icmsValue: 52.78 },
    ] as FiscalProductItem[],
  },
  {
    id: 'nf-007',
    number: '41',
    serie: '1',
    type: 'NFE',
    status: 'ISSUED',
    issuedAt: dDateTime(-7, '15:45'),
    clientName: 'Salão das Americanas',
    clientDocument: '98.765.432/0001-11',
    description: 'Esmalte Risqué (x24)',
    totalValue: 309.60,
    xmlKey: '35240112345678000190550010000000410123456784',
    items: [
      { productId: 'prod-7', productName: 'Esmalte Risqué Cores', ncm: '33042000', cfop: '5102', qty: 24, unitValue: 12.90, subtotal: 309.60, icmsAliquota: 12, icmsValue: 37.15 },
    ] as FiscalProductItem[],
  },
  {
    id: 'nf-008',
    number: '1230',
    serie: '1',
    type: 'NFSE',
    status: 'ISSUED',
    issuedAt: dDateTime(-8, '09:10'),
    clientName: 'Clínica Bem-Estar',
    clientDocument: '55.666.777/0001-88',
    clientEmail: 'financeiro@clinicabemestar.com.br',
    description: 'Tratamento estético facial + massagem',
    totalValue: 680.00,
    issValue: 34.00,
    xmlKey: '35240112345678000190650010001230000123456783',
  },
]

// ── Estado singleton ──────────────────────────────────────────────────────────

const documents = ref<FiscalDocument[]>([])
const config = ref<FiscalConfig>({ ...MOCK_CONFIG })
const loading = ref(false)
const initialized = ref(false)

// ── Funções ───────────────────────────────────────────────────────────────────

async function fetchAll(): Promise<void> {
  if (initialized.value) return
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  documents.value = MOCK_DOCUMENTS.map(d => ({ ...d }))
  initialized.value = true
  loading.value = false
}

async function issueNfse(form: NfseForm): Promise<FiscalDocument> {
  await new Promise(r => setTimeout(r, 1500))
  const isError = Math.random() < 0.15  // 15% chance de erro
  const num = String(config.value.nfseProximoNumero)
  const doc: FiscalDocument = {
    id: 'nf-' + Date.now(),
    number: isError ? '—' : num,
    serie: config.value.nfseSerie,
    type: 'NFSE',
    status: isError ? 'ERROR' : 'ISSUED',
    issuedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    clientId: form.clientId,
    clientName: form.clientName,
    clientDocument: form.clientDocument,
    clientEmail: form.clientEmail,
    description: form.serviceDescription,
    totalValue: form.serviceValue,
    issValue: form.serviceValue * form.issAliquota / 100,
    errorMessage: isError ? 'E099: Erro de comunicação com o webservice da prefeitura. Tente novamente.' : undefined,
    xmlKey: isError ? undefined : '35' + Date.now().toString().slice(-20),
    items: [{
      description: form.serviceDescription,
      serviceCode: form.serviceCode,
      serviceLabel: form.serviceLabel,
      value: form.serviceValue,
      issAliquota: form.issAliquota,
      issValue: form.serviceValue * form.issAliquota / 100,
      deduction: form.deduction,
      calcBase: form.serviceValue - form.deduction,
    }],
  }
  if (!isError) config.value.nfseProximoNumero++
  documents.value.unshift(doc)
  return doc
}

async function issueNfe(form: NfeForm): Promise<FiscalDocument> {
  await new Promise(r => setTimeout(r, 1500))
  const isError = Math.random() < 0.1
  const num = String(config.value.nfeProximoNumero)
  const totalValue = form.items.reduce((s, i) => s + i.qty * i.unitValue, 0) + (form.frete !== 'sem-frete' ? form.freteValue : 0)
  const items: FiscalProductItem[] = form.items.map(i => ({
    productId: i.productId,
    productName: i.productName,
    ncm: i.ncm,
    cfop: i.cfop,
    qty: i.qty,
    unitValue: i.unitValue,
    subtotal: i.qty * i.unitValue,
    icmsAliquota: i.icmsAliquota,
    icmsValue: i.qty * i.unitValue * i.icmsAliquota / 100,
  }))
  const doc: FiscalDocument = {
    id: 'nf-' + Date.now(),
    number: isError ? '—' : num,
    serie: config.value.nfeSerie,
    type: 'NFE',
    status: isError ? 'ERROR' : 'ISSUED',
    issuedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    clientId: form.clientId,
    clientName: form.clientName,
    clientDocument: form.clientDocument,
    clientEmail: form.clientEmail,
    description: form.items.map(i => i.productName + ' (x' + i.qty + ')').join(', '),
    totalValue,
    errorMessage: isError ? 'E099: Rejeição: Ambiente informado diverge do ambiente de recebimento.' : undefined,
    xmlKey: isError ? undefined : '35' + Date.now().toString().slice(-20),
    items,
  }
  if (!isError) config.value.nfeProximoNumero++
  documents.value.unshift(doc)
  return doc
}

function cancelDocument(id: string, reason: string): void {
  const doc = documents.value.find(d => d.id === id)
  if (doc) {
    doc.status = 'CANCELLED'
    doc.cancelledAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    doc.cancelReason = reason
  }
}

function saveFiscalConfig(newConfig: FiscalConfig): void {
  config.value = { ...newConfig }
}

// ── Composable ────────────────────────────────────────────────────────────────

export const useFiscal = () => {
  return {
    documents,
    fiscalConfig: config,
    loading,
    fetchAll,
    issueNfse,
    issueNfe,
    cancelDocument,
    saveFiscalConfig,
    SERVICE_CODES,
    CFOP_OPTIONS,
    MUNICIPIOS_NFSE,
  }
}
