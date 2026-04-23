# Arquitetura — Nuxt Layers

## Visão Geral

O projeto usa **Nuxt Layers** para separar domínios de negócio. Cada layer é uma aplicação Nuxt independente que expõe apenas o necessário para as layers acima dela.

## Hierarquia e Dependências

```
app/                  → pode usar todas as layers
layers/saas/          → SaaS de gestão (16 telas, 21 componentes, 12 composables)
layers/scheduling/    → depende de: core, ui, auth, patients, caregivers
layers/patients/      → depende de: core, ui, auth
layers/caregivers/    → depende de: core, ui, auth
layers/auth/          → depende de: core, ui
layers/ui/            → depende de: core
layers/core/          → sem dependências de layer
```

Regra: **uma layer nunca importa de uma layer acima dela** na hierarquia.

## Responsabilidades por Layer

| Layer      | Pages   | Components     | Stores                   | Repositories   | Composables  |
| ---------- | ------- | -------------- | ------------------------ | -------------- | ------------ |
| core       | não     | não            | não                      | não            | sim (utils)  |
| ui         | não     | sim (base)     | não                      | não            | não          |
| auth       | sim     | sim            | sim                      | sim            | sim          |
| patients   | sim     | sim            | sim                      | sim            | sim          |
| caregivers | sim     | sim            | sim                      | sim            | sim          |
| scheduling | sim     | sim            | sim                      | sim            | sim          |
| **saas**   | **sim** | **sim (Zima)** | **não (singleton refs)** | **não (mock)** | **sim (12)** |

## Patterns Obrigatórios

### Repository Pattern

Todas as chamadas HTTP ficam em `repositories/*.repository.ts`.
Factory function `create*Repository($fetch)` — facilita mock nos testes.
**Nunca** usar `$fetch` direto em componentes ou stores.

```
Component → useXxx() composable → XxxRepository → API
```

### Composable Pattern

Business logic em `composables/use*.ts`.
Composable orquestra repository + store.
Componente chama apenas composable.

### Store Pattern (Pinia)

Stores em `stores/*.store.ts` — apenas estado **compartilhado entre componentes**.
Estado local fica em `ref()`/`reactive()` dentro do composable.

---

## Layer SaaS

**Localização:** `layers/saas/`
**Ativação de layout:** `definePageMeta({ layout: 'saas' })` em cada page

### Sub-estrutura

```
layers/saas/
├── nuxt.config.ts              ← obrigatório (mesmo que vazio)
├── layouts/
│   └── saas.vue                ← layout principal: sidebar + topbar + slot
├── components/
│   └── zima/                   ← prefixo "Zima" — 21 componentes auto-importados
├── composables/                ← 12 composables de domínio
│   ├── useAI.ts
│   ├── useAppointments.ts
│   ├── useCampaigns.ts
│   ├── useCustomers.ts
│   ├── useFinancial.ts
│   ├── useFiscal.ts
│   ├── useInbox.ts
│   ├── useInventory.ts
│   ├── useProfessionals.ts
│   ├── useSaasLayout.ts
│   ├── useServices.ts
│   └── useZimaToast.ts
└── pages/
    └── saas/                   ← 16 telas + modais/drawers extraídos
```

### Padrão de Singleton Refs (substitui Pinia na layer saas)

Os composables da layer `saas` **não usam Pinia**. Em vez disso, declaram `ref()` no escopo do módulo — isso cria uma única instância compartilhada entre todos os componentes que importam o composable.

```typescript
// layers/saas/composables/useCustomers.ts

// ← escopo do módulo: singleton
const customers = ref<Customer[]>([]);
const loading = ref(false);
const initialized = ref(false);

export const useCustomers = () => {
  async function fetchAll() {
    if (initialized.value) return; // ← evita double-fetch
    loading.value = true;
    await new Promise((r) => setTimeout(r, 400)); // mock delay
    customers.value = MOCK_CUSTOMERS;
    initialized.value = true;
    loading.value = false;
  }

  return { customers, loading, fetchAll /* ... */ };
};
```

**Por que não Pinia:** os módulos SaaS são todos mock com dados estáticos; a transição para API real será feita introduzindo repositories e stores Pinia apenas quando necessário, sem refatorar os composables existentes.

### Layout `saas.vue`

O layout injeta automaticamente em toda page:

- `ZimaSidebar` — fixa à esquerda, colapsável, navegação agrupada em 4 grupos (Operacional, Atendimento, Financeiro, Gestão)
- `ZimaTopBar` — fixa no topo, breadcrumbs dinâmicos, notificações, perfil
- `ZimaCommandPalette` — ativada com Ctrl+K / Cmd+K
- `ZimaToast` — container de notificações

Offset do conteúdo é calculado automaticamente via CSS vars:

