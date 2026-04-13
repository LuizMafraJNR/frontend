// ── Tipos exportados ──────────────────────────────────────────────────────────

export type UnitOfMeasure = 'un' | 'ml' | 'g' | 'kg' | 'L'
export type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'LOSS' | 'RETURN'
export type MovementReason = 'PURCHASE' | 'SALE' | 'SERVICE_USE' | 'ADJUSTMENT' | 'LOSS' | 'RETURN_SUPPLIER'

export interface ProductCategory {
  id: string
  name: string
  color: string
}

export interface ProductVariation {
  id: string
  name: string
  sku: string
  stock: number
  price?: number
}

export interface Product {
  id: string
  name: string
  description?: string
  sku: string
  barcode?: string
  categoryId: string
  brand?: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  unit: UnitOfMeasure
  forSale: boolean
  forInternalUse: boolean
  active: boolean
  imageUrl?: string
  supplierId?: string
  variations?: ProductVariation[]
  createdAt: string
}

export interface Supplier {
  id: string
  name: string
  cnpj?: string
  contact: string
  phone: string
  email: string
  address?: string
  paymentTerms?: string
  notes?: string
  active: boolean
  productsCount: number
  createdAt: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: MovementType
  reason: MovementReason
  qty: number
  qtyBefore: number
  qtyAfter: number
  unitCost?: number
  totalCost?: number
  supplierId?: string
  supplierName?: string
  invoiceNumber?: string
  notes?: string
  createdBy: string
  createdAt: string
  saleId?: string
  appointmentId?: string
}

export interface PurchaseEntry {
  id: string
  supplierId: string
  supplierName: string
  invoiceNumber: string
  date: string
  items: { productId: string; productName: string; qty: number; unitCost: number; total: number }[]
  totalValue: number
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED'
  notes?: string
}

// ── Helpers de data ───────────────────────────────────────────────────────────

