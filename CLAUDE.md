# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

> **REGRA CRÍTICA — NUNCA IGNORAR**
> A cada mudança (nova feature, correção, refactor, novo componente, novo token):
> **verificar se algum `docs/*.md` precisa ser atualizado.**
> Arquitetura mudou? → `docs/architecture.md` | Novo componente? → `docs/components.md`
> Novo token? → `docs/design-tokens.md` | Teste adicionado? → `docs/testing.md`
> Novo idioma? → `docs/i18n.md` | Otimização de performance? → `docs/performance.md`
> Nova tela SaaS? → `docs/screens/XX-nome.md`

---

## Referência Rápida

| Tópico | Documento |
|---|---|
| Arquitetura de layers, patterns, dependências | [docs/architecture.md](docs/architecture.md) |
| Padrões de componentes + Zima Blue | [docs/components.md](docs/components.md) |
| Design tokens (cores, espaçamento, fontes) | [docs/design-tokens.md](docs/design-tokens.md) |
| Testes (Vitest + Vue Testing Library) | [docs/testing.md](docs/testing.md) |
| Internacionalização (pt-BR + en) | [docs/i18n.md](docs/i18n.md) |
| Performance (lazy loading, imagens, SSR) | [docs/performance.md](docs/performance.md) |
| **Telas SaaS (visão geral)** | **[docs/screens/README.md](docs/screens/README.md)** |

## Stack

**Nuxt 4** (SSR) · **TypeScript** strict · **Tailwind v4** via `@tailwindcss/vite` plugin · **Pinia** · **VueUse**
**Vitest** + **Vue Testing Library** · **Storybook 10** (`@storybook-vue/nuxt`)
**@nuxtjs/i18n** (pt-BR padrão, en com prefixo `/en/`) · **@nuxt/image** · **@nuxt/icon** (coleção `lucide`)

> ⚠️ O projeto usa `@nuxt/icon` — nunca `@nuxt/ui`. Ícones via `<Icon name="i-lucide-*" />`.
> ⚠️ `nuxt-api-shield` é **incompatível com Nuxt 4** — não adicionar nos módulos.

## Comandos

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção (npx nuxi build)
npm run typecheck        # Verificação de tipos (vue-tsc)
npm run test             # Testes unitários
npm run test:watch       # Testes em modo watch
npm run storybook        # Storybook em localhost:6006
npm run lint             # ESLint
npm run lint:fix         # ESLint com auto-fix
```

## Convenções Inegociáveis

1. **Repository Pattern** — toda chamada HTTP via `create*Repository($fetch)`. Nunca `$fetch` em componentes
2. **Composable Pattern** — business logic em `useXxx()`. Componente chama composable, nunca repository/store direto
3. **i18n** — todo texto visível ao usuário via `t('chave')`. Sem strings hardcoded em templates *(exceção: layer saas usa strings diretas no mock — adicionar i18n ao conectar API real)*
4. **Imagens** — sempre `<NuxtImg>` ou `<NuxtPicture>`, nunca `<img>`
5. **Stories** — todo componente base precisa de `.stories.ts` antes de ser mergeado

## Estrutura de Layers

```
layers/core/       → tipos, utils, composables base (sem UI, sem pages)
layers/ui/         → BaseButton, BaseInput, BaseCard, AppLoader (sem stores, sem API)
layers/auth/       → login, register, sessão, middleware global
layers/patients/   → domínio de pacientes
layers/caregivers/ → domínio de cuidadores
layers/scheduling/ → domínio de agendamentos
layers/saas/       → SaaS de gestão: 16 telas, 12 composables, 21 componentes Zima Blue
```

**Cada layer DEVE ter seu próprio `nuxt.config.ts`** (mesmo que vazio: `export default defineNuxtConfig({})`).

Ver regras completas de dependência em [docs/architecture.md](docs/architecture.md).

---

## SaaS — Módulos e Telas

A layer `saas` implementa um SaaS de gestão para negócios de cuidados pessoais, beleza e estética. Todas as telas estão em `layers/saas/pages/saas/` e usam o layout `saas` (`definePageMeta({ layout: 'saas' })`).

| # | Tela | Rota | Composable Principal | Doc |
|---|------|------|---------------------|-----|
| 01 | Dashboard | `/saas` | `useAppointments()` | [docs/screens/01-dashboard.md](docs/screens/01-dashboard.md) |
| 02 | Agenda | `/saas/agenda` | `useAppointments()` + `useProfessionals()` | [docs/screens/02-agenda.md](docs/screens/02-agenda.md) |
| 03 | Clientes | `/saas/clientes` | `useCustomers()` | [docs/screens/03-clientes.md](docs/screens/03-clientes.md) |
| 04 | Serviços | `/saas/servicos` | `useServices()` | [docs/screens/04-servicos.md](docs/screens/04-servicos.md) |
| 05 | Equipe | `/saas/equipe` | `useProfessionals()` | [docs/screens/05-equipe.md](docs/screens/05-equipe.md) |
| 06 | Inbox | `/saas/inbox` | `useInbox()` | [docs/screens/06-inbox.md](docs/screens/06-inbox.md) |
| 07 | IA & Automação | `/saas/ia` | `useAI()` | [docs/screens/07-ia.md](docs/screens/07-ia.md) |
| 08 | Campanhas | `/saas/campanhas` | `useCampaigns()` | [docs/screens/08-campanhas.md](docs/screens/08-campanhas.md) |
| 09 | Financeiro | `/saas/financeiro` | `useFinancial()` | [docs/screens/09-financeiro.md](docs/screens/09-financeiro.md) |
| 10 | Caixa / PDV | `/saas/caixa` | `useServices()` + `useFinancial()` | [docs/screens/10-caixa.md](docs/screens/10-caixa.md) |
| 11 | Estoque | `/saas/estoque` | `useInventory()` | [docs/screens/11-estoque.md](docs/screens/11-estoque.md) |
| 12 | Notas Fiscais | `/saas/notas` | `useFiscal()` | [docs/screens/12-notas.md](docs/screens/12-notas.md) |
| 13 | Relatórios | `/saas/relatorios` | — | [docs/screens/13-relatorios.md](docs/screens/13-relatorios.md) |
| 14 | Configurações | `/saas/configuracoes` | — | [docs/screens/14-configuracoes.md](docs/screens/14-configuracoes.md) |

---

## Padrões SaaS — Regras de Implementação

Estes padrões aparecem em **todas** as telas e devem ser seguidos rigorosamente.

### 1. Sub-tabs (navegação interna de página)

```html
<!-- Container -->
<div style="border-bottom: 1px solid var(--zima-border-divider); display: flex; gap: 4px; margin-bottom: 24px;">
  <button
    v-for="tab in tabs"
    :key="tab.key"
    style="padding: 10px 16px; font-size: 13px; font-weight: 500; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 150ms; white-space: nowrap;"
    :style="{
      color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
      borderBottomColor: activeTab === tab.key ? 'var(--zima-blue-core)' : 'transparent',
      marginBottom: '-1px',
    }"
    @click="activeTab = tab.key"
  >
    {{ tab.label }}
  </button>
