<script setup lang="ts">
import type { Product, Supplier, StockMovement, ProductCategory, ProductVariation, UnitOfMeasure, MovementType } from '../../composables/useInventory'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const route = useRoute()
const router = useRouter()

// ── Composable ────────────────────────────────────────────────────────────────

const {
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
} = useInventory()

onMounted(() => fetchAll())

// ── Tabs ──────────────────────────────────────────────────────────────────────

const tabs = [
  { key: 'produtos', label: 'Produtos', icon: 'i-lucide-package' },
  { key: 'movimentacoes', label: 'Movimentações', icon: 'i-lucide-arrow-left-right' },
  { key: 'fornecedores', label: 'Fornecedores', icon: 'i-lucide-truck' },
  { key: 'alertas', label: 'Alertas', icon: 'i-lucide-bell' },
]
const activeTab = ref<string>((route.query.tab as string) || 'produtos')
watch(activeTab, v => router.replace({ query: { tab: v } }))

// ── Formatação ────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtN = (v: number) => v.toLocaleString('pt-BR')

// ── Helpers de estoque ────────────────────────────────────────────────────────

const stockBarWidth = (p: Product) => {
  if (p.minStock === 0) return p.stock > 0 ? 100 : 0
  return Math.min(100, (p.stock / (p.minStock * 2)) * 100)
}
const stockBarColor = (p: Product) => {
  if (p.stock === 0) return '#EF4444'
  if (p.stock <= p.minStock) return '#F59E0B'
  return '#10B981'
}
const stockStatus = (p: Product) => {
  if (!p.active) return { label: 'Inativo', variant: 'neutral' as const }
  if (p.stock === 0) return { label: 'Sem estoque', variant: 'danger' as const }
  if (p.stock <= p.minStock) return { label: 'Estoque baixo', variant: 'warning' as const }
  return { label: 'Ativo', variant: 'success' as const }
}

const getCategoryColor = (categoryId: string) => {
  return categories.value.find(c => c.id === categoryId)?.color || '#64748B'
}
const getCategoryName = (categoryId: string) => {
  return categories.value.find(c => c.id === categoryId)?.name || '—'
}
const getSupplierName = (supplierId?: string) => {
  if (!supplierId) return '—'
  return suppliers.value.find(s => s.id === supplierId)?.name || '—'
}

// ── Tab Produtos — filtros + view ─────────────────────────────────────────────

const productSearch = ref('')
const productCategoryFilter = ref('all')
const productStatusFilter = ref('all')
const viewMode = ref<'table' | 'grid'>('table')

const filteredProducts = computed(() => {
  const q = productSearch.value.toLowerCase()
  return products.value.filter(p => {
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !(p.barcode || '').includes(q)) return false
    if (productCategoryFilter.value !== 'all' && p.categoryId !== productCategoryFilter.value) return false
    if (productStatusFilter.value !== 'all') {
      if (productStatusFilter.value === 'active' && (!p.active || p.stock > p.minStock)) return false
      if (productStatusFilter.value === 'inactive' && p.active) return false
      if (productStatusFilter.value === 'low' && (p.stock === 0 || p.stock > p.minStock || !p.active)) return false
      if (productStatusFilter.value === 'out' && (p.stock !== 0 || !p.active)) return false
    }
    return true
  })
})

const categoryOptions = computed(() => [
  { label: 'Todas as categorias', value: 'all' },
  ...categories.value.map(c => ({ label: c.name, value: c.id })),
])
const statusOptions = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
  { label: 'Estoque baixo', value: 'low' },
  { label: 'Sem estoque', value: 'out' },
]

const productTableColumns = [
  { key: 'produto', label: 'Produto' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'marca', label: 'Marca' },
  { key: 'custo', label: 'Custo', align: 'right' as const },
  { key: 'venda', label: 'Venda', align: 'right' as const },
  { key: 'margem', label: 'Margem', align: 'right' as const },
  { key: 'estoque', label: 'Estoque', align: 'right' as const },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: '' },
]

const productTableRows = computed(() =>
  filteredProducts.value.map(p => ({
    ...p,
    produto: p.name,
    categoria: getCategoryName(p.categoryId),
    marca: p.brand || '—',
    custo: p.costPrice,
    venda: p.salePrice,
    margem: p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice * 100) : 0,
    estoque: p.stock,
    status: stockStatus(p).label,
  })),
)

const totalStockValueFiltered = computed(() =>
  filteredProducts.value.reduce((s, p) => s + p.stock * p.costPrice, 0),
)

// ── Menu 3-dot ────────────────────────────────────────────────────────────────

const activeMenuId = ref<string | null>(null)

const toggleMenu = (id: string, e: MouseEvent) => {
  e.stopPropagation()
  activeMenuId.value = activeMenuId.value === id ? null : id
}

const closeMenu = () => { activeMenuId.value = null }

onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))

// ── Drawer produto ────────────────────────────────────────────────────────────

const productDrawerOpen = ref(false)
const selectedProduct = ref<Product | null>(null)

const openProductDrawer = (row: Record<string, unknown>) => {
  const p = products.value.find(x => x.id === (row as Product).id)
  if (p) { selectedProduct.value = p; productDrawerOpen.value = true }
}

const productMovements = computed(() => {
  if (!selectedProduct.value) return []
  return movements.value.filter(m => m.productId === selectedProduct.value!.id).slice(0, 5)
})

const productMargin = computed(() => {
  const p = selectedProduct.value
  if (!p || p.salePrice === 0) return '0%'
  const m = (p.salePrice - p.costPrice) / p.salePrice * 100
  return m.toFixed(1) + '%'
})

// ── MODAL: Novo/Editar Produto ────────────────────────────────────────────────

const productModalOpen = ref(false)
const productModalMode = ref<'new' | 'edit'>('new')

interface ProductForm {
  name: string
  description: string
  sku: string
  barcode: string
  categoryId: string
  newCategoryName: string
  showNewCategory: boolean
  brand: string
  costPrice: number | null
  salePrice: number | null
  stock: number | null
  minStock: number
  unit: UnitOfMeasure
  forSale: boolean
  forInternalUse: boolean
  active: boolean
  supplierId: string
  hasVariations: boolean
  variations: ProductVariation[]
}

const defaultProductForm = (): ProductForm => ({
  name: '',
  description: '',
  sku: '',
  barcode: '',
  categoryId: '',
  newCategoryName: '',
  showNewCategory: false,
  brand: '',
  costPrice: null,
  salePrice: null,
  stock: null,
  minStock: 0,
  unit: 'un',
  forSale: true,
  forInternalUse: false,
  active: true,
  supplierId: '',
  hasVariations: false,
  variations: [],
})

const productForm = ref<ProductForm>(defaultProductForm())
const editingProductId = ref<string | null>(null)

const liveMargem = computed(() => {
  const custo = productForm.value.costPrice ?? 0
  const venda = productForm.value.salePrice ?? 0
  if (venda === 0) return null
  return ((venda - custo) / venda * 100)
})

const liveMargemColor = computed(() => {
  const m = liveMargem.value
  if (m === null) return 'var(--zima-text-muted)'
  if (m >= 30) return '#10B981'
  if (m >= 15) return '#F59E0B'
  return '#EF4444'
})

const margemColor = (pct: number) => {
  if (pct >= 30) return '#10B981'
  if (pct >= 15) return '#F59E0B'
  return '#EF4444'
}