const dDate = (offset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const dDateTime = (offset: number, time = '10:00'): string => {
  return dDate(offset) + ' ' + time
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: ProductCategory[] = [
  { id: 'cat-1', name: 'Cabelo', color: '#6366F1' },
  { id: 'cat-2', name: 'Pele', color: '#10B981' },
  { id: 'cat-3', name: 'Nail', color: '#EC4899' },
  { id: 'cat-4', name: 'Perfumaria', color: '#F59E0B' },
  { id: 'cat-5', name: 'Uso Interno', color: '#64748B' },
]

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Wella Distribuidora SP',
    cnpj: '12.345.678/0001-90',
    contact: 'Carlos Mendes',
    phone: '(11) 98765-4321',
    email: 'carlos@wellasupply.com.br',
    address: 'Av. Paulista, 1234 — São Paulo/SP',
    paymentTerms: '30/60 dias',
    notes: 'Entrega em até 3 dias úteis. Pedido mínimo R$ 500.',
    active: true,
    productsCount: 5,
    createdAt: dDate(-180),
  },
  {
    id: 'sup-2',
    name: 'L\'Oréal Brasil LTDA',
    cnpj: '98.765.432/0001-10',
    contact: 'Ana Beatriz Costa',
    phone: '(11) 3456-7890',
    email: 'ana.costa@loreal.com.br',
    address: 'Rua da Consolação, 789 — São Paulo/SP',
    paymentTerms: '28 dias',
    notes: 'Representante exclusivo para a região.',
    active: true,
    productsCount: 4,
    createdAt: dDate(-240),
  },
  {
    id: 'sup-3',
    name: 'Natura Cosméticos',
    cnpj: '71.673.990/0001-77',
    contact: 'Roberto Lima',
    phone: '(11) 4002-8922',
    email: 'roberto.lima@natura.net',
    address: 'Rod. Anhanguera, km 30 — Cajamar/SP',
    paymentTerms: '45 dias',
    active: true,
    productsCount: 3,
    createdAt: dDate(-120),
  },
]

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Shampoo Wella Fusion',
    description: 'Shampoo reparador para cabelos danificados',
    sku: 'SKU-WF-001',
    barcode: '7891234567890',
    categoryId: 'cat-1',
    brand: 'Wella',
    costPrice: 45.00,
    salePrice: 89.90,
    stock: 18,
    minStock: 5,
    unit: 'un',
    forSale: true,
    forInternalUse: false,
    active: true,
    supplierId: 'sup-1',
    createdAt: dDate(-90),
  },
  {
    id: 'prod-2',
    name: 'Condicionador Wella Fusion',
    sku: 'SKU-WF-002',
    categoryId: 'cat-1',
    brand: 'Wella',
    costPrice: 42.00,
    salePrice: 84.90,
    stock: 3,
    minStock: 5,
    unit: 'un',
    forSale: true,
    forInternalUse: true,
    active: true,
    supplierId: 'sup-1',
    createdAt: dDate(-90),
  },
  {
    id: 'prod-3',
    name: 'Máscara Wella Color Touch',
    description: 'Máscara tonalizante semi-permanente',
    sku: 'SKU-WCT-003',
    categoryId: 'cat-1',
    brand: 'Wella',
    costPrice: 28.00,
    salePrice: 59.90,
    stock: 0,
    minStock: 3,
    unit: 'un',
    forSale: true,
    forInternalUse: true,
    active: true,
    supplierId: 'sup-1',
    variations: [
      { id: 'var-1', name: '5.0 Castanho Claro', sku: 'SKU-WCT-003-50', stock: 0 },
      { id: 'var-2', name: '6.7 Louro Escuro', sku: 'SKU-WCT-003-67', stock: 0 },
      { id: 'var-3', name: '8.0 Louro Claro', sku: 'SKU-WCT-003-80', stock: 0 },
    ],
    createdAt: dDate(-120),
  },
  {
    id: 'prod-4',
    name: 'Óleo de Argan Moroccan Oil',
    description: 'Óleo finalizador para todos os tipos de cabelo',
    sku: 'SKU-MO-004',
    categoryId: 'cat-1',
    brand: 'Moroccan Oil',
    costPrice: 110.00,
    salePrice: 219.90,
    stock: 7,
    minStock: 3,
    unit: 'un',
    forSale: true,
    forInternalUse: false,
    active: true,
    supplierId: 'sup-2',
    createdAt: dDate(-60),
  },
  {
    id: 'prod-5',
    name: 'Tônico Facial L\'Oréal Glycolic',
    sku: 'SKU-LG-005',
    categoryId: 'cat-2',
    brand: 'L\'Oréal',
    costPrice: 38.00,
    salePrice: 79.90,
    stock: 12,
    minStock: 4,
    unit: 'un',
    forSale: true,
    forInternalUse: false,
    active: true,
    supplierId: 'sup-2',
    createdAt: dDate(-75),
  },
  {
    id: 'prod-6',
    name: 'Sérum Vitamina C Natura',
    description: 'Sérum antioxidante com vitamina C pura',
    sku: 'SKU-NVC-006',
    categoryId: 'cat-2',
    brand: 'Natura',
    costPrice: 65.00,
    salePrice: 128.00,
    stock: 2,
    minStock: 4,
    unit: 'un',
    forSale: true,
    forInternalUse: false,
    active: true,
    supplierId: 'sup-3',
    createdAt: dDate(-45),
  },
  {
    id: 'prod-7',
    name: 'Esmalte Risqué Cores',
    sku: 'SKU-RQ-007',
    categoryId: 'cat-3',
    brand: 'Risqué',
    costPrice: 4.50,
    salePrice: 12.90,
    stock: 45,
    minStock: 10,
    unit: 'un',
    forSale: true,
    forInternalUse: true,
    active: true,
    variations: [
      { id: 'var-4', name: 'Rosa Ballet', sku: 'SKU-RQ-007-RB', stock: 15 },
      { id: 'var-5', name: 'Vermelho Paixão', sku: 'SKU-RQ-007-VP', stock: 18 },
      { id: 'var-6', name: 'Nude Clássico', sku: 'SKU-RQ-007-NC', stock: 12 },
    ],
    createdAt: dDate(-30),
  },
  {
    id: 'prod-8',
    name: 'Perfume Natura Essencial',
    sku: 'SKU-NE-008',
    categoryId: 'cat-4',
    brand: 'Natura',
    costPrice: 95.00,
    salePrice: 189.90,
    stock: 5,
    minStock: 3,
    unit: 'un',
    forSale: true,
    forInternalUse: false,
    active: true,
    supplierId: 'sup-3',
    createdAt: dDate(-60),
  },
  {
    id: 'prod-9',
    name: 'Luva Descartável M (caixa 100un)',
    sku: 'SKU-LV-009',
    categoryId: 'cat-5',
    brand: 'Supermax',
    costPrice: 22.00,
    salePrice: 22.00,
    stock: 4,
    minStock: 5,
    unit: 'un',
    forSale: false,
    forInternalUse: true,
    active: true,
    createdAt: dDate(-20),
  },
  {
    id: 'prod-10',
    name: 'Papel Alumínio 30cm × 50m',
    sku: 'SKU-PA-010',
    categoryId: 'cat-5',
    brand: 'BrandFoil',
    costPrice: 18.00,
    salePrice: 18.00,
    stock: 8,
    minStock: 3,
    unit: 'un',
    forSale: false,
    forInternalUse: true,
    active: true,
    createdAt: dDate(-30),
  },
  {
    id: 'prod-11',
    name: 'Creme Pós-Química Wella',
    sku: 'SKU-WPQ-011',
    categoryId: 'cat-1',
    brand: 'Wella',
    costPrice: 35.00,
    salePrice: 69.90,
    stock: 0,
    minStock: 2,
    unit: 'un',
    forSale: false,
    forInternalUse: true,
    active: true,
    supplierId: 'sup-1',
    createdAt: dDate(-50),
  },
  {
    id: 'prod-12',
    name: 'Hidratante Corporal Natura Tododia',
    sku: 'SKU-NTD-012',
    categoryId: 'cat-2',
    brand: 'Natura',
    costPrice: 28.00,
    salePrice: 58.90,
    stock: 9,
    minStock: 4,
    unit: 'un',
    forSale: true,
    forInternalUse: false,
    active: false,
    supplierId: 'sup-3',
    createdAt: dDate(-180),
  },
]

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Shampoo Wella Fusion',
    type: 'ENTRY',
    reason: 'PURCHASE',
    qty: 12,
    qtyBefore: 6,
    qtyAfter: 18,
    unitCost: 45.00,
    totalCost: 540.00,
    supplierId: 'sup-1',
    supplierName: 'Wella Distribuidora SP',
    invoiceNumber: 'NF-2024-0042',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-2, '14:30'),
  },
  {
    id: 'mov-2',
    productId: 'prod-7',
    productName: 'Esmalte Risqué Cores',
    type: 'EXIT',
    reason: 'SALE',
    qty: -3,
    qtyBefore: 48,
    qtyAfter: 45,
    createdBy: 'Sistema PDV',
    createdAt: dDateTime(-1, '10:15'),
    saleId: 'sale-0021',
  },
  {
    id: 'mov-3',
    productId: 'prod-3',
    productName: 'Máscara Wella Color Touch',
    type: 'EXIT',
    reason: 'SERVICE_USE',
    qty: -2,
    qtyBefore: 2,
    qtyAfter: 0,
    createdBy: 'Sistema',
    createdAt: dDateTime(-1, '11:00'),
    appointmentId: 'apt-0055',
  },
  {
    id: 'mov-4',
    productId: 'prod-9',
    productName: 'Luva Descartável M (caixa 100un)',
    type: 'ADJUSTMENT',
    reason: 'ADJUSTMENT',
    qty: -1,
    qtyBefore: 5,
    qtyAfter: 4,
    notes: 'Ajuste após inventário — caixa danificada',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-3, '09:00'),
  },
  {
    id: 'mov-5',
    productId: 'prod-2',
    productName: 'Condicionador Wella Fusion',
    type: 'ENTRY',
    reason: 'PURCHASE',
    qty: 10,
    qtyBefore: 0,
    qtyAfter: 10,
    unitCost: 42.00,
    totalCost: 420.00,
    supplierId: 'sup-1',
    supplierName: 'Wella Distribuidora SP',
    invoiceNumber: 'NF-2024-0038',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-7, '15:00'),
  },
  {
    id: 'mov-6',
    productId: 'prod-2',
    productName: 'Condicionador Wella Fusion',
    type: 'EXIT',
    reason: 'SALE',
    qty: -7,
    qtyBefore: 10,
    qtyAfter: 3,
    createdBy: 'Sistema PDV',
    createdAt: dDateTime(-5, '16:45'),
  },
  {
    id: 'mov-7',
    productId: 'prod-6',
    productName: 'Sérum Vitamina C Natura',
    type: 'EXIT',
    reason: 'SALE',
    qty: -2,
    qtyBefore: 4,
    qtyAfter: 2,
    createdBy: 'Sistema PDV',
    createdAt: dDateTime(-4, '12:00'),
  },
  {
    id: 'mov-8',
    productId: 'prod-4',
    productName: 'Óleo de Argan Moroccan Oil',
    type: 'ENTRY',
    reason: 'PURCHASE',
    qty: 5,
    qtyBefore: 2,
    qtyAfter: 7,
    unitCost: 110.00,
    totalCost: 550.00,
    supplierId: 'sup-2',
    supplierName: 'L\'Oréal Brasil LTDA',
    invoiceNumber: 'NF-2024-0041',
    createdBy: 'Ana Lima',
    createdAt: dDateTime(-6, '10:00'),
  },
  {
    id: 'mov-9',
    productId: 'prod-11',
    productName: 'Creme Pós-Química Wella',
    type: 'EXIT',
    reason: 'SERVICE_USE',
    qty: -3,
    qtyBefore: 3,
    qtyAfter: 0,
    createdBy: 'Sistema',
    createdAt: dDateTime(-8, '14:00'),
    notes: 'Usado em 3 procedimentos de coloração',
  },
  {
    id: 'mov-10',
    productId: 'prod-5',
    productName: 'Tônico Facial L\'Oréal Glycolic',
    type: 'ENTRY',
    reason: 'PURCHASE',
    qty: 6,
    qtyBefore: 6,
    qtyAfter: 12,
    unitCost: 38.00,
    totalCost: 228.00,
    supplierId: 'sup-2',
    supplierName: 'L\'Oréal Brasil LTDA',
    invoiceNumber: 'NF-2024-0039',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-10, '11:30'),
  },
  {
    id: 'mov-11',
    productId: 'prod-8',
    productName: 'Perfume Natura Essencial',
    type: 'EXIT',
    reason: 'SALE',
    qty: -1,
    qtyBefore: 6,
    qtyAfter: 5,
    createdBy: 'Sistema PDV',
    createdAt: dDateTime(-3, '17:20'),
  },
  {
    id: 'mov-12',
    productId: 'prod-10',
    productName: 'Papel Alumínio 30cm × 50m',
    type: 'EXIT',
    reason: 'SERVICE_USE',
    qty: -2,
    qtyBefore: 10,
    qtyAfter: 8,
    createdBy: 'Sistema',
    createdAt: dDateTime(-5, '09:45'),
  },
  {
    id: 'mov-13',
    productId: 'prod-7',
    productName: 'Esmalte Risqué Cores',
    type: 'LOSS',
    reason: 'LOSS',
    qty: -3,
    qtyBefore: 51,
    qtyAfter: 48,
    notes: 'Frascos quebrados durante transporte',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-15, '08:00'),
  },
  {
    id: 'mov-14',
    productId: 'prod-1',
    productName: 'Shampoo Wella Fusion',
    type: 'ENTRY',
    reason: 'RETURN_SUPPLIER',
    qty: 2,
    qtyBefore: 4,
    qtyAfter: 6,
    supplierId: 'sup-1',
    supplierName: 'Wella Distribuidora SP',
    notes: 'Devolução de produto com defeito — nota de crédito emitida',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-20, '13:00'),
  },
  {
    id: 'mov-15',
    productId: 'prod-9',
    productName: 'Luva Descartável M (caixa 100un)',
    type: 'ENTRY',
    reason: 'PURCHASE',
    qty: 10,
    qtyBefore: 0,
    qtyAfter: 10,
    unitCost: 22.00,
    totalCost: 220.00,
    createdBy: 'Ana Lima',
    createdAt: dDateTime(-12, '16:00'),
  },
  {
    id: 'mov-16',
    productId: 'prod-9',
    productName: 'Luva Descartável M (caixa 100un)',
    type: 'EXIT',
    reason: 'SERVICE_USE',
    qty: -5,
    qtyBefore: 10,
    qtyAfter: 5,
    createdBy: 'Sistema',
    createdAt: dDateTime(-8, '09:00'),
  },
  {
    id: 'mov-17',
    productId: 'prod-6',
    productName: 'Sérum Vitamina C Natura',
    type: 'ENTRY',
    reason: 'PURCHASE',
    qty: 4,
    qtyBefore: 0,
    qtyAfter: 4,
    unitCost: 65.00,
    totalCost: 260.00,
    supplierId: 'sup-3',
    supplierName: 'Natura Cosméticos',
    invoiceNumber: 'NF-2024-0035',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-25, '10:30'),
  },
  {
    id: 'mov-18',
    productId: 'prod-3',
    productName: 'Máscara Wella Color Touch',
    type: 'ENTRY',
    reason: 'PURCHASE',
    qty: 6,
    qtyBefore: 0,
    qtyAfter: 6,
    unitCost: 28.00,
    totalCost: 168.00,
    supplierId: 'sup-1',
    supplierName: 'Wella Distribuidora SP',
    invoiceNumber: 'NF-2024-0030',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-28, '14:00'),
  },
  {
    id: 'mov-19',
    productId: 'prod-3',
    productName: 'Máscara Wella Color Touch',
    type: 'EXIT',
    reason: 'SERVICE_USE',
    qty: -4,
    qtyBefore: 6,
    qtyAfter: 2,
    createdBy: 'Sistema',
    createdAt: dDateTime(-20, '11:00'),
  },
  {
    id: 'mov-20',
    productId: 'prod-12',
    productName: 'Hidratante Corporal Natura Tododia',
    type: 'ADJUSTMENT',
    reason: 'ADJUSTMENT',
    qty: 9,
    qtyBefore: 0,
    qtyAfter: 9,
    notes: 'Produto reativado — estoque inicial registrado',
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(-30, '09:00'),
  },
]

