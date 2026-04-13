# Tela 10 — Caixa / PDV

**Rota:** `/saas/caixa`
**Arquivo:** `layers/saas/pages/saas/caixa.vue`
**Composables:** `useServices()`, `useProfessionals()`, `useCustomers()`, `useFinancial()`

## Visão Geral

Ponto de Venda (PDV) integrado ao sistema de agendamentos. Permite registrar vendas de serviços e produtos, selecionar cliente e profissional, aplicar descontos e processar pagamentos. Também exibe histórico de vendas.

## Modos de Visualização

| Modo | Conteúdo |
|------|---------|
| `pdv` | Interface de venda ativa (catálogo + carrinho) |
| `historico` | ZimaTable com vendas anteriores filtráveis |

## Layout do PDV (2 colunas)

**Esquerda — Catálogo:**
- Tabs: `servicos` / `produtos`
- Busca com debounce 300ms
- Cards de serviço/produto com preço e botão "+ Adicionar"
- Produtos com campo de quantidade e estoque disponível

**Direita — Carrinho:**
- Lista de itens adicionados (nome, qty, valor unitário, subtotal)
- Campo de desconto (R$ ou %)
- Seletor de cliente (ZimaSearchAutocomplete)
- Seletor de profissional (responsável pela comissão)
- Forma de pagamento (PIX / Dinheiro / Cartão crédito / Cartão débito)
- Total a pagar
- Botão "Finalizar Venda"

## Pre-fill via Query Params

A tela aceita query params para iniciar o PDV pré-preenchido (ex: ao clicar "Iniciar atendimento" na agenda):

| Param | Efeito |
|-------|--------|
| `appointmentId` | Vincula a venda ao agendamento |
| `clientId` | Pré-seleciona o cliente |
| `serviceId` | Adiciona serviço ao carrinho automaticamente |
| `professionalId` | Pré-seleciona o profissional |

```typescript
// Leitura dos params na inicialização
const { appointmentId, clientId, serviceId, professionalId } = route.query
```

## Produtos Mock

A tab "Produtos" usa uma lista local de produtos com estoque (não integrado ao `useInventory()` nesta versão — integração futura):

```typescript
interface MockProduct {
  id: string
  name: string
  price: number
  stock: number
  imageUrl?: string
  category: string
}
```

## Fluxo de Finalização de Venda

1. Usuário monta o carrinho
2. Seleciona cliente, profissional e forma de pagamento
3. Click "Finalizar Venda" → modal de confirmação com resumo
4. Confirmação → `addTransaction()` registra no financeiro → toast "Venda registrada"
5. Carrinho é limpo, modo volta para seleção de cliente

## Histórico de Vendas

ZimaTable com colunas: data/hora, cliente, profissional, itens, total, forma de pagamento, status.
Filtros: período, profissional, forma de pagamento.