const generateSku = () => {
  productForm.value.sku = 'SKU-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

const brandSuggestions = computed(() => {
  const brands = new Set(products.value.map(p => p.brand).filter(Boolean) as string[])
  return Array.from(brands)
})

const unitOptions: { label: string; value: UnitOfMeasure }[] = [
  { label: 'Unidade (un)', value: 'un' },
  { label: 'Mililitros (ml)', value: 'ml' },
  { label: 'Gramas (g)', value: 'g' },
  { label: 'Quilogramas (kg)', value: 'kg' },
  { label: 'Litros (L)', value: 'L' },
]

const supplierOptions = computed(() => [
  { label: 'Nenhum fornecedor', value: '' },
  ...suppliers.value.map(s => ({ label: s.name, value: s.id })),
])

const openNewProduct = (preselectedProductId?: string) => {
  productForm.value = defaultProductForm()
  editingProductId.value = null
  productModalMode.value = 'new'
  productModalOpen.value = true
}

const openEditProduct = (p: Product) => {
  editingProductId.value = p.id
  productForm.value = {
    name: p.name,
    description: p.description || '',
    sku: p.sku,
    barcode: p.barcode || '',
    categoryId: p.categoryId,
    newCategoryName: '',
    showNewCategory: false,
    brand: p.brand || '',
    costPrice: p.costPrice,
    salePrice: p.salePrice,
    stock: p.stock,
    minStock: p.minStock,
    unit: p.unit,
    forSale: p.forSale,
    forInternalUse: p.forInternalUse,
    active: p.active,
    supplierId: p.supplierId || '',
    hasVariations: !!(p.variations && p.variations.length > 0),
    variations: p.variations ? p.variations.map(v => ({ ...v })) : [],
  }
  productModalMode.value = 'edit'
  productModalOpen.value = true
}

const addVariationRow = () => {
  productForm.value.variations.push({
    id: 'var-' + Date.now(),
    name: '',
    sku: '',
    stock: 0,
  })
}

const removeVariation = (idx: number) => {
  productForm.value.variations.splice(idx, 1)
}

const saveProduct = () => {
  const f = productForm.value
  if (!f.name || !f.salePrice || !f.categoryId) {
    toast.error('Preencha os campos obrigatórios')
    return
  }
  const data = {
    name: f.name,
    description: f.description || undefined,
    sku: f.sku || 'SKU-' + Date.now(),
    barcode: f.barcode || undefined,
    categoryId: f.categoryId,
    brand: f.brand || undefined,
    costPrice: f.costPrice ?? 0,
    salePrice: f.salePrice ?? 0,
    stock: f.stock ?? 0,
    minStock: f.minStock,
    unit: f.unit,
    forSale: f.forSale,
    forInternalUse: f.forInternalUse,
    active: f.active,
    supplierId: f.supplierId || undefined,
    variations: f.hasVariations ? f.variations : undefined,
  }
  if (productModalMode.value === 'new') {
    addProduct(data)
    toast.success('Produto cadastrado com sucesso!')
  } else if (editingProductId.value) {
    updateProduct(editingProductId.value, data)
    toast.success('Produto atualizado!')
  }
  productModalOpen.value = false
}

// ── MODAL: Entrada de Mercadoria ──────────────────────────────────────────────

const entryOpen = ref(false)

interface EntryItem {
  productId: string
  productName: string
  qty: number
  unitCost: number
}

interface EntryForm {
  supplierId: string
  invoiceNumber: string
  date: string
  notes: string
  items: EntryItem[]
}

const defaultEntryForm = (): EntryForm => ({
  supplierId: '',
  invoiceNumber: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [{ productId: '', productName: '', qty: 1, unitCost: 0 }],
})

const entryForm = ref<EntryForm>(defaultEntryForm())

const entryTotal = computed(() =>
  entryForm.value.items.reduce((s, i) => s + (i.qty || 0) * (i.unitCost || 0), 0),
)

const openEntry = (p?: Product) => {
  entryForm.value = defaultEntryForm()
  if (p) {
    entryForm.value.items[0] = { productId: p.id, productName: p.name, qty: 1, unitCost: p.costPrice }
  }
  entryOpen.value = true
}

const addEntryRow = () => {
  entryForm.value.items.push({ productId: '', productName: '', qty: 1, unitCost: 0 })
}

const removeEntryRow = (idx: number) => {
  if (entryForm.value.items.length > 1) entryForm.value.items.splice(idx, 1)
}

const onEntryProductSelect = (idx: number, productId: string) => {
  const p = products.value.find(x => x.id === productId)
  if (p) {
    entryForm.value.items[idx].productId = p.id
    entryForm.value.items[idx].productName = p.name
    entryForm.value.items[idx].unitCost = p.costPrice
  }
}

const confirmEntry = () => {
  const f = entryForm.value
  const validItems = f.items.filter(i => i.productId && i.qty > 0)
  if (validItems.length === 0) {
    toast.error('Adicione pelo menos um produto com quantidade')
    return
  }
  const supplierName = f.supplierId
    ? (suppliers.value.find(s => s.id === f.supplierId)?.name || 'Fornecedor')
    : 'Sem fornecedor'
  registerEntry(
    {
      supplierId: f.supplierId,
      supplierName,
      invoiceNumber: f.invoiceNumber || 'S/N',
      date: f.date,
      items: validItems.map(i => ({
        productId: i.productId,
        productName: i.productName,
        qty: i.qty,
        unitCost: i.unitCost,
        total: i.qty * i.unitCost,
      })),
      totalValue: entryTotal.value,
      status: 'RECEIVED',
      notes: f.notes || undefined,
    },
    validItems.map(i => ({ productId: i.productId, qty: i.qty, unitCost: i.unitCost })),
  )
  toast.success('Entrada registrada! Estoque atualizado.')
  entryOpen.value = false
}

// ── MODAL: Ajuste de Estoque ──────────────────────────────────────────────────

const adjustOpen = ref(false)
const adjustProductId = ref('')
const adjustNewQty = ref<number | null>(null)
const adjustReason = ref('Inventário físico')
const adjustNotes = ref('')

const adjustProduct = computed(() => products.value.find(p => p.id === adjustProductId.value) || null)
const adjustDiff = computed(() => {
  if (!adjustProduct.value || adjustNewQty.value === null) return 0
  return adjustNewQty.value - adjustProduct.value.stock
})

const adjustReasonOptions = [
  { label: 'Inventário físico', value: 'Inventário físico' },
  { label: 'Correção de lançamento', value: 'Correção de lançamento' },
  { label: 'Perda / avaria', value: 'Perda / avaria' },
  { label: 'Uso interno não registrado', value: 'Uso interno não registrado' },
  { label: 'Outro', value: 'Outro' },
]

const productSelectOptions = computed(() =>
  products.value.filter(p => p.active).map(p => ({ label: p.name + ' (atual: ' + p.stock + ')', value: p.id })),
)

const openAdjust = (p?: Product) => {
  adjustProductId.value = p?.id || ''
  adjustNewQty.value = p ? p.stock : null
  adjustReason.value = 'Inventário físico'
  adjustNotes.value = ''
  adjustOpen.value = true
}

const confirmAdjust = () => {
  if (!adjustProduct.value || adjustNewQty.value === null) {
    toast.error('Selecione um produto e informe a quantidade real')
    return
  }
  if (adjustNewQty.value < 0) {
    toast.error('A quantidade não pode ser negativa')
    return
  }
  adjustStock(adjustProduct.value.id, adjustNewQty.value, adjustReason.value, adjustNotes.value || undefined)
  toast.success('Ajuste de estoque registrado!')
  adjustOpen.value = false
}

// ── Tab Movimentações ─────────────────────────────────────────────────────────

const movTypeFilter = ref('all')
const movProductFilter = ref('all')
const movDateFrom = ref('')
const movDateTo = ref('')

const movTypeOptions = [
  { label: 'Todos os tipos', value: 'all' },
  { label: 'Entrada', value: 'ENTRY' },
  { label: 'Saída', value: 'EXIT' },
  { label: 'Ajuste', value: 'ADJUSTMENT' },
  { label: 'Perda', value: 'LOSS' },
  { label: 'Devolução', value: 'RETURN' },
]

const movProductOptions = computed(() => [
  { label: 'Todos os produtos', value: 'all' },
  ...products.value.map(p => ({ label: p.name, value: p.id })),
])

const filteredMovements = computed(() => {
  return movements.value.filter(m => {
    if (movTypeFilter.value !== 'all' && m.type !== movTypeFilter.value) return false
    if (movProductFilter.value !== 'all' && m.productId !== movProductFilter.value) return false
    if (movDateFrom.value && m.createdAt.slice(0, 10) < movDateFrom.value) return false
    if (movDateTo.value && m.createdAt.slice(0, 10) > movDateTo.value) return false
    return true
  })
})

const movColumns = [
  { key: 'data', label: 'Data/Hora' },
  { key: 'produto', label: 'Produto' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'qty', label: 'Qtd', align: 'right' as const },
  { key: 'antes', label: 'Antes', align: 'right' as const },
  { key: 'depois', label: 'Depois', align: 'right' as const },
  { key: 'motivo', label: 'Motivo' },
  { key: 'responsavel', label: 'Responsável' },
]

const movRows = computed(() =>
  filteredMovements.value.map(m => ({
    ...m,
    data: m.createdAt,
    produto: m.productName,
    tipo: m.type,
    qty: m.qty,
    antes: m.qtyBefore,
    depois: m.qtyAfter,
    motivo: m.invoiceNumber ? 'NF: ' + m.invoiceNumber : (m.notes || '—'),
    responsavel: m.createdBy,
  })),
)

const movTypeConfig: Record<MovementType, { label: string; color: string; icon: string }> = {
  ENTRY: { label: 'Entrada', color: '#10B981', icon: 'i-lucide-arrow-down-circle' },
  EXIT: { label: 'Saída', color: '#EF4444', icon: 'i-lucide-arrow-up-circle' },
  ADJUSTMENT: { label: 'Ajuste', color: '#3B82F6', icon: 'i-lucide-sliders' },
  LOSS: { label: 'Perda', color: '#F59E0B', icon: 'i-lucide-alert-triangle' },
  RETURN: { label: 'Devolução', color: '#8B5CF6', icon: 'i-lucide-undo-2' },
}

// ── Tab Fornecedores ──────────────────────────────────────────────────────────

const supplierDrawerOpen = ref(false)
const selectedSupplier = ref<Supplier | null>(null)
const supplierModalOpen = ref(false)
const supplierModalMode = ref<'new' | 'edit'>('new')

interface SupplierForm {
  name: string
  cnpj: string
  contact: string
  phone: string
  email: string
  address: string
  paymentTerms: string
  notes: string
  active: boolean
}

const defaultSupplierForm = (): SupplierForm => ({
  name: '',
  cnpj: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  paymentTerms: '',
  notes: '',
  active: true,
})

const supplierForm = ref<SupplierForm>(defaultSupplierForm())
const editingSupplierId = ref<string | null>(null)

const supplierTableColumns = [
  { key: 'nome', label: 'Fornecedor' },
  { key: 'contato', label: 'Contato' },
  { key: 'produtos', label: 'Produtos', align: 'center' as const },
  { key: 'pagamento', label: 'Pagamento' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: '' },
]

const supplierTableRows = computed(() =>
  suppliers.value.map(s => ({
    ...s,
    nome: s.name,
    contato: s.contact,
    produtos: s.productsCount,
    pagamento: s.paymentTerms || '—',
    status: s.active ? 'Ativo' : 'Inativo',
  })),
)

const openSupplierDrawer = (row: Record<string, unknown>) => {
  const s = suppliers.value.find(x => x.id === (row as Supplier).id)
  if (s) { selectedSupplier.value = s; supplierDrawerOpen.value = true }
}

const supplierProducts = computed(() => {
  if (!selectedSupplier.value) return []
  return products.value.filter(p => p.supplierId === selectedSupplier.value!.id)
})

const supplierMovements = computed(() => {
  if (!selectedSupplier.value) return []
  return movements.value
    .filter(m => m.supplierId === selectedSupplier.value!.id && m.type === 'ENTRY')
    .slice(0, 5)
})

const openNewSupplier = () => {
  supplierForm.value = defaultSupplierForm()
  editingSupplierId.value = null
  supplierModalMode.value = 'new'
  supplierModalOpen.value = true
}

const openEditSupplier = (s: Supplier) => {
  editingSupplierId.value = s.id
  supplierForm.value = {
    name: s.name,
    cnpj: s.cnpj || '',
    contact: s.contact,
    phone: s.phone,
    email: s.email,
    address: s.address || '',
    paymentTerms: s.paymentTerms || '',
    notes: s.notes || '',
    active: s.active,
  }
  supplierModalMode.value = 'edit'
  supplierModalOpen.value = true
}

const maskCnpj = (e: Event) => {
  const input = e.target as HTMLInputElement
  let v = input.value.replace(/\D/g, '').slice(0, 14)
  if (v.length > 12) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5, 8) + '/' + v.slice(8, 12) + '-' + v.slice(12)
  else if (v.length > 8) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5, 8) + '/' + v.slice(8)
  else if (v.length > 5) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5)
  else if (v.length > 2) v = v.slice(0, 2) + '.' + v.slice(2)
  supplierForm.value.cnpj = v
}