// ── Estado singleton ──────────────────────────────────────────────────────────

const products = ref<Product[]>([])
const categories = ref<ProductCategory[]>([])
const suppliers = ref<Supplier[]>([])
const movements = ref<StockMovement[]>([])
const loading = ref(false)
const initialized = ref(false)

// ── KPIs ──────────────────────────────────────────────────────────────────────

const kpi = computed(() => ({
  totalProducts: products.value.filter(p => p.active).length,
  totalStockValue: products.value.reduce((s, p) => s + p.stock * p.costPrice, 0),
  lowStockCount: products.value.filter(p => p.active && p.stock > 0 && p.stock <= p.minStock).length,
  outOfStockCount: products.value.filter(p => p.active && p.stock === 0).length,
}))

// ── Funções ───────────────────────────────────────────────────────────────────

async function fetchAll(): Promise<void> {
  if (initialized.value) return
  loading.value = true
  await new Promise(r => setTimeout(r, 500))
  products.value = MOCK_PRODUCTS.map(p => ({ ...p }))
  categories.value = MOCK_CATEGORIES.map(c => ({ ...c }))
  suppliers.value = MOCK_SUPPLIERS.map(s => ({ ...s }))
  movements.value = MOCK_MOVEMENTS.map(m => ({ ...m }))
  initialized.value = true
  loading.value = false
}

