# Design Tokens

**Fonte da verdade**: `app/assets/css/tokens.css`
**Mapeamento Tailwind v4**: `app/assets/css/main.css` (bloco `@theme`)

Ao adicionar ou modificar um token:
1. Adicionar variável CSS em `tokens.css`
2. Mapear no `@theme` de `main.css`
3. Documentar na tabela abaixo

## Cores

### Primária (Teal — saúde, confiança)

| Token Tailwind | CSS Variable | Valor | Uso |
|---|---|---|---|
| `primary-50` | `--cuidados-primary-50` | #f0fdf9 | Fundo hover leve |
| `primary-500` | `--cuidados-primary-500` | #14b8a6 | **Brand primary — CTAs** |
| `primary-600` | `--cuidados-primary-600` | #0d9488 | Hover do primary |
| `primary-700` | `--cuidados-primary-700` | #0f766e | Active/pressed |

### Secundária (Azul — calmo, profissional)

| Token Tailwind | CSS Variable | Valor | Uso |
|---|---|---|---|
| `secondary-500` | `--cuidados-secondary-500` | #3b82f6 | Ações secundárias |
| `secondary-700` | `--cuidados-secondary-700` | #1d4ed8 | Hover do secondary |

### Semânticas

| Token Tailwind | Valor | Uso |
|---|---|---|
| `success-500` | #22c55e | Sucesso, confirmação |
| `warning-500` | #f59e0b | Atenção, alerta |
| `danger-500` | #ef4444 | Erro, ação destrutiva |

### Neutras

| Token Tailwind | Valor | Uso |
|---|---|---|
| `neutral-50` | #f9fafb | Fundo da página |
| `neutral-100` | #f3f4f6 | Fundo de cards, inputs |
| `neutral-300` | #d1d5db | Bordas |
| `neutral-500` | #6b7280 | Texto secundário |
| `neutral-700` | #374151 | Texto de labels |
| `neutral-900` | #111827 | Texto principal |

## Tipografia

| Token | CSS Variable | Valor | Uso |
|---|---|---|---|
| `font-sans` | `--cuidados-font-sans` | Inter, system-ui | Texto do corpo |
| `font-heading` | `--cuidados-font-heading` | Poppins, Inter | Títulos (h1–h6) |
| `font-mono` | `--cuidados-font-mono` | JetBrains Mono | Código |

Fontes carregadas via `@nuxt/fonts` (otimizadas automaticamente).

## Espaçamento

O Tailwind v4 usa escala padrão. Tokens customizados estão disponíveis como variáveis CSS:

| CSS Variable | Valor | Equivalente Tailwind |
|---|---|---|
| `--cuidados-spacing-xs` | 4px | `gap-1`, `p-1` |
| `--cuidados-spacing-sm` | 8px | `gap-2`, `p-2` |
| `--cuidados-spacing-md` | 16px | `gap-4`, `p-4` |
| `--cuidados-spacing-lg` | 24px | `gap-6`, `p-6` |
| `--cuidados-spacing-xl` | 32px | `gap-8`, `p-8` |
| `--cuidados-spacing-2xl` | 48px | `gap-12`, `p-12` |

## Z-Index

**Sempre usar as variáveis CSS — nunca usar números brutos.**

| CSS Variable | Valor | Uso |
|---|---|---|
| `--cuidados-z-dropdown` | 100 | Dropdowns, selects |
| `--cuidados-z-sticky` | 200 | Header fixo |
| `--cuidados-z-overlay` | 300 | Overlay de modal |
| `--cuidados-z-modal` | 400 | Modais |
| `--cuidados-z-toast` | 500 | Notificações toast |
| `--cuidados-z-tooltip` | 600 | Tooltips |

```vue
<div :style="{ zIndex: 'var(--cuidados-z-modal)' }">...</div>
```

## Sombras

| Token Tailwind | CSS Variable | Uso |
|---|---|---|
| `shadow-sm` | `--cuidados-shadow-sm` | Elevação mínima |
| `shadow-card` | `--cuidados-shadow-card` | Cards, painéis |
| `shadow-md` | `--cuidados-shadow-md` | Dropdowns |
| `shadow-modal` | `--cuidados-shadow-modal` | Modais |

---

## Design System Zima Blue (SaaS de Gestão)