const saveSupplier = () => {
  const f = supplierForm.value
  if (!f.name) { toast.error('Informe o nome do fornecedor'); return }
  if (supplierModalMode.value === 'new') {
    addSupplier({ name: f.name, cnpj: f.cnpj || undefined, contact: f.contact, phone: f.phone, email: f.email, address: f.address || undefined, paymentTerms: f.paymentTerms || undefined, notes: f.notes || undefined, active: f.active })
    toast.success('Fornecedor cadastrado!')
  } else if (editingSupplierId.value) {
    updateSupplier(editingSupplierId.value, { name: f.name, cnpj: f.cnpj || undefined, contact: f.contact, phone: f.phone, email: f.email, address: f.address || undefined, paymentTerms: f.paymentTerms || undefined, notes: f.notes || undefined, active: f.active })
    toast.success('Fornecedor atualizado!')
  }
  supplierModalOpen.value = false
}

// ── Tab Alertas ───────────────────────────────────────────────────────────────

const outOfStockProducts = computed(() => products.value.filter(p => p.active && p.stock === 0))
const lowStockProducts = computed(() => products.value.filter(p => p.active && p.stock > 0 && p.stock <= p.minStock))

const reorderColumns = [
  { key: 'produto', label: 'Produto' },
  { key: 'atual', label: 'Atual', align: 'right' as const },
  { key: 'minimo', label: 'Mínimo', align: 'right' as const },
  { key: 'sugerido', label: 'Sugerido', align: 'right' as const },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'acao', label: '' },
]

