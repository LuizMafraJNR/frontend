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

## Deploy SSR com Docker (artefato compilado)

Para deploy em servidor com Docker, o padrao adotado e runtime puro:

1. O build Nuxt SSR deve ser gerado antes da imagem (`npm run build`)
2. A imagem copia somente `.output/`
3. O container inicia com `node .output/server/index.mjs`

Beneficios:

- Menor tempo de inicializacao da imagem (sem build no runtime)
- Menor superficie de variacao entre ambientes
- Fluxo simples para CI/CD com artefato pronto

Observacoes:

- O contexto do `docker build` precisa conter `.output/`
- `HOST` e `PORT` podem ser sobrescritos por variaveis de ambiente