**Arquivo de tokens**: `app/assets/css/tokens-zima.css`
**Mapeamento Tailwind v4**: `app/assets/css/main.css` (bloco `@theme`, prefixo `zima-*`)
**Layer**: `layers/saas/`

Sistema de design "Zima Blue Business" — dark mode enterprise-grade para a plataforma SaaS
de gestão de negócios de cuidados pessoais, beleza, estética e petshops.

Referências visuais: Linear App, Vercel Dashboard, Stripe Dashboard.

### Backgrounds (camadas de profundidade)

| CSS Variable | Valor | Tailwind Class | Uso |
|---|---|---|---|
| `--zima-bg-base` | `#07090E` | `bg-zima-base` | App background — deep space |
| `--zima-bg-surface-1` | `#0C1017` | `bg-zima-surface-1` | Sidebar, panels |
| `--zima-bg-surface-2` | `#111520` | `bg-zima-surface-2` | Cards, containers |
| `--zima-bg-surface-3` | `#161B28` | `bg-zima-surface-3` | Dropdowns, modais |
| `--zima-bg-surface-hover` | `#1A2030` | `bg-zima-surface-hover` | Hover states |
| `--zima-bg-surface-active` | `#1E2538` | `bg-zima-surface-active` | Active/selected |

### Zima Blue — Accent primário

| CSS Variable | Valor | Tailwind Class | Uso |
|---|---|---|---|
| `--zima-blue-core` | `#3B82F6` | `bg-zima-blue` / `text-zima-blue` | Botões primários, links |
| `--zima-blue-light` | `#60A5FA` | `text-zima-blue-light` | Hover states, ícones ativos |
| `--zima-blue-pale` | `#93C5FD` | `text-zima-blue-pale` | Textos de destaque |
| `--zima-blue-intense` | `#2563EB` | `bg-zima-blue-intense` | Pressed state |
| `--zima-blue-glow` | `rgba(59,130,246,0.15)` | — | Badge backgrounds |
| `--zima-blue-subtle` | `rgba(59,130,246,0.08)` | — | Selected row background |

### Semânticas Zima

| CSS Variable | Valor | Tailwind Class | Uso |
|---|---|---|---|
| `--zima-success` | `#10B981` | `text-zima-success` | Confirmado, pago, ativo |
| `--zima-warning` | `#F59E0B` | `text-zima-warning` | Pendente, atenção |
| `--zima-danger` | `#EF4444` | `text-zima-danger` | Cancelado, erro, vencido |
| `--zima-info` | `#6366F1` | `text-zima-info` | Informativo, dica |

### Texto Zima (hierarquia)

| CSS Variable | Valor | Tailwind Class | Uso |
|---|---|---|---|
| `--zima-text-primary` | `#F1F5F9` | `text-zima-text` | Títulos, valores, dados |
| `--zima-text-secondary` | `#94A3B8` | `text-zima-text-secondary` | Labels, descrições |
| `--zima-text-muted` | `#64748B` | `text-zima-text-muted` | Placeholders, timestamps |
| `--zima-text-disabled` | `#475569` | `text-zima-text-disabled` | Estados desabilitados |

### Border radius Zima

| CSS Variable | Valor | Uso |
|---|---|---|
| `--zima-radius-xs` | `4px` | Badges, tags |
| `--zima-radius-sm` | `6px` | Inputs, buttons |
| `--zima-radius-md` | `8px` | Cards, containers |
| `--zima-radius-lg` | `12px` | Modais, drawers |
| `--zima-radius-full` | `9999px` | Avatares, status dots |

### Sombras Zima

| CSS Variable | Uso |
|---|---|
| `--zima-shadow-sm` | Elevação mínima (cards) |
| `--zima-shadow-md` | Dropdowns |
| `--zima-shadow-lg` | Modais sobre overlays |
| `--zima-shadow-dropdown` | Dropdown panels |
| `--zima-shadow-modal` | Modais / drawers |

### Layout Zima

| CSS Variable | Valor | Uso |
|---|---|---|
| `--zima-sidebar-width` | `240px` | Sidebar expandida (desktop) |
| `--zima-sidebar-width-collapsed` | `64px` | Sidebar colapsada (desktop) |
| `--zima-sidebar-drawer-width` | `280px` | Largura do drawer mobile (`<1024px`) |
| `--zima-topbar-height` | `56px` | Top bar fixa |
| `--zima-content-max-width` | `1280px` | Max-width do conteúdo |
| `--zima-content-padding` | `24px` | Padding lateral (desktop) — `16px` `<1024px`, `12px` `<640px` |

