/**
 * useFinancial — Composable de domínio para Financeiro.
 * Mock com latência simulada de 400ms. Interface idêntica à futura API.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type TransactionType = 'INCOME' | 'EXPENSE'
export type TransactionStatus = 'PAID' | 'PENDING' | 'CANCELLED'
export type TransactionCategory = 'SALE' | 'SERVICE' | 'PRODUCT' | 'RENT' | 'SALARY' | 'UTILITIES' | 'MARKETING' | 'TAX' | 'EQUIPMENT' | 'OTHER'
export type TxPaymentMethod = 'PIX' | 'CASH' | 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'BOLETO'

export type ReceivableStatus = 'PENDING' | 'OVERDUE' | 'RECEIVED' | 'CANCELLED'
export type PayableStatus = 'PENDING' | 'OVERDUE' | 'PAID' | 'CANCELLED'

export interface Transaction {
  id: string
  date: string            // 'YYYY-MM-DD HH:MM'
  description: string
  type: TransactionType
  category: TransactionCategory
  amount: number
  paymentMethod: TxPaymentMethod
  status: TransactionStatus
  clientId?: string
  clientName?: string
  professionalId?: string
  professionalName?: string
  appointmentId?: string
  items?: { name: string; qty: number; price: number }[]
  notes?: string
  installments?: number
  installmentCurrent?: number
}

export interface Receivable {
  id: string
  description: string
  clientId?: string
  clientName?: string
  amount: number
  dueDate: string         // 'YYYY-MM-DD'
  status: ReceivableStatus
  paymentMethod?: TxPaymentMethod
  category: TransactionCategory
  notes?: string
  createdAt: string
  receivedAt?: string
  appointmentId?: string
  installments?: number
  installmentCurrent?: number
  installmentOf?: number
}

export interface Payable {
  id: string
  description: string
  supplierName?: string
  amount: number
  dueDate: string         // 'YYYY-MM-DD'
  status: PayableStatus
  paymentMethod?: TxPaymentMethod
  category: TransactionCategory
  notes?: string
  createdAt: string
  paidAt?: string
  recurrent?: boolean
  recurrentPeriod?: 'monthly' | 'weekly' | 'yearly'
  installments?: number
  installmentCurrent?: number
}

export interface CommissionEntry {
  professionalId: string
  professionalName: string
  professionalRole: string
  appointments: number
  revenue: number
  rate: number
  commission: number
  status: 'PENDING' | 'PAID'
  period: string
  serviceBreakdown?: { service: string; count: number; revenue: number }[]
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
}

export interface DRECategory {
  key: string
  label: string
  type: 'income' | 'expense' | 'subtotal' | 'net'
  current: number
  previous: number
  isSubtotal?: boolean
  indent?: number
}

export const PERIODS = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: 'week' },
  { label: '30 dias', value: '30d' },
  { label: 'Mês atual', value: 'month' },
  { label: 'Mês anterior', value: 'last_month' },
  { label: 'Personalizado', value: 'custom' },
]

// ── Mock data helpers ─────────────────────────────────────────────────────────

const today = new Date()
const thisMonth = today.toISOString().slice(0, 7)

const d = (offset: number, time = '10:00') => {
  const dt = new Date(today)
  dt.setDate(dt.getDate() + offset)
  return `${dt.toISOString().slice(0, 10)} ${time}`
}

const dDate = (offset: number) => {
  const dt = new Date(today)
  dt.setDate(dt.getDate() + offset)
  return dt.toISOString().slice(0, 10)
}

const prevMonth = (offset: number, time = '10:00') => {
  const dt = new Date(today)
  dt.setMonth(dt.getMonth() - 1)
  dt.setDate(offset)
  return `${dt.toISOString().slice(0, 10)} ${time}`
}

const prevMonthDate = (dayOfMonth: number) => {
  const dt = new Date(today)
  dt.setMonth(dt.getMonth() - 1)
  dt.setDate(dayOfMonth)
  return dt.toISOString().slice(0, 10)
}

// ── Transactions ──────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: Transaction[] = [
  // Receitas pagas — serviços
  {
    id: 'tx-1', date: d(0, '09:00'), description: 'Corte + Escova — Maria Silva',
    type: 'INCOME', category: 'SERVICE', amount: 80, paymentMethod: 'PIX', status: 'PAID',
    clientId: 'cli-1', clientName: 'Maria Silva', professionalId: 'pro-1', professionalName: 'Ana Costa',
    items: [{ name: 'Corte + Escova', qty: 1, price: 80 }],
  },
  {
    id: 'tx-2', date: d(0, '10:00'), description: 'Corte Masculino — João Mendes',
    type: 'INCOME', category: 'SERVICE', amount: 45, paymentMethod: 'CASH', status: 'PAID',
    clientId: 'cli-2', clientName: 'João Mendes', professionalId: 'pro-2', professionalName: 'Carlos Lima',
    items: [{ name: 'Corte Masculino', qty: 1, price: 45 }],
  },
  {
    id: 'tx-3', date: d(-1, '10:45'), description: 'Hidratação Facial — Maria Silva',
    type: 'INCOME', category: 'SERVICE', amount: 90, paymentMethod: 'CREDIT', status: 'PAID',
    clientId: 'cli-1', clientName: 'Maria Silva', professionalId: 'pro-3', professionalName: 'Julia Rocha',
    items: [{ name: 'Hidratação Facial', qty: 1, price: 90 }],
  },
  {
    id: 'tx-4', date: d(-2, '09:30'), description: 'Corte Masculino — Rafael Torres',
    type: 'INCOME', category: 'SERVICE', amount: 45, paymentMethod: 'PIX', status: 'PAID',
    clientId: 'cli-4', clientName: 'Rafael Torres', professionalId: 'pro-2', professionalName: 'Carlos Lima',
    items: [{ name: 'Corte Masculino', qty: 1, price: 45 }],
  },
  {
    id: 'tx-5', date: d(-3, '11:00'), description: 'Limpeza de Pele — Fernanda Lima',
    type: 'INCOME', category: 'SERVICE', amount: 120, paymentMethod: 'DEBIT', status: 'PAID',
    clientId: 'cli-5', clientName: 'Fernanda Lima', professionalId: 'pro-3', professionalName: 'Julia Rocha',
    items: [{ name: 'Limpeza de Pele', qty: 1, price: 120 }],
  },
  {
    id: 'tx-6', date: d(-4, '14:00'), description: 'Escova Progressiva — Camila Ferreira',
    type: 'INCOME', category: 'SERVICE', amount: 180, paymentMethod: 'CREDIT', status: 'PAID',
    clientId: 'cli-7', clientName: 'Camila Ferreira', professionalId: 'pro-1', professionalName: 'Ana Costa',
    items: [{ name: 'Escova Progressiva', qty: 1, price: 180 }],
  },
  {
    id: 'tx-7', date: d(-5, '10:00'), description: 'Barba Completa — Lucas Oliveira',
    type: 'INCOME', category: 'SERVICE', amount: 35, paymentMethod: 'CASH', status: 'PAID',
    clientId: 'cli-8', clientName: 'Lucas Oliveira', professionalId: 'pro-2', professionalName: 'Carlos Lima',
    items: [{ name: 'Barba Completa', qty: 1, price: 35 }],
  },
  {
    id: 'tx-8', date: d(-6, '15:30'), description: 'Corte Feminino — Juliana Ramos',
    type: 'INCOME', category: 'SERVICE', amount: 80, paymentMethod: 'PIX', status: 'PAID',
    clientId: 'cli-9', clientName: 'Juliana Ramos', professionalId: 'pro-1', professionalName: 'Ana Costa',
    items: [{ name: 'Corte Feminino', qty: 1, price: 80 }],
  },
  {
    id: 'tx-9', date: d(-7, '11:00'), description: 'Venda — Shampoo Wella Luxe',
    type: 'INCOME', category: 'PRODUCT', amount: 89.90, paymentMethod: 'PIX', status: 'PAID',
    clientId: 'cli-1', clientName: 'Maria Silva',
    items: [{ name: 'Shampoo Wella Luxe', qty: 1, price: 89.90 }],
  },
  {
    id: 'tx-20b', date: d(-8, '10:00'), description: 'Coloração Completa — Sofia Andrade',
    type: 'INCOME', category: 'SERVICE', amount: 220, paymentMethod: 'CREDIT', status: 'PAID',
    clientId: 'cli-11', clientName: 'Sofia Andrade', professionalId: 'pro-1', professionalName: 'Ana Costa',
    items: [{ name: 'Coloração Completa', qty: 1, price: 220 }],
    installments: 3, installmentCurrent: 1,
  },
  {
    id: 'tx-21b', date: d(-9, '14:30'), description: 'Manicure + Pedicure — Patrícia Gomes',
    type: 'INCOME', category: 'SERVICE', amount: 65, paymentMethod: 'PIX', status: 'PAID',
    clientId: 'cli-12', clientName: 'Patrícia Gomes', professionalId: 'pro-3', professionalName: 'Julia Rocha',
    items: [{ name: 'Manicure + Pedicure', qty: 1, price: 65 }],
  },
  {
    id: 'tx-22b', date: d(-10, '09:00'), description: 'Venda — Kit Tratamento Capilar',
    type: 'INCOME', category: 'PRODUCT', amount: 145, paymentMethod: 'PIX', status: 'PAID',
    clientId: 'cli-2', clientName: 'João Mendes',
    items: [{ name: 'Máscara Redken', qty: 1, price: 85 }, { name: 'Leave-in Wella', qty: 1, price: 60 }],
  },
  // Receitas pendentes
  {
    id: 'tx-10', date: d(-1, '16:00'), description: 'Coloração + Hidratação — Beatriz Souza',
    type: 'INCOME', category: 'SERVICE', amount: 180, paymentMethod: 'PIX', status: 'PENDING',
    clientId: 'cli-3', clientName: 'Beatriz Souza', professionalId: 'pro-1', professionalName: 'Ana Costa',
    notes: 'Aguardando confirmação de pagamento via Pix',
  },
  {
    id: 'tx-11', date: d(-2, '13:00'), description: 'Limpeza de Pele — Bruno Costa',
    type: 'INCOME', category: 'SERVICE', amount: 120, paymentMethod: 'CREDIT', status: 'PENDING',
    clientId: 'cli-10', clientName: 'Bruno Costa', professionalId: 'pro-3', professionalName: 'Julia Rocha',
  },
  // Cancelada
  {
    id: 'tx-12', date: d(-8, '14:00'), description: 'Barba + Bigode — Paulo Andrade',
    type: 'INCOME', category: 'SERVICE', amount: 50, paymentMethod: 'CASH', status: 'CANCELLED',
    clientId: 'cli-6', clientName: 'Paulo Andrade', professionalId: 'pro-2', professionalName: 'Carlos Lima',
    notes: 'Cliente não compareceu',
  },
  // Despesas pagas
  {
    id: 'tx-13', date: `${thisMonth}-05 09:00`, description: 'Aluguel — Abril 2026',
    type: 'EXPENSE', category: 'RENT', amount: 2800, paymentMethod: 'PIX', status: 'PAID',
  },
  {
    id: 'tx-14', date: `${thisMonth}-05 09:30`, description: 'Salários — Abril 2026',
    type: 'EXPENSE', category: 'SALARY', amount: 6500, paymentMethod: 'TRANSFER', status: 'PAID',
    notes: 'Folha de pagamento mensal',
  },
  {
    id: 'tx-15', date: `${thisMonth}-10 10:00`, description: 'Produtos e insumos — Wella Brasil Ltda',
    type: 'EXPENSE', category: 'PRODUCT', amount: 1200, paymentMethod: 'CREDIT', status: 'PAID',
    notes: 'Fornecedor: Wella Brasil Ltda',
  },
  {
    id: 'tx-16', date: `${thisMonth}-12 11:00`, description: 'Energia elétrica',
    type: 'EXPENSE', category: 'UTILITIES', amount: 320, paymentMethod: 'DEBIT', status: 'PAID',
  },
  {
    id: 'tx-17', date: `${thisMonth}-12 11:30`, description: 'Conta de água',
    type: 'EXPENSE', category: 'UTILITIES', amount: 180, paymentMethod: 'DEBIT', status: 'PAID',
  },
  {
    id: 'tx-18', date: `${thisMonth}-02 14:00`, description: 'Marketing — Google Ads',
    type: 'EXPENSE', category: 'MARKETING', amount: 450, paymentMethod: 'CREDIT', status: 'PAID',
    notes: 'Campanha Abril — Coloração',
  },
  {
    id: 'tx-23b', date: `${thisMonth}-15 10:00`, description: 'Material de limpeza',
    type: 'EXPENSE', category: 'OTHER', amount: 180, paymentMethod: 'CASH', status: 'PAID',
  },
  {
    id: 'tx-24b', date: `${thisMonth}-08 09:00`, description: 'Contador — Honorários',
    type: 'EXPENSE', category: 'OTHER', amount: 350, paymentMethod: 'PIX', status: 'PAID',
  },
  // Despesa pendente
  {
    id: 'tx-19', date: `${thisMonth}-20 09:00`, description: 'Renovação de contrato de software',
    type: 'EXPENSE', category: 'OTHER', amount: 299, paymentMethod: 'CREDIT', status: 'PENDING',
    notes: 'Sistema de agendamento — renovação anual',
  },
  // Mês anterior
  {
    id: 'tx-20', date: prevMonth(28, '10:00'), description: 'Aluguel — Março 2026',
    type: 'EXPENSE', category: 'RENT', amount: 2800, paymentMethod: 'PIX', status: 'PAID',
  },
  {
    id: 'tx-25b', date: prevMonth(5, '09:00'), description: 'Salários — Março 2026',
    type: 'EXPENSE', category: 'SALARY', amount: 6500, paymentMethod: 'TRANSFER', status: 'PAID',
  },
  {
    id: 'tx-26b', date: prevMonth(10, '10:00'), description: 'Produtos e insumos — Março',
    type: 'EXPENSE', category: 'PRODUCT', amount: 980, paymentMethod: 'CREDIT', status: 'PAID',
  },
]

// ── Receivables (Contas a Receber) ────────────────────────────────────────────

const MOCK_RECEIVABLES: Receivable[] = [
  {
    id: 'rec-1', description: 'Coloração + Hidratação — Beatriz Souza',
    clientId: 'cli-3', clientName: 'Beatriz Souza',
    amount: 180, dueDate: dDate(-1), status: 'OVERDUE',
    paymentMethod: 'PIX', category: 'SERVICE',
    notes: 'Aguardando confirmação de pagamento via Pix',
    createdAt: d(-3, '09:00'), appointmentId: 'apt-x1',
  },
  {
    id: 'rec-2', description: 'Limpeza de Pele — Bruno Costa',
    clientId: 'cli-10', clientName: 'Bruno Costa',
    amount: 120, dueDate: dDate(0), status: 'PENDING',
    paymentMethod: 'CREDIT', category: 'SERVICE',
    createdAt: d(-2, '13:00'), appointmentId: 'apt-x2',
  },
  {
    id: 'rec-3', description: 'Coloração Completa — Sofia Andrade (Parcela 2/3)',
    clientId: 'cli-11', clientName: 'Sofia Andrade',
    amount: 73.33, dueDate: dDate(7), status: 'PENDING',
    paymentMethod: 'CREDIT', category: 'SERVICE',
    createdAt: d(-8, '10:00'), installments: 3, installmentCurrent: 2, installmentOf: 3,
  },
  {
    id: 'rec-4', description: 'Coloração Completa — Sofia Andrade (Parcela 3/3)',
    clientId: 'cli-11', clientName: 'Sofia Andrade',
    amount: 73.33, dueDate: dDate(37), status: 'PENDING',
    paymentMethod: 'CREDIT', category: 'SERVICE',
    createdAt: d(-8, '10:00'), installments: 3, installmentCurrent: 3, installmentOf: 3,
  },
  {
    id: 'rec-5', description: 'Corte + Escova — Camila Ferreira',
    clientId: 'cli-7', clientName: 'Camila Ferreira',
    amount: 80, dueDate: dDate(-15), status: 'RECEIVED',
    paymentMethod: 'PIX', category: 'SERVICE',
    createdAt: d(-20, '14:00'), receivedAt: d(-15, '10:30'),
  },
  {
    id: 'rec-6', description: 'Pacote Mensal — Maria Silva',
    clientId: 'cli-1', clientName: 'Maria Silva',
    amount: 350, dueDate: dDate(-5), status: 'RECEIVED',
    paymentMethod: 'PIX', category: 'SALE',
    createdAt: d(-10, '09:00'), receivedAt: d(-5, '11:00'),
  },
]

// ── Payables (Contas a Pagar) ─────────────────────────────────────────────────

const MOCK_PAYABLES: Payable[] = [
  {
    id: 'pay-1', description: 'Aluguel — Maio 2026',
    supplierName: 'Imobiliária Central', amount: 2800,
    dueDate: dDate(5), status: 'PENDING',
    paymentMethod: 'PIX', category: 'RENT',
    createdAt: d(-10, '09:00'), recurrent: true, recurrentPeriod: 'monthly',
  },
  {
    id: 'pay-2', description: 'Energia elétrica — Fatura Maio',
    supplierName: 'CEMIG', amount: 320,
    dueDate: dDate(3), status: 'PENDING',
    paymentMethod: 'DEBIT', category: 'UTILITIES',
    createdAt: d(-7, '10:00'), recurrent: true, recurrentPeriod: 'monthly',
  },
  {
    id: 'pay-3', description: 'Renovação sistema de agendamento',
    supplierName: 'TechSaaS Ltda', amount: 299,
    dueDate: dDate(15), status: 'PENDING',
    paymentMethod: 'CREDIT', category: 'OTHER',
    notes: 'Licença anual — sistema de agendamento',
    createdAt: d(-3, '09:00'),
  },
  {
    id: 'pay-4', description: 'Marketing — Google Ads Maio',
    supplierName: 'Google', amount: 450,
    dueDate: dDate(10), status: 'PENDING',
    paymentMethod: 'CREDIT', category: 'MARKETING',
    createdAt: d(-2, '11:00'), recurrent: true, recurrentPeriod: 'monthly',
  },
  {
    id: 'pay-5', description: 'Fornecedor — Wella Brasil (Produtos)',
    supplierName: 'Wella Brasil Ltda', amount: 1200,
    dueDate: dDate(-2), status: 'OVERDUE',
    paymentMethod: 'BOLETO', category: 'PRODUCT',
    notes: 'Boleto vencido — renovar junto ao fornecedor',
    createdAt: d(-15, '09:00'),
  },
  {
    id: 'pay-6', description: 'Salários — Maio 2026',
    amount: 6500, dueDate: dDate(5), status: 'PENDING',
    paymentMethod: 'TRANSFER', category: 'SALARY',
    createdAt: d(-5, '09:00'), recurrent: true, recurrentPeriod: 'monthly',
  },
  {
    id: 'pay-7', description: 'Aluguel — Abril 2026',
    supplierName: 'Imobiliária Central', amount: 2800,
    dueDate: dDate(-35), status: 'PAID',
    paymentMethod: 'PIX', category: 'RENT',
    createdAt: d(-40, '09:00'), paidAt: d(-35, '09:30'),
    recurrent: true, recurrentPeriod: 'monthly',
  },
  {
    id: 'pay-8', description: 'Energia elétrica — Fatura Abril',
    supplierName: 'CEMIG', amount: 285,
    dueDate: dDate(-27), status: 'PAID',
    paymentMethod: 'DEBIT', category: 'UTILITIES',
    createdAt: d(-35, '10:00'), paidAt: d(-27, '09:00'),
  },
  {
    id: 'pay-9', description: 'Contador — Honorários Abril',
    supplierName: 'Escritório Contábil XY', amount: 350,
    dueDate: dDate(-10), status: 'PAID',
    paymentMethod: 'PIX', category: 'OTHER',
    createdAt: d(-12, '09:00'), paidAt: d(-10, '11:00'),
  },
]

// ── Monthly chart data (6 months) ────────────────────────────────────────────

const MOCK_MONTHLY: MonthlyData[] = [
  { month: 'Nov', income: 14200, expenses: 9800 },
  { month: 'Dez', income: 18600, expenses: 10200 },
  { month: 'Jan', income: 12100, expenses: 11400 },
  { month: 'Fev', income: 15300, expenses: 10800 },
  { month: 'Mar', income: 17900, expenses: 11800 },
  { month: 'Abr', income: 24560, expenses: 8320 },
]

// ── Commissions ───────────────────────────────────────────────────────────────

const MOCK_COMMISSIONS: CommissionEntry[] = [
  {
    professionalId: 'pro-1', professionalName: 'Ana Costa', professionalRole: 'Cabeleireira Sênior',
    appointments: 8, revenue: 1050, rate: 35, commission: 367.50, status: 'PENDING', period: 'Abril 2026',
    serviceBreakdown: [
      { service: 'Corte + Escova', count: 3, revenue: 240 },
      { service: 'Coloração', count: 2, revenue: 440 },
      { service: 'Escova Progressiva', count: 1, revenue: 180 },
      { service: 'Outros', count: 2, revenue: 190 },
    ],
  },
  {
    professionalId: 'pro-2', professionalName: 'Carlos Lima', professionalRole: 'Barbeiro',
    appointments: 6, revenue: 250, rate: 30, commission: 75.00, status: 'PENDING', period: 'Abril 2026',
    serviceBreakdown: [
      { service: 'Corte Masculino', count: 4, revenue: 180 },
      { service: 'Barba', count: 2, revenue: 70 },
    ],
  },
  {
    professionalId: 'pro-3', professionalName: 'Julia Rocha', professionalRole: 'Esteticista',
    appointments: 5, revenue: 545, rate: 40, commission: 218.00, status: 'PENDING', period: 'Abril 2026',
    serviceBreakdown: [
      { service: 'Limpeza de Pele', count: 2, revenue: 240 },
      { service: 'Hidratação Facial', count: 2, revenue: 180 },
      { service: 'Manicure+Pedicure', count: 1, revenue: 65 },
    ],
  },
  {
    professionalId: 'pro-4', professionalName: 'Pedro Silva', professionalRole: 'Cabeleireiro',
    appointments: 0, revenue: 0, rate: 30, commission: 0, status: 'PAID', period: 'Março 2026',
    serviceBreakdown: [],
  },
]

// ── DRE (Demonstrativo de Resultado) ─────────────────────────────────────────

const MOCK_DRE: DRECategory[] = [
  { key: 'receita_bruta', label: 'Receita Bruta', type: 'income', current: 24560, previous: 17900 },
  { key: 'deducoes', label: 'Deduções e Impostos', type: 'expense', current: -1228, previous: -895, indent: 1 },
  { key: 'receita_liquida', label: 'Receita Líquida', type: 'subtotal', current: 23332, previous: 17005, isSubtotal: true },
  { key: 'servicos', label: 'Serviços (70,4%)', type: 'income', current: 17283, previous: 12565, indent: 1 },
  { key: 'produtos', label: 'Produtos (14,8%)', type: 'income', current: 3635, previous: 2685, indent: 1 },
  { key: 'outros_rec', label: 'Outros (14,8%)', type: 'income', current: 3642, previous: 2650, indent: 1 },
  { key: 'cme', label: 'CMV — Custo de Mercadorias', type: 'expense', current: -1200, previous: -980 },
  { key: 'lucro_bruto', label: 'Lucro Bruto', type: 'subtotal', current: 22132, previous: 16025, isSubtotal: true },
  { key: 'salarios', label: 'Salários e Encargos', type: 'expense', current: -6500, previous: -6500, indent: 1 },
  { key: 'comissoes_exp', label: 'Comissões', type: 'expense', current: -660.50, previous: -520, indent: 1 },
  { key: 'aluguel', label: 'Aluguel', type: 'expense', current: -2800, previous: -2800, indent: 1 },
  { key: 'utilities', label: 'Energia / Água / Internet', type: 'expense', current: -500, previous: -480, indent: 1 },
  { key: 'marketing', label: 'Marketing e Publicidade', type: 'expense', current: -450, previous: -320, indent: 1 },
  { key: 'outros_desp', label: 'Outros Custos Operacionais', type: 'expense', current: -829, previous: -750, indent: 1 },
  { key: 'ebitda', label: 'EBITDA', type: 'subtotal', current: 10392.50, previous: 4655, isSubtotal: true },
  { key: 'deprec', label: 'Depreciação e Amortização', type: 'expense', current: -150, previous: -150, indent: 1 },
  { key: 'ebit', label: 'EBIT (Resultado Operacional)', type: 'subtotal', current: 10242.50, previous: 4505, isSubtotal: true },
  { key: 'result_fin', label: 'Resultado Financeiro', type: 'expense', current: 0, previous: 0, indent: 1 },
  { key: 'lair', label: 'LAIR (Antes dos Impostos)', type: 'subtotal', current: 10242.50, previous: 4505, isSubtotal: true },
  { key: 'ir', label: 'IR / CSLL (Simples Nacional)', type: 'expense', current: -1228, previous: -895, indent: 1 },
  { key: 'lucro_liq', label: 'Lucro Líquido', type: 'net', current: 9014.50, previous: 3610, isSubtotal: true },
]

// ── Singleton refs ─────────────────────────────────────────────────────────────

const transactions = ref<Transaction[]>([])
const receivables = ref<Receivable[]>([])
const payables = ref<Payable[]>([])
const commissions = ref<CommissionEntry[]>([])
const monthlyData = ref<MonthlyData[]>([])
const dreData = ref<DRECategory[]>([])
const loading = ref(false)

// ── Composable ────────────────────────────────────────────────────────────────

export const useFinancial = () => {
  const fetchAll = async () => {
    loading.value = true
    await new Promise(r => setTimeout(r, 400))
    transactions.value = MOCK_TRANSACTIONS.map(t => ({ ...t }))
    receivables.value = MOCK_RECEIVABLES.map(r => ({ ...r }))
    payables.value = MOCK_PAYABLES.map(p => ({ ...p }))
    commissions.value = MOCK_COMMISSIONS.map(c => ({ ...c }))
    monthlyData.value = [...MOCK_MONTHLY]
    dreData.value = MOCK_DRE.map(d => ({ ...d }))
    loading.value = false
  }

  const cancelTransaction = async (id: string) => {
    await new Promise(r => setTimeout(r, 300))
    const tx = transactions.value.find(t => t.id === id)
    if (tx) tx.status = 'CANCELLED'
  }

  const addTransaction = (tx: Omit<Transaction, 'id'>): Transaction => {
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}` }
    transactions.value.unshift(newTx)
    return newTx
  }

  const markReceivableReceived = async (id: string, method: TxPaymentMethod) => {
    await new Promise(r => setTimeout(r, 300))
    const rec = receivables.value.find(r => r.id === id)
    if (rec) {
      rec.status = 'RECEIVED'
      rec.receivedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
      rec.paymentMethod = method
    }
  }

  const cancelReceivable = async (id: string) => {
    await new Promise(r => setTimeout(r, 300))
    const rec = receivables.value.find(r => r.id === id)
    if (rec) rec.status = 'CANCELLED'
  }

  const addReceivable = (rec: Omit<Receivable, 'id' | 'createdAt'>): Receivable => {
    const newRec: Receivable = {
      ...rec, id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    receivables.value.unshift(newRec)
    return newRec
  }

  const markPayablePaid = async (id: string, method: TxPaymentMethod) => {
    await new Promise(r => setTimeout(r, 300))
    const pay = payables.value.find(p => p.id === id)
    if (pay) {
      pay.status = 'PAID'
      pay.paidAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
      pay.paymentMethod = method
    }
  }

  const cancelPayable = async (id: string) => {
    await new Promise(r => setTimeout(r, 300))
    const pay = payables.value.find(p => p.id === id)
    if (pay) pay.status = 'CANCELLED'
  }

  const addPayable = (pay: Omit<Payable, 'id' | 'createdAt'>): Payable => {
    const newPay: Payable = {
      ...pay, id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    payables.value.unshift(newPay)
    return newPay
  }

  const payCommission = async (professionalId: string, period: string) => {
    await new Promise(r => setTimeout(r, 400))
    const entry = commissions.value.find(c => c.professionalId === professionalId && c.period === period)
    if (entry) entry.status = 'PAID'
  }

  // ── KPI computeds for current month (PAID only) ──────────────────────────

  const kpiIncome = computed(() =>
    transactions.value
      .filter(t => t.type === 'INCOME' && t.status === 'PAID' && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0),
  )

  const kpiExpenses = computed(() =>
    transactions.value
      .filter(t => t.type === 'EXPENSE' && t.status === 'PAID' && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0),
  )

  const kpiProfit = computed(() => kpiIncome.value - kpiExpenses.value)

  const kpiReceivable = computed(() =>
    receivables.value
      .filter(r => r.status === 'PENDING' || r.status === 'OVERDUE')
      .reduce((sum, r) => sum + r.amount, 0),
  )

  const kpiPayable = computed(() =>
    payables.value
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0),
  )

  return {
    transactions, receivables, payables, commissions, monthlyData, dreData, loading,
    fetchAll,
    cancelTransaction, addTransaction,
    markReceivableReceived, cancelReceivable, addReceivable,
    markPayablePaid, cancelPayable, addPayable,
    payCommission,
    kpiIncome, kpiExpenses, kpiProfit, kpiReceivable, kpiPayable,
    PERIODS,
  }
}