</div>
```

> ⚠️ **Nunca** use `border: 'none'` e `borderBottom` no mesmo objeto `:style` — o shorthand `border` sobrescreve `borderBottom`. Use sempre `style` estático para a base e `:style` dinâmico apenas para `borderBottomColor` e `color`.

### 2. Query params sync (persistência de tab na URL)

```typescript
const route = useRoute()
const router = useRouter()
const activeTab = ref<string>((route.query.tab as string) || 'default')
watch(activeTab, v => router.replace({ query: { tab: v } }))
```

### 3. Singleton refs nos composables

Estado compartilhado declarado no **escopo do módulo** (fora da função exportada):

```typescript
// ✅ Correto — singleton: uma única instância entre todos os componentes
const items = ref<Item[]>([])
const loading = ref(false)
const initialized = ref(false)

export const useXxx = () => {
  async function fetchAll() {
    if (initialized.value) return   // evita double-fetch
    loading.value = true
    await new Promise(r => setTimeout(r, 400))
    items.value = MOCK_DATA
    initialized.value = true
    loading.value = false
  }
  return { items, loading, fetchAll }
}
```

### 4. Menus dropdown inline (3-dot / Enviar / etc.)

```typescript
const activeMenuId = ref<string | null>(null)
const closeMenu = () => { activeMenuId.value = null }

onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))
```

Template:
```html
<div style="position: relative;">
  <button @click.stop="activeMenuId = activeMenuId === row.id ? null : row.id">⋮</button>
  <div v-if="activeMenuId === row.id" style="position: absolute; right: 0; top: 100%; z-index: 60; ...">
    <!-- itens do menu -->
  </div>
</div>
```

### 5. Inline styles para tokens CSS

Preferir `style` com CSS variables para cores e superfícies; Tailwind para layout:

```html
<!-- ✅ Correto -->
<div
  class="flex items-center gap-3 p-4 rounded-lg"
  :style="{ background: 'var(--zima-bg-surface-2)', color: 'var(--zima-text-primary)' }"
>

<!-- ❌ Evitar — classes Tailwind não mapeadas podem não funcionar em layers -->
<div class="bg-zima-surface-2 text-zima-text">
```

### 6. Ícones

```html
<!-- ✅ Sempre @nuxt/icon -->
<Icon name="i-lucide-calendar" style="width: 16px; height: 16px;" />

<!-- ❌ Nunca @nuxt/ui (não está instalado) -->
<UIcon name="i-lucide-calendar" />
```

### 7. Scrollbars — padrão global

O `main.css` aplica automaticamente scrollbar fina (4px, `--zima-border-default`, trilho transparente) a **todos** os elementos com `overflow-y-auto`, `overflow-x-auto` ou `style="overflow-y:auto"`.

- **Scroll visível e fino:** apenas usar `overflow-y-auto` ou `style="overflow-y:auto"` — o estilo vem automaticamente
- **Scroll invisível** (tab bars, listas horizontais): adicionar a classe `hide-scrollbar`
- **Nunca** definir `scrollbar-width`, `scrollbar-color` ou `::-webkit-scrollbar` inline — o global já cobre

```html
<!-- ✅ Scroll fino — automático -->
<div class="overflow-y-auto" style="max-height: 460px;">

<!-- ✅ Sem scrollbar visível — tab bars horizontais -->
<div class="overflow-x-auto hide-scrollbar">

<!-- ❌ Não fazer — redundante e pode conflitar com o global -->
<div style="overflow-y: auto; scrollbar-width: thin; ...">
```

### 8. ZimaBadge — variantes válidas

`ZimaBadge` aceita apenas: `success | warning | danger | info | neutral | blue`. **Não existe `variant="default"`** — use `neutral` como padrão genérico.