### Tipografia Zima

| CSS Variable | Fontes | Uso |
|---|---|---|
| `--zima-font-display` | Geist, Instrument Sans, Manrope | Títulos, H1–H3 |
| `--zima-font-body` | Geist Sans, DM Sans | Body, interface |
| `--zima-font-mono` | Geist Mono, IBM Plex Mono | Valores monetários, números |

### Componentes Zima (layers/saas/components/zima/)

| Componente | Arquivo | Uso |
|---|---|---|
| `ZimaButton` | `ZimaButton.vue` | Botões primários, secondary, ghost, danger |
| `ZimaInput` | `ZimaInput.vue` | Campos de entrada com label, erro, hint |
| `ZimaCard` | `ZimaCard.vue` | Containers, painéis, cards clicáveis |
| `ZimaBadge` | `ZimaBadge.vue` | Status badges com dot e variantes semânticas |
| `ZimaModal` | `ZimaModal.vue` | Modais com overlay blur e animação |
| `ZimaToast` | `ZimaToast.vue` | Notificações toast com auto-dismiss |
| `ZimaTable` | `ZimaTable.vue` | Tabelas com sorting, seleção, paginação |
| `ZimaAvatar` | `ZimaAvatar.vue` | Avatares com fallback de iniciais |
| `ZimaTabs` | `ZimaTabs.vue` | Tabs com contador e ativação por key |
| `ZimaSkeleton` | `ZimaSkeleton.vue` | Loading skeletons com shimmer |
| `ZimaEmptyState` | `ZimaEmptyState.vue` | Estado vazio com ícone + CTA |
| `ZimaKpiCard` | `ZimaKpiCard.vue` | Card de métrica com variação percentual |
| `ZimaCommandPalette` | `ZimaCommandPalette.vue` | Command palette (Ctrl+K) |
| `ZimaSidebar` | `layout/ZimaSidebar.vue` | Sidebar colapsável com navegação agrupada |
| `ZimaTopBar` | `layout/ZimaTopBar.vue` | Top bar com breadcrumbs, busca e notificações |

### Composables Zima (layers/saas/composables/)

| Composable | Uso |
|---|---|
| `useSaasLayout()` | Estado global: sidebar collapsed, command palette, notificações |
| `useZimaToast()` | API de toasts: `.success()`, `.error()`, `.warning()`, `.info()` |

### Layout Zima

O layout `saas` está em `layers/saas/layouts/saas.vue`.
Ativação em uma page: `definePageMeta({ layout: 'saas' })`

```vue
<!-- pages/saas/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'saas' })
</script>

<template>
  <!-- Conteúdo da page — sidebar + topbar são injetados pelo layout -->
  <ZimaKpiCard label="Faturamento" value="R$ 12.847,90" change="+18.4" />
</template>
```

### Scrollbars Zima

Estilo global definido em `app/assets/css/main.css`, seção `SCROLLBAR PADRÃO ZIMA BLUE`.

| Aspecto | Valor |
|---------|-------|
| Largura (`scrollbar-width`) | `thin` (4px) |
| Cor do thumb | `var(--zima-border-default)` |
| Trilho | `transparent` |
| Hover do thumb | `var(--zima-text-muted)` |
| Border-radius | `9999px` (arredondado) |

**Aplicação automática:** todos os elementos com classe `overflow-y-auto`, `overflow-x-auto` ou `style="overflow-y:auto"` herdam o estilo sem configuração adicional.

**Classe `.hide-scrollbar`:** oculta completamente a scrollbar (mantém scroll funcional). Usar em tab bars horizontais e listas com scroll lateral.

```html
<!-- Scroll fino automático -->
<div class="overflow-y-auto" style="max-height: 400px;">

<!-- Sem scrollbar visível -->
<div class="overflow-x-auto hide-scrollbar">
```

### Adicionando tokens Zima

1. Adicionar variável em `app/assets/css/tokens-zima.css`
2. Mapear no bloco `@theme` de `app/assets/css/main.css` com prefixo `--color-zima-*`
3. Documentar na tabela acima
