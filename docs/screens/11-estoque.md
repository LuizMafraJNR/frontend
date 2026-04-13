# Tela 11 — Estoque

**Rota:** `/saas/estoque`
**Arquivo:** `layers/saas/pages/saas/estoque.vue`
**Composable principal:** `useInventory()` — `layers/saas/composables/useInventory.ts`

## Visão Geral

Gestão completa de estoque: produtos (com variações), movimentações, fornecedores e alertas de reposição. Suporta visualização em tabela e grade. Permite registrar entradas de mercadoria e ajustes de estoque.

## Tabs

| Tab | Conteúdo |
|-----|---------|
| `produtos` | 4 KPIs + filtros + ZimaTable / grade de produtos |
| `movimentacoes` | Histórico de todas as movimentações com filtros de tipo e período |
| `fornecedores` | CRUD de fornecedores em ZimaTable |
| `alertas` | Grid de produtos sem estoque (vermelho) + estoque baixo (amarelo) + tabela de reposição sugerida |

## KPIs (Tab Produtos)

| KPI | Cálculo |
|-----|---------|
| Total de produtos | `products.filter(p => p.active).length` |
| Valor em estoque | `Σ (stock × costPrice)` por produto ativo |
| Estoque baixo | Produtos com `stock > 0 && stock <= minStock` |
| Sem estoque | Produtos com `stock === 0` |

## Tipos

```typescript
type UnitOfMeasure = 'un' | 'ml' | 'g' | 'kg' | 'L'
type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'LOSS' | 'RETURN'
type MovementReason = 'PURCHASE' | 'SALE' | 'SERVICE_USE' | 'ADJUSTMENT' | 'LOSS' | 'RETURN_SUPPLIER'

interface ProductCategory {
  id: string
  name: string
  color: string    // hex
}

interface ProductVariation {
  id: string
  name: string     // ex: '100ml', 'Loiro Platinado'
  sku: string
  stock: number
  price?: number   // sobrescreve o preço base se definido
}

interface Product {
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
  minStock: number      // gatilho para alerta
  unit: UnitOfMeasure
  forSale: boolean      // aparece no PDV
  forInternalUse: boolean  // uso interno (serviços)
  active: boolean
  imageUrl?: string
  supplierId?: string
  variations?: ProductVariation[]
  createdAt: string
}

interface Supplier {
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

interface StockMovement {
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
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega produtos, categorias, fornecedores, movimentações |
| `addProduct(data)` | Cria produto novo |
| `updateProduct(id, data)` | Atualiza dados do produto |
| `toggleProductActive(id)` | Ativa/desativa produto |
| `adjustStock(productId, qty, reason, notes)` | Registra ajuste de estoque (positivo ou negativo) |
| `registerEntry(entry)` | Registra entrada de mercadoria com nota fiscal |
| `addSupplier(data)` | Cadastra fornecedor |
| `updateSupplier(id, data)` | Atualiza fornecedor |
| `kpi` | `computed` — `{ totalProducts, totalStockValue, lowStockCount, outOfStockCount }` |

## Modais

| Modal | Tamanho | Conteúdo |
|-------|---------|---------|
| Modal Produto | `xl` | 6 seções: Informações básicas, Preços, Estoque, Categorização, Fornecedor, Variações (colapsável) |
| Modal Entrada de Mercadoria | `lg` | Seletor de fornecedor + tabela editável de itens (produto, qty, custo unitário) + dados da NF |
| Modal Ajuste de Estoque | `sm` | Produto, tipo (+ ou -), quantidade, motivo, notas. Exibe diff calculado em tempo real |

## Drawer de Produto

`ZimaDrawer` (520px) ao clicar na linha da tabela — mostra todos os dados do produto, variações, histórico de movimentações filtrado por esse produto, e ações rápidas.

## Visualizações da Tab Produtos

| Modo | Gatilho | Layout |
|------|---------|--------|
| `table` | Botão tabela | ZimaTable com 9 colunas, barra de estoque colorida inline |
| `grid` | Botão grade | Cards 4 colunas com imagem, nome, estoque visual, preços |

## Barra de Estoque (helper visual)

```typescript
const stockBarWidth = (p: Product) =>
  Math.min(100, (p.stock / (p.minStock * 2)) * 100)

const stockBarColor = (p: Product) =>
  p.stock === 0 ? '#EF4444' : p.stock <= p.minStock ? '#F59E0B' : '#10B981'
```

## Mock Data

- 5 categorias, 12 produtos (mix de ativos/inativos, alguns com variações, níveis de estoque variados)
- 3 fornecedores com dados completos
- 20 movimentações históricas (ENTRY, EXIT, ADJUSTMENT, LOSS)