```css
padding-top: var(--zima-topbar-height); /* 56px */
padding-left: var(--zima-sidebar-width); /* 240px ou 64px colapsado */
```

### Scan de Tailwind para Layers

O `@tailwindcss/vite` **não escaneia automaticamente** layers fora do `app/`. O `app/assets/css/main.css` contém os `@source` obrigatórios:

```css
@source "../../../layers"; /* cuidados-frontend/layers/ */
@source "../.."; /* cuidados-frontend/app/ */
```

Sem esses `@source`, classes Tailwind usadas nos componentes das layers são removidas no build.

## Patterns Obrigatórios

### Repository Pattern

Todas as chamadas HTTP ficam em `repositories/*.repository.ts`.
Factory function `create*Repository($fetch)` — facilita mock nos testes.
**Nunca** usar `$fetch` direto em componentes ou stores.

```
Component → useXxx() composable → XxxRepository → API
```

### Composable Pattern

Business logic em `composables/use*.ts`.
Composable orquestra repository + store.
Componente chama apenas composable.

### Store Pattern (Pinia)

Stores em `stores/*.store.ts` — apenas estado **compartilhado entre componentes**.
Estado local fica em `ref()`/`reactive()` dentro do composable.

## Adicionando uma Nova Layer

1. Criar `layers/<nome>/` com `nuxt.config.ts`
2. Adicionar ao array `extends` em `nuxt.config.ts` (raiz) na posição correta de hierarquia
3. Seguir estrutura: `pages/`, `components/`, `composables/`, `stores/`, `repositories/`
4. Implementar na ordem: types → repository → store → composable → components → pages
5. Atualizar este arquivo com a nova layer e suas dependências

## Layouts

- `default.vue` — layout autenticado (header, nav, content)
- `auth.vue` — layout de autenticação (centralizado, sem nav)
- `saas.vue` _(layer saas)_ — layout SaaS com sidebar + topbar Zima Blue

Páginas definem seu layout via `definePageMeta({ layout: 'saas' })`.

## Padrão Responsivo (layer `saas`)

Breakpoint mobile da layer SaaS: **1024px** (`lg:` do Tailwind). O gate mobile/desktop é feito **via CSS `@media` queries**, não por JS — isso evita flicker de hidratação em SSR. O estado `useSaasLayout().isMobile` existe para lógica comportamental (ex.: body-scroll-lock), mas **nenhum estilo visual depende dele**.

- **Sidebar**: vira drawer off-canvas via classes `.zima-sidebar--mobile-open` + `@media (max-width: 1023.98px)` (ver [components.md](components.md#zimasidebar--comportamento-mobile-drawer)).
- **TopBar**: mantém só o essencial; dropdowns usam `width: min(Xpx, calc(100vw - 32px))` para nunca ultrapassar o viewport. Hamburguer via `lg:hidden` (Tailwind).
- **Main**: `padding-left` é aplicado por `@media (min-width: 1024px)` no layout — em mobile fica `0` por padrão CSS, sem depender de JS.
- **Root do layout**: `overflow-x: hidden` como rede de segurança contra overflow residual de páginas ainda não refatoradas.

### Padrões reutilizáveis em páginas/modais

1. **Toolbars**: sempre `flex flex-wrap gap-*` — nunca `flex` puro com muitos filhos.
2. **Inputs/selects com `width` hardcoded**: usar `max-width: <valor>` em vez de `width`, garantindo colapso em telas estreitas.
3. **Grids em modais**: `grid-cols-1 sm:grid-cols-2` / `grid-cols-2 sm:grid-cols-4` em vez de sempre 2/4 colunas.
4. **`ZimaTabs`**: o próprio componente já embrulha a linha de tabs em `overflow-x-auto hide-scrollbar` — nada a fazer nas páginas.
5. **Tabelas via `ZimaTable`**: já têm `overflow-x-auto` interno.
6. **`ZimaModal` / `ZimaDrawer` / `ZimaCommandPalette`**: já respondem a viewport (`maxWidth: 100vw`, `p-4`) — o conteúdo interno é quem deve usar grids responsivos.

## Deploy SSR com Docker (multi-stage)

Para deploy em servidor com Docker, o padrao adotado e multi-stage:

1. Stage `build`: instala dependencias e executa `npm run build`
2. Stage `runtime`: copia somente `.output/` gerado no stage anterior
3. O container inicia com `node .output/server/index.mjs`

Beneficios:

- Menor tempo de inicializacao do container (sem build no runtime)
- Menor superficie de variacao entre ambientes
- Funciona em plataformas que fazem build remoto a partir do repositorio

Observacoes:

- Nao exige `.output/` previamente no contexto
- `HOST` e `PORT` podem ser sobrescritos por variaveis de ambiente
