# Tela 03 — Clientes

**Rota:** `/saas/clientes` (lista) · `/saas/clientes/[id]` (detalhe)
**Arquivos:** `layers/saas/pages/saas/clientes/index.vue`, `[id].vue`
**Composable principal:** `useCustomers()` — `layers/saas/composables/useCustomers.ts`

## Visão Geral

CRUD completo de clientes/contatos. Lista com busca, filtros por status e tags, paginação, e seleção múltipla para ações em lote.

## Componentes-chave

- `ZimaTable` — colunas: avatar+nome, telefone, email, status, visitas, gasto total, última visita, ações
- `ZimaModal` `ModalCliente.vue` — criar/editar cliente
- `ZimaSearchAutocomplete` — busca com debounce 300ms
- `ZimaBadge` — status (ACTIVE/INACTIVE/VIP/NEW) com cores do `CUSTOMER_STATUS`

## Filtros (query params sincronizados)

| Parâmetro | Opções |
|-----------|--------|
| `search` | Texto livre — filtra nome, telefone, email |
| `status` | Todos / ACTIVE / INACTIVE / VIP / NEW |
| `tag` | Tag livre (ex: "fidelizada", "aniversário") |
| `sort` | nome / gasto / última visita / cadastro |

## Paginação

10 clientes por página. Total exibido no rodapé da ZimaTable via prop `total`.

## Seleção em Lote

Com `selectable` na ZimaTable: ações disponíveis ao selecionar múltiplos clientes (ex: "Enviar campanha", "Exportar").

## Tipos

```typescript
type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'VIP' | 'NEW'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  cpf?: string
  birthDate?: string
  gender?: string
  origin?: string
  status: CustomerStatus
  tags: string[]
  totalSpent: number
  visits: number
  lastVisitDate?: string
  since: string              // data de cadastro
  address?: string
  notes?: string
  loyaltyPoints: number
}

// Constante exportada para usar nos templates
const CUSTOMER_STATUS: Record<CustomerStatus, { label: string, variant: string }>
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega clientes mock |
| `createCustomer(data)` | Adiciona novo cliente |
| `updateCustomer(id, data)` | Atualiza dados |
| `searchCustomers(query)` | Filtragem local por nome/telefone/email |
| `customers` | `ref<Customer[]>` singleton |

## Mock Data

- 10+ clientes com histórico de visitas, gasto total e status variados
- Inclui exemplos de cada status: ACTIVE, INACTIVE, VIP, NEW