function addProduct(p: Omit<Product, 'id' | 'createdAt'>): void {
  const id = 'prod-' + Date.now()
  products.value.unshift({ ...p, id, createdAt: dDate(0) })
  // Atualiza productsCount do fornecedor
  if (p.supplierId) {
    const sup = suppliers.value.find(s => s.id === p.supplierId)
    if (sup) sup.productsCount++
  }
}

function updateProduct(id: string, updates: Partial<Product>): void {
  const idx = products.value.findIndex(p => p.id === id)
  if (idx !== -1) products.value[idx] = { ...products.value[idx], ...updates }
}

function toggleProductActive(id: string): void {
  const p = products.value.find(x => x.id === id)
  if (p) p.active = !p.active
}

function adjustStock(productId: string, newQty: number, reason: string, notes?: string): void {
  const p = products.value.find(x => x.id === productId)
  if (!p) return
  const diff = newQty - p.stock
  if (diff === 0) return
  const mov: StockMovement = {
    id: 'mov-' + Date.now(),
    productId,
    productName: p.name,
    type: 'ADJUSTMENT',
    reason: 'ADJUSTMENT',
    qty: diff,
    qtyBefore: p.stock,
    qtyAfter: newQty,
    notes: notes || reason,
    createdBy: 'Luiz Matos',
    createdAt: dDateTime(0, new Date().toTimeString().slice(0, 5)),
  }
  p.stock = newQty
  movements.value.unshift(mov)
}