const reorderRows = computed(() =>
  [...outOfStockProducts.value, ...lowStockProducts.value].map(p => ({
    ...p,
    produto: p.name,
    atual: p.stock,
    minimo: p.minStock,
    sugerido: Math.max(1, p.minStock * 3 - p.stock),
    fornecedor: getSupplierName(p.supplierId),
    acao: p.id,
  })),
)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 :style="{ fontSize: '24px', fontWeight: '600', color: 'var(--zima-text-primary)', marginBottom: '4px' }">
          Estoque e Produtos
        </h1>
        <p :style="{ fontSize: '14px', color: 'var(--zima-text-muted)' }">
          Gerencie produtos, entradas e movimentações de estoque
        </p>
      </div>
      <div class="flex items-center gap-2">
        <ZimaButton variant="ghost" size="sm" @click="openAdjust()">
          <Icon name="i-lucide-sliders" style="width:14px;height:14px;margin-right:6px;" />
          Ajuste de Estoque
        </ZimaButton>
        <ZimaButton variant="ghost" size="sm" @click="openEntry()">
          <Icon name="i-lucide-truck" style="width:14px;height:14px;margin-right:6px;" />
          Entrada de Mercadoria
        </ZimaButton>
        <ZimaButton size="sm" @click="openNewProduct()">
          <Icon name="i-lucide-plus" style="width:14px;height:14px;margin-right:6px;" />
          Novo Produto
        </ZimaButton>
      </div>
    </div>

    <!-- Sub-tabs -->
    <div style="border-bottom: 1px solid var(--zima-border-divider); display: flex; gap: 4px; margin-bottom: 24px;">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        style="padding: 10px 16px; font-size: 13px; font-weight: 500; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 150ms; white-space: nowrap; display: flex; align-items: center; gap: 6px;"
        :style="{
          color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
          borderBottomColor: activeTab === tab.key ? 'var(--zima-blue-core)' : 'transparent',
          marginBottom: '-1px',
        }"
        @click="activeTab = tab.key"
      >
        <Icon :name="tab.icon" style="width:15px;height:15px;" />
        {{ tab.label }}
        <span
          v-if="tab.key === 'alertas' && (outOfStockProducts.length + lowStockProducts.length) > 0"
          :style="{ background: '#EF4444', color: '#fff', borderRadius: '9999px', fontSize: '11px', padding: '1px 6px', lineHeight: '1.4' }"
        >
          {{ outOfStockProducts.length + lowStockProducts.length }}
        </span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- TAB: PRODUTOS -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'produtos'">
      <!-- KPIs -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <ZimaKpiCard
          label="Produtos Ativos"
          :value="String(kpi.totalProducts)"
          icon="i-lucide-package"
          :loading="loading"
        />
        <ZimaKpiCard
          label="Valor em Estoque"
          :value="fmt(kpi.totalStockValue)"
          icon="i-lucide-dollar-sign"
          :loading="loading"
        />
        <ZimaKpiCard
          label="Estoque Baixo"
          :value="String(kpi.lowStockCount)"
          icon="i-lucide-alert-triangle"
          :loading="loading"
        />
        <ZimaKpiCard
          label="Sem Estoque"
          :value="String(kpi.outOfStockCount)"
          icon="i-lucide-package-x"
          :loading="loading"
        />
      </div>

      <!-- Filtros -->
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <div :style="{ position: 'relative', flex: '1', minWidth: '200px' }">
          <Icon
            name="i-lucide-search"
            :style="{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--zima-text-muted)', pointerEvents: 'none' }"
          />
          <input
            v-model="productSearch"
            placeholder="Buscar por nome, SKU, código de barras..."
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
        <ZimaSelect v-model="productCategoryFilter" :options="categoryOptions" style="min-width:160px;" />
        <ZimaSelect v-model="productStatusFilter" :options="statusOptions" style="min-width:160px;" />
        <!-- Toggle view -->
        <div
          class="flex"
          :style="{ background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', padding: '2px' }"
        >
          <button
            v-for="v in [{ key: 'table', icon: 'i-lucide-layout-list' }, { key: 'grid', icon: 'i-lucide-layout-grid' }]"
            :key="v.key"
            :style="{
              padding: '6px 10px',
              borderRadius: 'calc(var(--zima-radius-md) - 2px)',
              background: viewMode === v.key ? 'var(--zima-primary)' : 'transparent',
              color: viewMode === v.key ? '#fff' : 'var(--zima-text-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 150ms',
            }"
            @click="viewMode = v.key as 'table' | 'grid'"
          >
            <Icon :name="v.icon" style="width:15px;height:15px;" />
          </button>
        </div>
        <ZimaButton variant="ghost" size="sm" @click="toast.info('Exportando produtos...')">
          <Icon name="i-lucide-download" style="width:14px;height:14px;margin-right:6px;" />
          Exportar
        </ZimaButton>
      </div>

      <!-- Totalizador -->
      <p class="mb-3" :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">
        {{ filteredProducts.length }} produtos &middot; Valor: {{ fmt(totalStockValueFiltered) }}
      </p>

      <!-- Visualização Tabela -->
      <div v-if="viewMode === 'table'">
        <ZimaTable
          :columns="productTableColumns"
          :rows="productTableRows"
          :loading="loading"
          selectable
          row-clickable
          empty-title="Nenhum produto encontrado"
          empty-description="Tente ajustar os filtros ou cadastre um novo produto"
          empty-icon="i-lucide-package"
          @row-click="openProductDrawer"
        >
          <template #cell-produto="{ row }">
            <div class="flex items-center gap-3">
              <div
                :style="{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--zima-radius-md)',
                  background: 'var(--zima-bg-surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: '0',
                }"
              >
                <Icon name="i-lucide-package" :style="{ width: '18px', height: '18px', color: getCategoryColor((row as Product).categoryId) }" />
              </div>
              <div>
                <div :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ (row as Product).name }}</div>
                <div :style="{ fontSize: '12px', color: 'var(--zima-text-muted)' }">{{ (row as Product).sku }}</div>
              </div>
            </div>
          </template>

          <template #cell-categoria="{ row }">
            <span
              :style="{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '500',
                background: getCategoryColor((row as Product).categoryId) + '22',
                color: getCategoryColor((row as Product).categoryId),
              }"
            >
              {{ getCategoryName((row as Product).categoryId) }}
            </span>
          </template>

          <template #cell-marca="{ row }">
            <span :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">{{ (row as Product).brand || '—' }}</span>
          </template>

          <template #cell-custo="{ row }">
            <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">{{ fmt((row as Product).costPrice) }}</span>
          </template>

          <template #cell-venda="{ row }">
            <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--zima-text-primary)', fontWeight: '500' }">{{ fmt((row as Product).salePrice) }}</span>
          </template>

          <template #cell-margem="{ row }">
            <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: margemColor((row as unknown as { margem: number }).margem), fontWeight: '500' }">
              {{ (row as unknown as { margem: number }).margem.toFixed(1) }}%
            </span>
          </template>

          <template #cell-estoque="{ row }">
            <div class="flex items-center gap-2 justify-end">
              <span :style="{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '500', color: stockBarColor(row as Product) }">{{ (row as Product).stock }}</span>
              <div :style="{ width: '50px', height: '4px', background: 'rgba(148,163,184,0.15)', borderRadius: '2px', overflow: 'hidden' }">
                <div :style="{ width: stockBarWidth(row as Product) + '%', background: stockBarColor(row as Product), height: '100%', transition: 'width 300ms ease' }" />
              </div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <ZimaBadge
              :variant="stockStatus(row as Product).variant"
              :class="{ 'animate-pulse': (row as Product).active && (row as Product).stock > 0 && (row as Product).stock <= (row as Product).minStock }"
            >
              {{ stockStatus(row as Product).label }}
            </ZimaBadge>
          </template>

          <template #cell-acoes="{ row }">
            <div :style="{ position: 'relative' }" @click.stop>
              <button
                :style="{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--zima-radius-md)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--zima-text-muted)',
                }"
                @click="toggleMenu((row as Product).id, $event)"
              >
                <Icon name="i-lucide-more-horizontal" style="width:16px;height:16px;" />
              </button>
              <div
                v-if="activeMenuId === (row as Product).id"
                :style="{
                  position: 'absolute',
                  right: '0',
                  top: '32px',
                  background: 'var(--zima-bg-surface-2)',
                  border: '1px solid var(--zima-border-default)',
                  borderRadius: 'var(--zima-radius-md)',
                  boxShadow: 'var(--zima-shadow-lg)',
                  zIndex: '50',
                  minWidth: '180px',
                  overflow: 'hidden',
                }"
              >
                <button
                  v-for="item in [
                    { label: 'Editar', icon: 'i-lucide-pencil', action: () => { closeMenu(); openEditProduct(row as Product) } },
                    { label: 'Ajustar estoque', icon: 'i-lucide-sliders', action: () => { closeMenu(); openAdjust(row as Product) } },
                    { label: 'Registrar entrada', icon: 'i-lucide-truck', action: () => { closeMenu(); openEntry(row as Product) } },
                    { label: 'Ver movimentações', icon: 'i-lucide-arrow-left-right', action: () => { closeMenu(); movProductFilter = (row as Product).id; activeTab = 'movimentacoes' } },
                    { label: (row as Product).active ? 'Desativar' : 'Ativar', icon: (row as Product).active ? 'i-lucide-eye-off' : 'i-lucide-eye', action: () => { closeMenu(); toggleProductActive((row as Product).id); toast.info((row as Product).active ? 'Produto desativado' : 'Produto ativado') } },
                  ]"
                  :key="item.label"
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors"
                  :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-text-primary)', textAlign: 'left' }"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-3)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
                  @click="item.action()"
                >
                  <Icon :name="item.icon" style="width:14px;height:14px;" />
                  {{ item.label }}
                </button>
              </div>
            </div>
          </template>

          <template #batch-actions="{ selected }">
            <ZimaButton size="sm" variant="ghost" @click="toast.info('Desativando ' + selected.length + ' produtos...')">
              Desativar selecionados ({{ selected.length }})
            </ZimaButton>
            <ZimaButton size="sm" variant="ghost" @click="toast.info('Exportando ' + selected.length + ' produtos...')">
              Exportar selecionados
            </ZimaButton>
          </template>
        </ZimaTable>
      </div>

      <!-- Visualização Grid -->
      <div v-else class="grid grid-cols-4 gap-4">
        <div
          v-for="p in filteredProducts"
          :key="p.id"
          :style="{
            background: 'var(--zima-bg-surface-1)',
            border: '1px solid var(--zima-border-default)',
            borderRadius: 'var(--zima-radius-lg)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'border-color 150ms',
          }"
          @click="openProductDrawer(p as unknown as Record<string, unknown>)"
          @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-primary)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'"
        >
          <!-- Imagem placeholder -->
          <div
            :style="{
              width: '100%',
              aspectRatio: '1',
              background: 'var(--zima-bg-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
          >
            <Icon name="i-lucide-package" :style="{ width: '48px', height: '48px', color: getCategoryColor(p.categoryId), opacity: '0.5' }" />
          </div>
          <div class="p-3">
            <div :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ p.name }}</div>
            <div class="flex items-center justify-between mb-2">
              <span :style="{ display: 'inline-flex', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', background: getCategoryColor(p.categoryId) + '22', color: getCategoryColor(p.categoryId) }">
                {{ getCategoryName(p.categoryId) }}
              </span>
              <span :style="{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', color: 'var(--zima-text-primary)' }">{{ fmt(p.salePrice) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div :style="{ flex: '1', height: '3px', background: 'rgba(148,163,184,0.15)', borderRadius: '2px', overflow: 'hidden' }">
                <div :style="{ width: stockBarWidth(p) + '%', background: stockBarColor(p), height: '100%' }" />
              </div>
              <span :style="{ fontSize: '12px', fontFamily: 'monospace', color: stockBarColor(p), fontWeight: '500' }">{{ p.stock }}</span>
            </div>
          </div>
        </div>

        <!-- Estado vazio no grid -->
        <div v-if="filteredProducts.length === 0" class="col-span-4 py-16 flex flex-col items-center gap-3">
          <Icon name="i-lucide-package" style="width:40px;height:40px;opacity:0.3;" />
          <p :style="{ color: 'var(--zima-text-muted)', fontSize: '14px' }">Nenhum produto encontrado</p>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- TAB: MOVIMENTAÇÕES -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'movimentacoes'">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <ZimaSelect v-model="movTypeFilter" :options="movTypeOptions" style="min-width:160px;" />
        <ZimaSelect v-model="movProductFilter" :options="movProductOptions" style="min-width:200px;" />
        <input
          v-model="movDateFrom"
          type="date"
          :style="{
            height: '36px',
            padding: '0 10px',
            background: 'var(--zima-bg-surface-2)',
            border: '1px solid var(--zima-border-default)',
            borderRadius: 'var(--zima-radius-md)',
            color: 'var(--zima-text-primary)',
            fontSize: '14px',
          }"
        />
        <span :style="{ color: 'var(--zima-text-muted)', fontSize: '13px' }">até</span>
        <input
          v-model="movDateTo"
          type="date"
          :style="{
            height: '36px',
            padding: '0 10px',
            background: 'var(--zima-bg-surface-2)',
            border: '1px solid var(--zima-border-default)',
            borderRadius: 'var(--zima-radius-md)',
            color: 'var(--zima-text-primary)',
            fontSize: '14px',
          }"
        />
        <ZimaButton variant="ghost" size="sm" @click="toast.info('Exportando movimentações...')">
          <Icon name="i-lucide-download" style="width:14px;height:14px;margin-right:6px;" />
          Exportar
        </ZimaButton>
        <span :style="{ fontSize: '13px', color: 'var(--zima-text-muted)', marginLeft: 'auto' }">{{ filteredMovements.length }} registros</span>
      </div>

      <ZimaTable
        :columns="movColumns"
        :rows="movRows"
        :loading="loading"
        empty-title="Nenhuma movimentação encontrada"
        empty-description="Tente ajustar os filtros de busca"
        empty-icon="i-lucide-arrow-left-right"
      >
        <template #cell-data="{ row }">
          <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">{{ (row as StockMovement).createdAt }}</span>
        </template>

        <template #cell-tipo="{ row }">
          <div class="flex items-center gap-2">
            <Icon
              :name="movTypeConfig[(row as StockMovement).type].icon"
              :style="{ width: '15px', height: '15px', color: movTypeConfig[(row as StockMovement).type].color }"
            />
            <span :style="{ fontSize: '13px', fontWeight: '500', color: movTypeConfig[(row as StockMovement).type].color }">
              {{ movTypeConfig[(row as StockMovement).type].label }}
            </span>
          </div>
        </template>

        <template #cell-qty="{ row }">
          <span
            :style="{
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: '600',
              color: (row as StockMovement).qty > 0 ? '#10B981' : '#EF4444',
            }"
          >
            {{ (row as StockMovement).qty > 0 ? '+' : '' }}{{ (row as StockMovement).qty }}
          </span>
        </template>

        <template #cell-antes="{ row }">
          <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">{{ (row as StockMovement).qtyBefore }}</span>
        </template>

        <template #cell-depois="{ row }">
          <span :style="{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ (row as StockMovement).qtyAfter }}</span>
        </template>
      </ZimaTable>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- TAB: FORNECEDORES -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'fornecedores'">
      <div class="flex items-center justify-between mb-4">
        <p :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">{{ suppliers.length }} fornecedores cadastrados</p>
        <ZimaButton size="sm" @click="openNewSupplier">
          <Icon name="i-lucide-plus" style="width:14px;height:14px;margin-right:6px;" />
          Novo Fornecedor
        </ZimaButton>
      </div>

      <ZimaTable
        :columns="supplierTableColumns"
        :rows="supplierTableRows"
        :loading="loading"
        row-clickable
        empty-title="Nenhum fornecedor cadastrado"
        empty-description="Cadastre fornecedores para agilizar as entradas de estoque"
        empty-icon="i-lucide-truck"
        @row-click="openSupplierDrawer"
      >
        <template #cell-nome="{ row }">
          <div>
            <div :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ (row as Supplier).name }}</div>
            <div v-if="(row as Supplier).cnpj" :style="{ fontSize: '12px', color: 'var(--zima-text-muted)', fontFamily: 'monospace' }">{{ (row as Supplier).cnpj }}</div>
          </div>
        </template>

        <template #cell-produtos="{ row }">
          <span :style="{ fontSize: '13px', fontWeight: '500', color: 'var(--zima-text-primary)', display: 'block', textAlign: 'center' }">{{ (row as Supplier).productsCount }}</span>
        </template>

        <template #cell-status="{ row }">
          <ZimaBadge :variant="(row as Supplier).active ? 'success' : 'neutral'">
            {{ (row as Supplier).active ? 'Ativo' : 'Inativo' }}
          </ZimaBadge>
        </template>

        <template #cell-acoes="{ row }">
          <div @click.stop>
            <ZimaButton variant="ghost" size="sm" @click="openEditSupplier(row as Supplier)">
              <Icon name="i-lucide-pencil" style="width:13px;height:13px;" />
            </ZimaButton>
          </div>
        </template>
      </ZimaTable>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- TAB: ALERTAS -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'alertas'">
      <!-- Sem estoque -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <h2 :style="{ fontSize: '16px', fontWeight: '600', color: 'var(--zima-text-primary)' }">Sem Estoque</h2>
          <span :style="{ background: '#EF4444', color: '#fff', borderRadius: '9999px', fontSize: '12px', padding: '1px 8px', fontWeight: '600' }">
            {{ outOfStockProducts.length }}
          </span>
        </div>
        <div v-if="outOfStockProducts.length === 0" class="py-8 text-center">
          <Icon name="i-lucide-check-circle" style="width:32px;height:32px;color:#10B981;margin:0 auto 8px;" />
          <p :style="{ color: 'var(--zima-text-muted)', fontSize: '14px' }">Nenhum produto sem estoque. Ótimo!</p>
        </div>
        <div v-else class="grid grid-cols-2 gap-3">
          <div
            v-for="p in outOfStockProducts"
            :key="p.id"
            :style="{
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--zima-radius-lg)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }"
          >
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ p.name }}</span>
                <span :style="{ display: 'inline-flex', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', background: getCategoryColor(p.categoryId) + '22', color: getCategoryColor(p.categoryId) }">
                  {{ getCategoryName(p.categoryId) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="i-lucide-package-x" style="width:14px;height:14px;color:#EF4444;" />
                <span :style="{ fontSize: '13px', color: '#EF4444', fontWeight: '600' }">Estoque zerado</span>
                <span :style="{ fontSize: '12px', color: 'var(--zima-text-muted)' }">· mín. {{ p.minStock }}</span>
              </div>
              <div v-if="p.supplierId" :style="{ fontSize: '12px', color: 'var(--zima-text-muted)', marginTop: '4px' }">
                Fornecedor: {{ getSupplierName(p.supplierId) }}
              </div>
            </div>
            <ZimaButton size="sm" @click="openEntry(p)">
              <Icon name="i-lucide-truck" style="width:13px;height:13px;margin-right:5px;" />
              Repor
            </ZimaButton>
          </div>
        </div>
      </div>

      <!-- Estoque baixo -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <h2 :style="{ fontSize: '16px', fontWeight: '600', color: 'var(--zima-text-primary)' }">Estoque Baixo</h2>
          <span :style="{ background: '#F59E0B', color: '#fff', borderRadius: '9999px', fontSize: '12px', padding: '1px 8px', fontWeight: '600' }">
            {{ lowStockProducts.length }}
          </span>
        </div>
        <div v-if="lowStockProducts.length === 0" class="py-8 text-center">
          <Icon name="i-lucide-check-circle" style="width:32px;height:32px;color:#10B981;margin:0 auto 8px;" />
          <p :style="{ color: 'var(--zima-text-muted)', fontSize: '14px' }">Todos os produtos estão com estoque adequado!</p>
        </div>
        <div v-else class="grid grid-cols-2 gap-3">
          <div
            v-for="p in lowStockProducts"
            :key="p.id"
            :style="{
              background: 'rgba(245,158,11,0.04)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 'var(--zima-radius-lg)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }"
          >
            <div style="flex:1">
              <div class="flex items-center gap-2 mb-2">
                <span :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ p.name }}</span>
                <span :style="{ display: 'inline-flex', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', background: getCategoryColor(p.categoryId) + '22', color: getCategoryColor(p.categoryId) }">
                  {{ getCategoryName(p.categoryId) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div :style="{ flex: '1', maxWidth: '100px', height: '4px', background: 'rgba(148,163,184,0.15)', borderRadius: '2px', overflow: 'hidden' }">
                  <div :style="{ width: stockBarWidth(p) + '%', background: '#F59E0B', height: '100%' }" />
                </div>
                <span :style="{ fontSize: '13px', color: '#F59E0B', fontWeight: '600' }">{{ p.stock }} / {{ p.minStock }} mín.</span>
              </div>
              <div v-if="p.supplierId" :style="{ fontSize: '12px', color: 'var(--zima-text-muted)', marginTop: '4px' }">
                Fornecedor: {{ getSupplierName(p.supplierId) }}
              </div>
            </div>
            <ZimaButton variant="ghost" size="sm" @click="openEntry(p)">
              <Icon name="i-lucide-truck" style="width:13px;height:13px;margin-right:5px;" />
              Repor
            </ZimaButton>
          </div>
        </div>
      </div>

      <!-- Sugestões de reposição -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <h2 :style="{ fontSize: '16px', fontWeight: '600', color: 'var(--zima-text-primary)' }">Sugestões de Reposição</h2>
        </div>
        <ZimaTable
          :columns="reorderColumns"
          :rows="reorderRows"
          empty-title="Não há sugestões de reposição"
          empty-description="Todos os produtos estão com estoque acima do mínimo"
          empty-icon="i-lucide-check-circle"
        >
          <template #cell-produto="{ row }">
            <div :style="{ fontSize: '14px', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ (row as Product).name }}</div>
          </template>
          <template #cell-atual="{ row }">
            <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: stockBarColor(row as Product), fontWeight: '600' }">{{ (row as Product).stock }}</span>
          </template>
          <template #cell-sugerido="{ row }">
            <span :style="{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', color: 'var(--zima-primary)' }">{{ (row as unknown as { sugerido: number }).sugerido }}</span>
          </template>
          <template #cell-acao="{ row }">
            <ZimaButton size="sm" variant="ghost" @click="openEntry(row as Product)">
              <Icon name="i-lucide-truck" style="width:13px;height:13px;margin-right:5px;" />
              Registrar Entrada
            </ZimaButton>
          </template>
        </ZimaTable>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- DRAWER: Detalhes do Produto -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaDrawer v-model="productDrawerOpen" :title="selectedProduct?.name || ''" width="520px">
      <div v-if="selectedProduct" class="p-4">
        <!-- Imagem/placeholder -->
        <div
          :style="{
            width: '100%',
            height: '180px',
            background: 'var(--zima-bg-surface-2)',
            borderRadius: 'var(--zima-radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }"
        >
          <Icon name="i-lucide-package" :style="{ width: '56px', height: '56px', color: getCategoryColor(selectedProduct.categoryId), opacity: '0.5' }" />
        </div>

        <!-- Identificação -->
        <div class="mb-5">
          <p :style="{ fontSize: '12px', color: 'var(--zima-text-muted)', marginBottom: '4px' }">SKU: <strong style="font-family:monospace">{{ selectedProduct.sku }}</strong></p>
          <p v-if="selectedProduct.barcode" :style="{ fontSize: '12px', color: 'var(--zima-text-muted)' }">Barcode: <strong style="font-family:monospace">{{ selectedProduct.barcode }}</strong></p>
          <div class="flex items-center gap-2 mt-2">
            <span :style="{ display: 'inline-flex', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', background: getCategoryColor(selectedProduct.categoryId) + '22', color: getCategoryColor(selectedProduct.categoryId), fontWeight: '500' }">
              {{ getCategoryName(selectedProduct.categoryId) }}
            </span>
            <ZimaBadge :variant="stockStatus(selectedProduct).variant">{{ stockStatus(selectedProduct).label }}</ZimaBadge>
          </div>
        </div>

        <!-- Preços -->
        <div :style="{ background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-lg)', padding: '16px', marginBottom: '16px' }">
          <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Preços</p>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', marginBottom: '2px' }">Custo</p>
              <p :style="{ fontSize: '15px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">{{ fmt(selectedProduct.costPrice) }}</p>
            </div>
            <div>
              <p :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', marginBottom: '2px' }">Venda</p>
              <p :style="{ fontSize: '15px', fontFamily: 'monospace', color: 'var(--zima-text-primary)', fontWeight: '600' }">{{ fmt(selectedProduct.salePrice) }}</p>
            </div>
            <div>
              <p :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', marginBottom: '2px' }">Margem</p>
              <p :style="{ fontSize: '15px', fontFamily: 'monospace', fontWeight: '600', color: margemColor(selectedProduct.salePrice > 0 ? (selectedProduct.salePrice - selectedProduct.costPrice) / selectedProduct.salePrice * 100 : 0) }">
                {{ productMargin }}
              </p>
            </div>
          </div>
        </div>

        <!-- Estoque -->
        <div :style="{ background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-lg)', padding: '16px', marginBottom: '16px' }">
          <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Estoque</p>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', marginBottom: '2px' }">Atual</p>
              <p :style="{ fontSize: '20px', fontFamily: 'monospace', fontWeight: '700', color: stockBarColor(selectedProduct) }">{{ selectedProduct.stock }}</p>
            </div>
            <div>
              <p :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', marginBottom: '2px' }">Mínimo</p>
              <p :style="{ fontSize: '20px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--zima-text-primary)' }">{{ selectedProduct.minStock }}</p>
            </div>
            <div>
              <p :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', marginBottom: '2px' }">Unidade</p>
              <p :style="{ fontSize: '15px', fontFamily: 'monospace', color: 'var(--zima-text-primary)' }">{{ selectedProduct.unit }}</p>
            </div>
          </div>
          <div :style="{ marginTop: '12px', height: '6px', background: 'rgba(148,163,184,0.15)', borderRadius: '3px', overflow: 'hidden' }">
            <div :style="{ width: stockBarWidth(selectedProduct) + '%', background: stockBarColor(selectedProduct), height: '100%', transition: 'width 300ms ease' }" />
          </div>
        </div>

        <!-- Classificação -->
        <div :style="{ background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-lg)', padding: '16px', marginBottom: '16px' }">
          <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Classificação</p>
          <div class="flex flex-wrap gap-2">
            <ZimaBadge v-if="selectedProduct.forSale" variant="success">Venda ao cliente</ZimaBadge>
            <ZimaBadge v-if="selectedProduct.forInternalUse" variant="info">Uso interno</ZimaBadge>
            <ZimaBadge v-if="selectedProduct.brand" variant="neutral">{{ selectedProduct.brand }}</ZimaBadge>
            <ZimaBadge v-if="selectedProduct.supplierId" variant="neutral">{{ getSupplierName(selectedProduct.supplierId) }}</ZimaBadge>
          </div>
        </div>

        <!-- Variações -->
        <div v-if="selectedProduct.variations && selectedProduct.variations.length > 0" :style="{ marginBottom: '16px' }">
          <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Variações</p>
          <div :style="{ border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', overflow: 'hidden' }">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr :style="{ background: 'var(--zima-bg-surface-2)' }">
                  <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left' }">Variação</th>
                  <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left' }">SKU</th>
                  <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right' }">Estoque</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="v in selectedProduct.variations"
                  :key="v.id"
                  :style="{ borderTop: '1px solid var(--zima-border-default)' }"
                >
                  <td :style="{ padding: '8px 12px', fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ v.name }}</td>
                  <td :style="{ padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">{{ v.sku }}</td>
                  <td :style="{ padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace', textAlign: 'right', color: v.stock === 0 ? '#EF4444' : 'var(--zima-text-primary)' }">{{ v.stock }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Últimas movimentações -->
        <div>
          <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Últimas Movimentações</p>
          <div v-if="productMovements.length === 0" :style="{ color: 'var(--zima-text-muted)', fontSize: '13px' }">Nenhuma movimentação registrada.</div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="m in productMovements"
              :key="m.id"
              class="flex items-center gap-2"
              :style="{ padding: '8px 12px', background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-md)', fontSize: '13px' }"
            >
              <Icon :name="movTypeConfig[m.type].icon" :style="{ width: '14px', height: '14px', color: movTypeConfig[m.type].color, flexShrink: '0' }" />
              <span :style="{ color: movTypeConfig[m.type].color, fontWeight: '500', minWidth: '60px' }">{{ movTypeConfig[m.type].label }}</span>
              <span :style="{ fontFamily: 'monospace', fontWeight: '600', color: m.qty > 0 ? '#10B981' : '#EF4444' }">{{ m.qty > 0 ? '+' : '' }}{{ m.qty }}</span>
              <span :style="{ color: 'var(--zima-text-muted)', marginLeft: 'auto', fontSize: '12px' }">{{ m.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2">
          <ZimaButton variant="ghost" @click="close">Fechar</ZimaButton>
          <ZimaButton variant="ghost" @click="() => { close(); selectedProduct && openAdjust(selectedProduct) }">Ajustar Estoque</ZimaButton>
          <ZimaButton @click="() => { close(); selectedProduct && openEditProduct(selectedProduct) }">Editar Produto</ZimaButton>
        </div>
      </template>
    </ZimaDrawer>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Novo/Editar Produto -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal
      v-model="productModalOpen"
      :title="productModalMode === 'new' ? 'Novo Produto' : 'Editar Produto'"
      size="xl"
    >
      <div class="p-1">
        <!-- Seção 1: Foto + identificação -->
        <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Identificação</p>
        <div class="flex gap-4 mb-5">
          <!-- Upload area -->
          <div
            :style="{
              width: '120px',
              height: '120px',
              border: '2px dashed var(--zima-border-default)',
              borderRadius: 'var(--zima-radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              flexShrink: '0',
              color: 'var(--zima-text-muted)',
              fontSize: '12px',
              textAlign: 'center',
            }"
            @click="toast.info('Upload de imagem em breve!')"
          >
            <Icon name="i-lucide-camera" style="width:24px;height:24px;opacity:0.5;" />
            <span>Foto</span>
          </div>
          <div class="flex-1 grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <ZimaInput v-model="productForm.name" label="Nome do produto *" placeholder="Ex: Shampoo Wella Fusion 500ml" />
            </div>
            <div class="flex gap-2 items-end">
              <ZimaInput v-model="productForm.sku" label="SKU" placeholder="SKU-001" style="flex:1" />
              <ZimaButton variant="ghost" size="sm" style="flex-shrink:0;margin-bottom:1px" @click="generateSku">Gerar</ZimaButton>
            </div>
            <ZimaInput v-model="productForm.barcode" label="Código de barras" placeholder="7891234567890" />
          </div>
        </div>

        <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '16px 0' }" />

        <!-- Seção 2: Classificação -->
        <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Classificação</p>
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div>
            <ZimaSelect v-model="productForm.categoryId" label="Categoria *" :options="categoryOptions" />
          </div>
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Marca</label>
            <input
              v-model="productForm.brand"
              list="brand-suggestions"
              placeholder="Ex: Wella, L'Oréal"
              :style="{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                color: 'var(--zima-text-primary)',
                fontSize: '14px',
              }"
            />
            <datalist id="brand-suggestions">
              <option v-for="b in brandSuggestions" :key="b" :value="b" />
            </datalist>
          </div>
          <div class="col-span-2">
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Descrição</label>
            <textarea
              v-model="productForm.description"
              placeholder="Descrição curta do produto..."
              rows="2"
              :style="{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                color: 'var(--zima-text-primary)',
                fontSize: '14px',
                resize: 'vertical',
              }"
            />
          </div>
        </div>

        <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '16px 0' }" />

        <!-- Seção 3: Preços -->
        <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Preços</p>
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Preço de Custo (R$)</label>
            <input
              v-model.number="productForm.costPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              :style="{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                color: 'var(--zima-text-primary)',
                fontSize: '14px',
              }"
            />
          </div>
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Preço de Venda (R$) *</label>
            <input
              v-model.number="productForm.salePrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              :style="{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                color: 'var(--zima-text-primary)',
                fontSize: '14px',
              }"
            />
          </div>
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Margem de Lucro</label>
            <div
              :style="{
                height: '38px',
                padding: '0 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                display: 'flex',
                alignItems: 'center',
                fontSize: '15px',
                fontFamily: 'monospace',
                fontWeight: '700',
                color: liveMargemColor,
              }"
            >
              {{ liveMargem !== null ? liveMargem.toFixed(1) + '%' : '—' }}
            </div>
          </div>
        </div>

        <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '16px 0' }" />

        <!-- Seção 4: Estoque -->
        <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Estoque</p>
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Estoque Atual *</label>
            <input
              v-model.number="productForm.stock"
              type="number"
              min="0"
              placeholder="0"
              :style="{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                color: 'var(--zima-text-primary)',
                fontSize: '14px',
              }"
            />
          </div>
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Estoque Mínimo</label>
            <input
              v-model.number="productForm.minStock"
              type="number"
              min="0"
              placeholder="0"
              :style="{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                color: 'var(--zima-text-primary)',
                fontSize: '14px',
              }"
            />
          </div>
          <ZimaSelect v-model="productForm.unit" label="Unidade de Medida" :options="unitOptions" />
        </div>

        <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '16px 0' }" />

        <!-- Seção 5: Classificação de uso -->
        <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Uso e Disponibilidade</p>
        <div class="grid grid-cols-2 gap-4 mb-5">
          <div class="flex flex-col gap-3">
            <ZimaToggle v-model="productForm.forSale" label="Disponível para venda ao cliente" />
            <ZimaToggle v-model="productForm.forInternalUse" label="Uso interno (consumido nos serviços)" />
            <ZimaToggle v-model="productForm.active" label="Produto ativo" />
          </div>
          <ZimaSelect v-model="productForm.supplierId" label="Fornecedor" :options="supplierOptions" />
        </div>

        <hr :style="{ border: 'none', borderTop: '1px solid var(--zima-border-default)', margin: '16px 0' }" />

        <!-- Seção 6: Variações -->
        <div>
          <ZimaToggle v-model="productForm.hasVariations" label="Este produto tem variações (cores, tamanhos...)" />
          <div v-if="productForm.hasVariations" class="mt-4">
            <div :style="{ border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', overflow: 'hidden', marginBottom: '8px' }">
              <table style="width:100%; border-collapse:collapse;">
                <thead>
                  <tr :style="{ background: 'var(--zima-bg-surface-2)' }">
                    <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left' }">Nome</th>
                    <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left' }">SKU</th>
                    <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right' }">Estoque</th>
                    <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right' }">Preço</th>
                    <th style="width:36px;" />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(v, idx) in productForm.variations"
                    :key="v.id"
                    :style="{ borderTop: '1px solid var(--zima-border-default)' }"
                  >
                    <td :style="{ padding: '6px 12px' }">
                      <input
                        v-model="v.name"
                        placeholder="Ex: Rosa"
                        :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-primary)', fontSize: '13px', outline: 'none' }"
                      />
                    </td>
                    <td :style="{ padding: '6px 12px' }">
                      <input
                        v-model="v.sku"
                        placeholder="SKU-001-A"
                        :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-muted)', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }"
                      />
                    </td>
                    <td :style="{ padding: '6px 12px' }">
                      <input
                        v-model.number="v.stock"
                        type="number"
                        min="0"
                        :style="{ width: '60px', background: 'transparent', border: 'none', color: 'var(--zima-text-primary)', fontSize: '13px', fontFamily: 'monospace', textAlign: 'right', outline: 'none' }"
                      />
                    </td>
                    <td :style="{ padding: '6px 12px' }">
                      <input
                        v-model.number="v.price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="—"
                        :style="{ width: '80px', background: 'transparent', border: 'none', color: 'var(--zima-text-primary)', fontSize: '13px', fontFamily: 'monospace', textAlign: 'right', outline: 'none' }"
                      />
                    </td>
                    <td :style="{ padding: '6px 8px', textAlign: 'center' }">
                      <button
                        :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-text-muted)', padding: '4px' }"
                        @click="removeVariation(idx)"
                      >
                        <Icon name="i-lucide-x" style="width:14px;height:14px;" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="flex items-center gap-2"
              :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-primary)', fontSize: '13px', fontWeight: '500', padding: '0' }"
              @click="addVariationRow"
            >
              <Icon name="i-lucide-plus" style="width:14px;height:14px;" />
              Adicionar variação
            </button>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton @click="saveProduct">
            {{ productModalMode === 'new' ? 'Cadastrar Produto' : 'Salvar Alterações' }}
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Entrada de Mercadoria -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="entryOpen" title="Entrada de Mercadoria" size="lg">
      <div class="p-1">
        <div class="grid grid-cols-2 gap-3 mb-5">
          <ZimaSelect v-model="entryForm.supplierId" label="Fornecedor" :options="supplierOptions" />
          <ZimaInput v-model="entryForm.invoiceNumber" label="Nº da Nota Fiscal" placeholder="000123" />
          <div>
            <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Data da Entrada</label>
            <input
              v-model="entryForm.date"
              type="date"
              :style="{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                borderRadius: 'var(--zima-radius-md)',
                color: 'var(--zima-text-primary)',
                fontSize: '14px',
              }"
            />
          </div>
          <ZimaInput v-model="entryForm.notes" label="Observações" placeholder="Ex: Entregue com avaria na embalagem..." />
        </div>

        <!-- Tabela de produtos -->
        <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }">Produtos</p>
        <div :style="{ border: '1px solid var(--zima-border-default)', borderRadius: 'var(--zima-radius-md)', overflow: 'hidden', marginBottom: '8px' }">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr :style="{ background: 'var(--zima-bg-surface-2)' }">
                <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'left' }">Produto</th>
                <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '70px' }">Qtd</th>
                <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '110px' }">Custo Unit.</th>
                <th :style="{ padding: '8px 12px', fontSize: '12px', color: 'var(--zima-text-muted)', fontWeight: '500', textAlign: 'right', width: '110px' }">Total</th>
                <th style="width:36px;" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in entryForm.items"
                :key="idx"
                :style="{ borderTop: idx === 0 ? 'none' : '1px solid var(--zima-border-default)' }"
              >
                <td :style="{ padding: '8px 12px' }">
                  <select
                    :value="item.productId"
                    :style="{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: item.productId ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                    }"
                    @change="onEntryProductSelect(idx, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="" disabled>Selecionar produto...</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                </td>
                <td :style="{ padding: '8px 12px' }">
                  <input
                    v-model.number="item.qty"
                    type="number"
                    min="1"
                    :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-primary)', fontSize: '13px', fontFamily: 'monospace', textAlign: 'right', outline: 'none' }"
                  />
                </td>
                <td :style="{ padding: '8px 12px' }">
                  <input
                    v-model.number="item.unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    :style="{ width: '100%', background: 'transparent', border: 'none', color: 'var(--zima-text-primary)', fontSize: '13px', fontFamily: 'monospace', textAlign: 'right', outline: 'none' }"
                  />
                </td>
                <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', fontFamily: 'monospace', color: 'var(--zima-text-primary)', fontWeight: '500' }">
                  {{ fmt((item.qty || 0) * (item.unitCost || 0)) }}
                </td>
                <td :style="{ padding: '8px 8px', textAlign: 'center' }">
                  <button
                    :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-text-muted)', padding: '4px' }"
                    @click="removeEntryRow(idx)"
                  >
                    <Icon name="i-lucide-x" style="width:14px;height:14px;" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          class="flex items-center gap-2 mb-4"
          :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--zima-primary)', fontSize: '13px', fontWeight: '500', padding: '0' }"
          @click="addEntryRow"
        >
          <Icon name="i-lucide-plus" style="width:14px;height:14px;" />
          Adicionar produto
        </button>

        <!-- Total -->
        <div
          :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'var(--zima-bg-surface-2)',
            borderRadius: 'var(--zima-radius-md)',
          }"
        >
          <span :style="{ fontSize: '14px', color: 'var(--zima-text-muted)' }">Total da entrada</span>
          <span :style="{ fontSize: '18px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--zima-text-primary)' }">{{ fmt(entryTotal) }}</span>
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton @click="confirmEntry">
            <Icon name="i-lucide-check" style="width:14px;height:14px;margin-right:6px;" />
            Confirmar Entrada
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Ajuste de Estoque -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal v-model="adjustOpen" title="Ajuste de Estoque" size="sm">
      <div class="p-1 flex flex-col gap-4">
        <ZimaSelect
          v-model="adjustProductId"
          label="Produto"
          :options="[{ label: 'Selecionar produto...', value: '' }, ...productSelectOptions]"
        />

        <div v-if="adjustProduct" :style="{ padding: '12px', background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-md)' }">
          <p :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">Estoque atual</p>
          <p :style="{ fontSize: '22px', fontFamily: 'monospace', fontWeight: '700', color: stockBarColor(adjustProduct) }">
            {{ adjustProduct.stock }} <span :style="{ fontSize: '14px', fontWeight: '400' }">{{ adjustProduct.unit }}</span>
          </p>
        </div>

        <div v-if="adjustProduct">
          <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Contagem real *</label>
          <input
            v-model.number="adjustNewQty"
            type="number"
            min="0"
            placeholder="0"
            :style="{
              width: '100%',
              height: '44px',
              padding: '0 12px',
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              borderRadius: 'var(--zima-radius-md)',
              color: 'var(--zima-text-primary)',
              fontSize: '20px',
              fontFamily: 'monospace',
              fontWeight: '600',
            }"
          />
          <div
            v-if="adjustNewQty !== null && adjustDiff !== 0"
            :style="{
              marginTop: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--zima-radius-md)',
              background: adjustDiff > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              color: adjustDiff > 0 ? '#10B981' : '#EF4444',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'monospace',
            }"
          >
            Diferença: {{ adjustDiff > 0 ? '+' : '' }}{{ adjustDiff }} {{ adjustProduct.unit }}
          </div>
        </div>

        <ZimaSelect v-model="adjustReason" label="Motivo do ajuste" :options="adjustReasonOptions" />
        <ZimaInput v-model="adjustNotes" label="Observação (opcional)" placeholder="Ex: Ajuste após inventário semestral" />
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton :disabled="!adjustProduct || adjustNewQty === null" @click="confirmAdjust">
            Confirmar Ajuste
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- DRAWER: Detalhes do Fornecedor -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaDrawer v-model="supplierDrawerOpen" :title="selectedSupplier?.name || ''" width="480px">
      <div v-if="selectedSupplier" class="p-4">
        <!-- Info básica -->
        <div :style="{ background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-lg)', padding: '16px', marginBottom: '16px' }">
          <ZimaBadge :variant="selectedSupplier.active ? 'success' : 'neutral'" style="margin-bottom:12px">
            {{ selectedSupplier.active ? 'Ativo' : 'Inativo' }}
          </ZimaBadge>
          <div class="grid grid-cols-1 gap-3">
            <div v-if="selectedSupplier.cnpj" class="flex items-center gap-2">
              <Icon name="i-lucide-building-2" style="width:15px;height:15px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span :style="{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--zima-text-primary)' }">{{ selectedSupplier.cnpj }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-user" style="width:15px;height:15px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span :style="{ fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ selectedSupplier.contact }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-phone" style="width:15px;height:15px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span :style="{ fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ selectedSupplier.phone }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-mail" style="width:15px;height:15px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span :style="{ fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ selectedSupplier.email }}</span>
            </div>
            <div v-if="selectedSupplier.address" class="flex items-center gap-2">
              <Icon name="i-lucide-map-pin" style="width:15px;height:15px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span :style="{ fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ selectedSupplier.address }}</span>
            </div>
            <div v-if="selectedSupplier.paymentTerms" class="flex items-center gap-2">
              <Icon name="i-lucide-calendar" style="width:15px;height:15px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span :style="{ fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ selectedSupplier.paymentTerms }}</span>
            </div>
          </div>
          <div v-if="selectedSupplier.notes" :style="{ marginTop: '12px', padding: '10px', background: 'var(--zima-bg-surface-3)', borderRadius: 'var(--zima-radius-md)' }">
            <p :style="{ fontSize: '13px', color: 'var(--zima-text-muted)' }">{{ selectedSupplier.notes }}</p>
          </div>
        </div>

        <!-- Produtos deste fornecedor -->
        <div class="mb-4">
          <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }">
            Produtos ({{ supplierProducts.length }})
          </p>
          <div v-if="supplierProducts.length === 0" :style="{ color: 'var(--zima-text-muted)', fontSize: '13px' }">Nenhum produto vinculado.</div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="p in supplierProducts"
              :key="p.id"
              class="flex items-center justify-between"
              :style="{ padding: '8px 12px', background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-md)' }"
            >
              <div>
                <span :style="{ fontSize: '13px', fontWeight: '500', color: 'var(--zima-text-primary)' }">{{ p.name }}</span>
                <span :style="{ fontSize: '11px', color: 'var(--zima-text-muted)', marginLeft: '8px', fontFamily: 'monospace' }">{{ p.sku }}</span>
              </div>
              <span :style="{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '600', color: stockBarColor(p) }">{{ p.stock }} {{ p.unit }}</span>
            </div>
          </div>
        </div>

        <!-- Últimas entradas -->
        <div>
          <p :style="{ fontSize: '13px', fontWeight: '600', color: 'var(--zima-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }">
            Últimas Entradas
          </p>
          <div v-if="supplierMovements.length === 0" :style="{ color: 'var(--zima-text-muted)', fontSize: '13px' }">Nenhuma entrada registrada.</div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="m in supplierMovements"
              :key="m.id"
              :style="{ padding: '8px 12px', background: 'var(--zima-bg-surface-2)', borderRadius: 'var(--zima-radius-md)' }"
            >
              <div class="flex items-center justify-between">
                <span :style="{ fontSize: '13px', color: 'var(--zima-text-primary)' }">{{ m.productName }}</span>
                <span :style="{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', color: '#10B981' }">+{{ m.qty }}</span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span :style="{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--zima-text-muted)' }">{{ m.invoiceNumber }}</span>
                <span :style="{ fontSize: '12px', color: 'var(--zima-text-muted)' }">{{ m.createdAt.slice(0, 10) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2">
          <ZimaButton variant="ghost" @click="close">Fechar</ZimaButton>
          <ZimaButton
            variant="ghost"
            @click="() => { if (selectedSupplier) { updateSupplier(selectedSupplier.id, { active: !selectedSupplier.active }); toast.info(selectedSupplier.active ? 'Fornecedor desativado' : 'Fornecedor ativado'); close() } }"
          >
            {{ selectedSupplier?.active ? 'Desativar' : 'Ativar' }}
          </ZimaButton>
          <ZimaButton @click="() => { close(); selectedSupplier && openEditSupplier(selectedSupplier) }">Editar</ZimaButton>
        </div>
      </template>
    </ZimaDrawer>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Novo/Editar Fornecedor -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ZimaModal
      v-model="supplierModalOpen"
      :title="supplierModalMode === 'new' ? 'Novo Fornecedor' : 'Editar Fornecedor'"
      size="md"
    >
      <div class="p-1 flex flex-col gap-3">
        <ZimaInput v-model="supplierForm.name" label="Nome do fornecedor *" placeholder="Ex: Wella Distribuidora SP" />
        <div>
          <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">CNPJ</label>
          <input
            :value="supplierForm.cnpj"
            placeholder="XX.XXX.XXX/XXXX-XX"
            maxlength="18"
            :style="{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              borderRadius: 'var(--zima-radius-md)',
              color: 'var(--zima-text-primary)',
              fontSize: '14px',
              fontFamily: 'monospace',
            }"
            @input="maskCnpj"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <ZimaInput v-model="supplierForm.contact" label="Nome do contato" placeholder="Ex: Carlos Mendes" />
          <ZimaInput v-model="supplierForm.phone" label="Telefone" placeholder="(11) 98765-4321" />
        </div>
        <ZimaInput v-model="supplierForm.email" label="E-mail" placeholder="contato@fornecedor.com" />
        <ZimaInput v-model="supplierForm.address" label="Endereço" placeholder="Rua, número — Cidade/UF" />
        <ZimaInput v-model="supplierForm.paymentTerms" label="Condições de pagamento" placeholder="Ex: 30/60 dias" />
        <div>
          <label :style="{ display: 'block', fontSize: '13px', color: 'var(--zima-text-muted)', marginBottom: '6px' }">Observações</label>
          <textarea
            v-model="supplierForm.notes"
            placeholder="Informações adicionais..."
            rows="2"
            :style="{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              borderRadius: 'var(--zima-radius-md)',
              color: 'var(--zima-text-primary)',
              fontSize: '14px',
              resize: 'vertical',
            }"
          />
        </div>
        <ZimaToggle v-model="supplierForm.active" label="Fornecedor ativo" />
      </div>

      <template #footer="{ close }">
        <div class="flex gap-2 justify-end">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton @click="saveSupplier">
            {{ supplierModalMode === 'new' ? 'Cadastrar Fornecedor' : 'Salvar Alterações' }}
          </ZimaButton>
        </div>
      </template>
    </ZimaModal>
  </div>
</template>
