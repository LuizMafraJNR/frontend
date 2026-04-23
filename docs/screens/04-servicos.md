# Tela 04 — Serviços

**Rota:** `/saas/servicos`
**Arquivo:** `layers/saas/pages/saas/servicos.vue`
**Composables:** `useServices()`, `useProfessionals()`, `useZimaToast()`

## Visão Geral

Gerenciador do catálogo de serviços e categorias. Permite criar, editar, reordenar e ativar/desativar serviços. Categorias são colapsáveis na visualização principal.

## Tabs

| Tab | Conteúdo |
|-----|---------|
| `servicos` | Lista de serviços agrupada por categoria, colapsável |
| `categorias` | CRUD de categorias com cor associada |

## Componentes-chave

- Grade de cards de serviço (agrupados por categoria, colapsáveis)
- `ZimaModal` `ModalNovoServico.vue` — criar/editar serviço
- `ZimaModal` `ModalNovaCategoria.vue` — criar/editar categoria
- `ZimaToggle` — ativar/desativar serviço inline

## Tipos

```typescript
interface ServiceCategory {
  id: string
  name: string
  color: string       // hex, ex: '#3B82F6'
  order: number
  servicesCount: number
}

interface Service {
  id: string
  categoryId: string
  name: string
  duration: number    // minutos
  price: number
  commissionRate: number   // percentual, ex: 20
  active: boolean
  order: number
}
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega categorias e serviços mock |
| `servicesByCategory` | `computed` — agrupa serviços por categoria com a categoria expandida |
| `createService(data)` | Adiciona serviço e incrementa `servicesCount` da categoria |
| `updateService(id, data)` | Atualiza dados do serviço |
| `toggleServiceActive(id)` | Inverte o estado `active` |
| `reorderServices(categoryId, ids)` | Reordena serviços dentro da categoria (mock) |

## Mock Data

- 3 categorias: Cabelo (cor azul), Barba (cor laranja), Estética (cor verde)
- 8 serviços distribuídos: Corte Masculino (30min, R$45), Escova Progressiva (120min, R$180), etc.

## Integração com PDV

Os serviços carregados via `useServices()` são consumidos diretamente pelo `caixa.vue` (PDV) para montar o catálogo de venda.

## Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| `< sm` (640px) | Header empilha verticalmente (título/descrição acima, botões abaixo com `shrink-0`) |