function registerEntry(
  entry: Omit<PurchaseEntry, 'id'>,
  items: { productId: string; qty: number; unitCost: number }[],
): void {
  items.forEach(item => {
    const p = products.value.find(x => x.id === item.productId)
    if (!p) return
    const mov: StockMovement = {
      id: 'mov-' + Date.now() + '-' + item.productId,
      productId: item.productId,
      productName: p.name,
      type: 'ENTRY',
      reason: 'PURCHASE',
      qty: item.qty,
      qtyBefore: p.stock,
      qtyAfter: p.stock + item.qty,
      unitCost: item.unitCost,
      totalCost: item.qty * item.unitCost,
      supplierId: entry.supplierId,
      supplierName: entry.supplierName,
      invoiceNumber: entry.invoiceNumber,
      createdBy: 'Luiz Matos',
      createdAt: dDateTime(0, new Date().toTimeString().slice(0, 5)),
    }
    p.stock += item.qty
    movements.value.unshift(mov)
  })
}

function addSupplier(s: Omit<Supplier, 'id' | 'createdAt' | 'productsCount'>): void {
  suppliers.value.unshift({ ...s, id: 'sup-' + Date.now(), productsCount: 0, createdAt: dDate(0) })
}

function updateSupplier(id: string, updates: Partial<Supplier>): void {
  const idx = suppliers.value.findIndex(s => s.id === id)
  if (idx !== -1) suppliers.value[idx] = { ...suppliers.value[idx], ...updates }
}

// ── Composable ────────────────────────────────────────────────────────────────

export const useInventory = () => {
  return {
    products,
    categories,
    suppliers,
    movements,
    loading,
    kpi,
    fetchAll,
    addProduct,
    updateProduct,
    toggleProductActive,
    adjustStock,
    registerEntry,
    addSupplier,
    updateSupplier,
  }
}
