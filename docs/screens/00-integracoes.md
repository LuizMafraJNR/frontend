# 00 — Backbone: Persistência + Integrações Cruzadas

> Esta é a "espinha dorsal" que torna o `/saas` um **sistema vivo** em vez de telas de
> cadastro isoladas. Tudo mockado, mas funcionalmente integrado e persistente.

## Persistência (mock, SSR-safe)

Os dados de domínio do SaaS persistem no `localStorage` via `persistedRef(key, seed)`
(`layers/saas/composables/useMockPersistence.ts`).

- **Por que helper próprio:** o app é SSR. `useStorage` do VueUse lê síncrono na 1ª render
  do cliente → mismatch de hidratação. O `persistedRef` cria o ref sempre com o seed
  (servidor e cliente idênticos) e reidrata só client-side.
- **Schema-version (`SCHEMA_VERSION`):** suba o número ao mudar o shape de qualquer dado
  persistido; dados antigos são descartados e re-seedados automaticamente.
- **Reset:** `resetMockData()` limpa e re-seeda (botão "Resetar dados de demonstração" em
  Configurações).
- **Regra de migração:** cada composable de domínio usa `persistedRef` no singleton e tem
  `fetchAll()` com guard `if (initialized.value) return` que **não re-seeda** (re-seedar
  apagaria as mutações a cada navegação).

## Barramento de eventos de domínio

`layers/saas/composables/useDomainEvents.ts` (sobre `useEventBus` do VueUse). Desacopla
quem dispara de quem reage. Eventos tipados:

| Evento | Disparado quando | Consumido por |
|---|---|---|
| `sale:completed` | Venda finalizada no PDV | Notificações, conversão de campanha |
| `stock:low` | Produto cruza o mínimo / zera | Notificações (alerta de estoque) |
| `appointment:statusChanged` | Status de agendamento muda | Notificações (confirmação) |
| `appointment:completed` | Atendimento concluído | NFS-e automática (futuro) |
| `campaign:converted` | Cupom de campanha usado no PDV | Métricas da campanha |

> **Regra de ouro (decisão de arquitetura):** mutações **autoritativas** (gravar transação,
> baixar estoque, registrar comissão) são **chamadas diretas síncronas** no fluxo de origem
> (ex.: `caixa.vue:finalizeSale`). O **bus** carrega **apenas efeitos efêmeros**
> (notificações). Um listener só vive enquanto seu componente está montado — se a baixa de
> estoque fosse um listener, ela falharia quando a tela de estoque não estivesse aberta.

## Integração principal: PDV → Financeiro + Estoque + Comissões

Ao finalizar uma venda (`caixa.vue:finalizeSale`):

1. **Financeiro** — `useFinancial.addTransaction()` grava uma transação `INCOME` (`PAID`).
2. **Estoque** — para cada produto, `useInventory.registerSaleExit()` baixa o estoque e gera
   um `StockMovement` `EXIT`/`SALE` com custo e `saleId`. Se cruzar o mínimo, emite
   `stock:low`.
3. **Comissões** — para cada serviço com profissional, `useFinancial.registerCommission()`
   **agrega** a comissão na `CommissionEntry` do par `(profissionalId, período)` — nunca uma
   linha por venda.
4. **Evento** — emite `sale:completed` (efêmero) → notificação "Venda registrada".

> O catálogo de produtos do PDV agora vem de `useInventory().products` (apenas
> `active && forSale`), não mais de uma lista mock local — é o que permite a baixa real.

## Centro de notificações (topbar + sidebar)

`layers/saas/composables/useNotifications.ts` — singleton persistido que escuta o bus e
materializa notificações reais no sino da `ZimaTopBar`.

- **Registro do listener:** uma vez, em escopo de módulo, guardado por `import.meta.client`
  + flag (idioma de `resizeListenerAttached` em `useSaasLayout.ts`). Nunca em `onMounted`.
- O **badge de não lidas do Inbox** na `ZimaSidebar` vem de `useInbox().totalUnread`
  (navGroups é `computed`).

## Verificação

- `layers/saas/composables/useMockPersistence.test.ts` — persistência (lê/grava/reload).
- `layers/saas/composables/backboneIntegration.test.ts` — venda → financeiro + estoque +
  comissão agregada + evento.
