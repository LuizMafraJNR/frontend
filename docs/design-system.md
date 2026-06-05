# Design System — Zima Blue Business

> Sistema de design oficial do portal SaaS Zima. Enterprise dark, sofisticado, profissional.
> Referências visuais: Linear App · Vercel Dashboard · Stripe Dashboard.

---

## 1. Visão Geral

O **Zima Blue Business** é um design system dark-first criado para o portal de gestão SaaS. Todo o sistema é baseado em CSS custom properties (tokens) e componentes Vue reutilizáveis.

**Princípios:**
- **Hierarquia clara** — tipografia, cor e espaçamento comunicam importância
- **Densidade controlada** — informação densa mas com respiro adequado
- **Consistência sistêmica** — mesmos padrões em todas as 14 telas
- **Tokens first** — nenhuma cor hex hardcoded nos templates

**Fontes:**
- Display/Headings: `Geist` → via `var(--zima-font-display)`
- Interface/Body: `Geist Sans` → via `var(--zima-font-body)` (aplicado no `html, body`)
- Números/Valores: `Geist Mono` → via `var(--zima-font-mono)` ou classe `.zima-mono`

---

## 2. Paleta de Cores

Todos os tokens são CSS custom properties definidos em `app/assets/css/tokens-zima.css`.

### Backgrounds (camadas de profundidade)

| Token | Valor | Uso |
|---|---|---|
| `--zima-bg-base` | `#07090E` | Fundo da aplicação (app background) |
| `--zima-bg-surface-1` | `#0C1017` | Sidebar, painéis laterais |
| `--zima-bg-surface-2` | `#111520` | Cards, containers, inputs |
| `--zima-bg-surface-3` | `#161B28` | Dropdowns, modais, tooltips |
| `--zima-bg-surface-hover` | `#1A2030` | Hover em itens de lista |
| `--zima-bg-surface-active` | `#1E2538` | Item selecionado/ativo |

### Zima Blue — Accent primário

| Token | Valor | Uso |
|---|---|---|
| `--zima-blue-core` | `#3B82F6` | Botões primários, links, tabs ativos |
| `--zima-blue-light` | `#60A5FA` | Hover states, ícones ativos, texto de destaque |
| `--zima-blue-pale` | `#93C5FD` | Labels ativos em dark mode |
| `--zima-blue-intense` | `#2563EB` | Pressed state de botões |
| `--zima-blue-subtle` | `rgba(59,130,246,0.08)` | Background de item ativo na sidebar |
| `--zima-blue-glow` | `rgba(59,130,246,0.15)` | Badge backgrounds, glows |

### Semânticas

| Token | Valor | Uso |
|---|---|---|
| `--zima-success` | `#10B981` | Confirmado, pago, ativo |
| `--zima-success-subtle` | `rgba(16,185,129,0.1)` | Background de badge success |
| `--zima-success-border` | `rgba(16,185,129,0.2)` | Borda de alert success |
| `--zima-warning` | `#F59E0B` | Pendente, atenção, alerta |
| `--zima-warning-subtle` | `rgba(245,158,11,0.1)` | Background de badge warning |
| `--zima-warning-border` | `rgba(245,158,11,0.2)` | Borda de alert warning |
| `--zima-danger` | `#EF4444` | Cancelado, erro, vencido |
| `--zima-danger-subtle` | `rgba(239,68,68,0.1)` | Background de badge danger |
| `--zima-danger-border` | `rgba(239,68,68,0.2)` | Borda de alert danger |
| `--zima-info` | `#6366F1` | Informativo, dica |
| `--zima-info-subtle` | `rgba(99,102,241,0.1)` | Background de badge info |

### Hierarquia de Texto

| Token | Valor | Uso |
|---|---|---|
| `--zima-text-primary` | `#F1F5F9` | Títulos, valores, dados importantes |
| `--zima-text-secondary` | `#94A3B8` | Labels, descrições, apoio |
| `--zima-text-muted` | `#64748B` | Placeholders, timestamps, metadata |
| `--zima-text-disabled` | `#475569` | Estados desabilitados, rótulos de seção |

### Bordas e Divisores

| Token | Valor | Uso |
|---|---|---|
| `--zima-border-default` | `rgba(148,163,184,0.08)` | Bordas estruturais de cards/inputs |
| `--zima-border-hover` | `rgba(148,163,184,0.15)` | Hover/focus em elementos interativos |
| `--zima-border-active` | `rgba(59,130,246,0.30)` | Item selecionado (sidebar ativo) |
| `--zima-border-divider` | `rgba(148,163,184,0.06)` | Divisores horizontais entre itens |
| `--zima-border-modal` | `rgba(148,163,184,0.10)` | Bordas de modais e drawers |

---

## 3. Tipografia

```css
/* Fontes */
--zima-font-display: 'Geist', 'Instrument Sans', 'Manrope', system-ui, sans-serif;
--zima-font-body:    'Geist Sans', 'DM Sans', system-ui, sans-serif;
--zima-font-mono:    'Geist Mono', 'IBM Plex Mono', 'JetBrains Mono', monospace;
```

### Escala tipográfica

| Token | Valor | Uso |
|---|---|---|
| `--zima-text-display` | `32px` | Hero titles (raramente usado) |
| `--zima-text-h1` | `24px` | Título de página (ZimaPageHeader) |
| `--zima-text-h2` | `20px` | Título de seção importante |
| `--zima-text-h3` | `16px` | Título de card/subseção |
| `--zima-text-body` | `14px` | Texto de interface padrão |
| `--zima-text-small` | `12px` | Labels, badges, metadata |
| `--zima-text-micro` | `11px` | Labels uppercase de seção, timestamps |

**Regras:**
- Títulos de página: `font-family: var(--zima-font-display)`, `font-weight: 700`, `24px`
- Interface padrão: `font-family: var(--zima-font-body)`, `font-size: 13–14px`
- Valores monetários: `font-family: var(--zima-font-mono)` ou classe `.zima-mono`
- Labels de seção: `font-size: 11px`, `font-weight: 700`, `letter-spacing: 0.06em`, `text-transform: uppercase`
- **Nunca** use `font-family: 'Geist Mono', monospace` inline — sempre via `var(--zima-font-mono)`

---

## 4. Espaçamento

### Tokens de layout

| Token | Valor | Uso |
|---|---|---|
| `--zima-content-padding` | `24px` (desktop) / `16px` (tablet) / `12px` (mobile) | Padding do conteúdo principal |
| `--zima-page-gap` | `24px` | Entre seções principais de uma página |
| `--zima-section-gap` | `16px` | Entre elementos dentro de uma seção |
| `--zima-sidebar-width` | `240px` | Largura da sidebar expandida |
| `--zima-sidebar-width-collapsed` | `64px` | Largura da sidebar colapsada |
| `--zima-topbar-height` | `56px` | Altura da barra superior |

### Padrão de espaçamento para páginas

```vue
<!-- Padrão de espaçamento entre seções -->
<div class="flex flex-col gap-6">  <!-- gap-6 = 24px = --zima-page-gap -->
  <SeçãoPrincipal />
  <SeçãoPrincipal />
</div>

<!-- Dentro de uma seção -->
<div class="flex flex-col gap-4">  <!-- gap-4 = 16px = --zima-section-gap -->
  <ElementoInterno />
  <ElementoInterno />
</div>
```

### Classes utilitárias

```css
.zima-mono     { font-family: var(--zima-font-mono); }
.zima-display  { font-family: var(--zima-font-display); }
.zima-page-gap    { margin-bottom: var(--zima-page-gap); }
.zima-section-gap { margin-bottom: var(--zima-section-gap); }
.zima-settings-section-title { font-size: 15px; font-weight: 600; ... }
.zima-settings-section-desc  { font-size: 13px; color: var(--zima-text-muted); ... }
.zima-subsection-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; ... }
```

---

## 5. Elevação (Camadas de Surface)

Hierarquia de profundidade — use a camada imediatamente acima do fundo:

```
Page background    → var(--zima-bg-base)         #07090E
Sidebar / Panels   → var(--zima-bg-surface-1)    #0C1017
Cards / Containers → var(--zima-bg-surface-2)    #111520  ← padrão de ZimaCard
Dropdowns / Modais → var(--zima-bg-surface-3)    #161B28
Hover state        → var(--zima-bg-surface-hover) #1A2030
Active/Selected    → var(--zima-bg-surface-active) #1E2538
```

---

## 6. Bordas, Sombras e Border Radius

### Border Radius

| Token | Valor | Uso |
|---|---|---|
| `--zima-radius-xs` | `4px` | Badges, tags pequenas |
| `--zima-radius-sm` | `6px` | Inputs, botões |
| `--zima-radius-md` | `8px` | Cards, containers (`ZimaCard` padrão) |
| `--zima-radius-lg` | `12px` | Modais, drawers, painéis |
| `--zima-radius-xl` | `16px` | Painéis grandes |
| `--zima-radius-full` | `9999px` | Avatares, dots de status, badges pill |

### Sombras

| Token | Uso |
|---|---|
| `--zima-shadow-sm` | Cards com hover, elementos elevados sutis |
| `--zima-shadow-md` | Dropdowns, menus flutuantes |
| `--zima-shadow-lg` | Modais, drawers |
| `--zima-shadow-dropdown` | Menus dropdown |
| `--zima-shadow-modal` | Modais/drawers com overlay |

---

## 7. Componentes

### Componentes Zima Blue (layer `saas/components/zima/`)

#### `ZimaPageHeader` ⭐ Novo
Cabeçalho padronizado para **todas** as páginas do SaaS.

```vue
<ZimaPageHeader
  title="Nome da Tela"
  description="Descrição curta e informativa"
  badge="42"
>
  <template #actions>
    <ZimaButton variant="primary">Ação Principal</ZimaButton>
  </template>
  <template #tabs>
    <ZimaSubTabs v-model="activeTab" :tabs="tabs" />
  </template>
</ZimaPageHeader>
```

Props: `title` (required), `description?`, `badge?`
Slots: `#actions` (botões direita), `#tabs` (sub-tabs abaixo), `#badge` (badge customizado)

---

#### `ZimaSubTabs` ⭐ Novo
Navegação por abas com border-bottom azul. Substitui o padrão manual duplicado em 10+ telas.

```vue
<ZimaSubTabs
  v-model="activeTab"
  :tabs="[
    { key: 'visao-geral', label: 'Visão Geral' },
    { key: 'receitas', label: 'Receitas', count: 42 },
    { key: 'despesas', label: 'Despesas', disabled: false },
  ]"
/>
```

Props: `tabs: ZimaSubTab[]`, `modelValue: string`, `spaced?: boolean` (margem inferior padrão)
`ZimaSubTab`: `{ key, label, count?, disabled? }`

---

#### `ZimaTextarea` ⭐ Novo
Área de texto estilizada, visual idêntico ao `ZimaInput`.

```vue
<ZimaTextarea
  v-model="texto"
  label="Observações"
  placeholder="Digite aqui..."
  hint="Máximo 500 caracteres"
  :rows="4"
  resize="vertical"
/>
```

Props: `modelValue?`, `label?`, `placeholder?`, `hint?`, `error?`, `disabled?`, `required?`, `rows?` (default: 3), `resize?` (default: 'vertical'), `maxHeight?`

---

#### `ZimaAlert` ⭐ Novo
Alerta contextual inline (não é toast). Para uso dentro de cards, modais, drawers.

```vue
<ZimaAlert
  variant="warning"
  message="Estoque abaixo do mínimo"
  :dismissible="true"
  @dismiss="handleDismiss"
/>

<!-- Ou com slot para conteúdo customizado -->
<ZimaAlert variant="danger">
  <p>Mensagem de <strong>erro crítico</strong> aqui.</p>
</ZimaAlert>
```

Props: `variant` ('info' | 'success' | 'warning' | 'danger'), `message?`, `icon?` (default: true), `dismissible?`

---

#### `ZimaButton`
Botão padrão com 4 variantes e 4 tamanhos.

```vue
<ZimaButton variant="primary" size="sm" :loading="isLoading">
  <template #icon-left><Icon name="i-lucide-plus" style="width:14px;height:14px;" /></template>
  Novo Item
</ZimaButton>
```

Variantes: `primary | secondary | ghost | danger`
Tamanhos: `xs | sm | md | lg`
Props adicionais: `loading`, `disabled`, `iconOnly`, `as` (elemento HTML)

---

#### `ZimaCard`
Container principal com hierarquia visual.

```vue
<ZimaCard padding="md" variant="default">
  <template #header>
    <span>Título do Card</span>
  </template>
  <template #header-actions>
    <ZimaButton variant="ghost" size="sm">Ação</ZimaButton>
  </template>
  <!-- conteúdo -->
</ZimaCard>
```

Variantes: `default | elevated | ghost | highlight`
Padding: `none | sm (16px) | md (20px) | lg (24px)`
Slots: `#header`, `#header-actions` (lado direito do header), `default`, `#footer`

---

#### `ZimaInput`
Campo de texto com visual dark mode.

```vue
<ZimaInput
  v-model="value"
  label="Nome do cliente"
  placeholder="Digite o nome..."
  hint="Mínimo 3 caracteres"
  :error="errors.name"
  required
/>
```

Props: `modelValue?`, `type?`, `label?`, `placeholder?`, `hint?`, `error?`, `disabled?`, `loading?`, `required?`, `prefix?`, `suffix?`

---

#### `ZimaSelect`
Select estilizado com opções em dropdown.

```vue
<ZimaSelect
  v-model="status"
  :options="[
    { label: 'Todos', value: '__all__' },
    { label: 'Ativo', value: 'ACTIVE' },
  ]"
  label="Status"
/>
```

---

#### `ZimaTable`
Tabela enterprise com sorting, seleção e paginação.

```vue
<ZimaTable
  :columns="[
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'status', label: 'Status', width: '100px' },
    { key: 'actions', label: '', width: '80px', align: 'right' },
  ]"
  :rows="items"
  row-clickable
  empty-title="Nenhum item"
  empty-icon="i-lucide-inbox"
  @row-click="row => navigateTo(`/saas/item/${row.id}`)"
>
  <template #cell-status="{ row }">
    <ZimaBadge :variant="row.statusVariant">{{ row.statusLabel }}</ZimaBadge>
  </template>
</ZimaTable>
```

---

#### `ZimaBadge`
Badge semântico com 6 variantes. **Não existe `variant="default"`** — use `neutral`.

```vue
<ZimaBadge variant="success" size="sm">Confirmado</ZimaBadge>
<ZimaBadge variant="warning">Pendente</ZimaBadge>
<ZimaBadge variant="danger" :dot="true">Crítico</ZimaBadge>
<ZimaBadge variant="blue">3</ZimaBadge>
```

Variantes: `success | warning | danger | info | neutral | blue`
Props: `variant`, `size` (sm | md), `dot`, `removable`, `uppercase`

---

#### `ZimaKpiCard`
Card de métrica com valor, variação e sparkline.

```vue
<ZimaKpiCard
  label="Faturamento"
  value="R$ 12.847,90"
  change="+12.4"
  change-suffix="%"
  icon="i-lucide-trending-up"
  clickable
  @click="navigateTo('/saas/financeiro')"
>
  <template #chart><!-- SVG sparkline --></template>
</ZimaKpiCard>
```

---

#### `ZimaModal`
Modal com 5 tamanhos e overlay blur.

```vue
<ZimaModal v-model="isOpen" title="Título do Modal" size="lg">
  <!-- conteúdo -->
  <template #footer="{ close }">
    <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
    <ZimaButton @click="save">Salvar</ZimaButton>
  </template>
</ZimaModal>
```

Tamanhos: `sm (400px) | md (560px) | lg (720px) | xl (960px) | full (95vw)`

---

#### `ZimaDrawer`
Painel lateral deslizante (largura padrão 480px).

```vue
<ZimaDrawer v-model="isOpen" title="Detalhes" width="520px">
  <!-- conteúdo -->
</ZimaDrawer>
```

---

#### `ZimaSkeleton`
Loading state com animação shimmer.

```vue
<ZimaSkeleton preset="card" height="200px" />
<ZimaSkeleton preset="text" />
<ZimaSkeleton preset="avatar" />
```

Presets: `text | title | avatar | block | card`

---

#### `ZimaAvatar`
Avatar com fallback de iniciais e status indicator.

```vue
<ZimaAvatar name="Maria Silva" size="md" status="online" />
```

Tamanhos: `xs | sm | md | lg`
Status: `online | offline | busy | undefined`

---

#### `ZimaTabs`
Componente de tabs com suporte a counts e ícones (mais completo que ZimaSubTabs).

```vue
<ZimaTabs
  :tabs="[{ key: 'tab1', label: 'Tab 1', icon: 'i-lucide-home', count: 5 }]"
  v-model="activeKey"
/>
```

---

#### `ZimaToggle`
Switch on/off.

```vue
<ZimaToggle v-model="enabled" label="Ativo" size="sm" />
```

---

#### `ZimaEmptyState`
Estado vazio padronizado.

```vue
<ZimaEmptyState
  icon="i-lucide-inbox"
  title="Nenhum item encontrado"
  description="Crie seu primeiro item para começar."
>
  <template #action>
    <ZimaButton>Criar</ZimaButton>
  </template>
</ZimaEmptyState>
```

---

## 8. Padrões de Página

### Page Header (obrigatório em todas as telas)

```vue
<ZimaPageHeader title="Nome da Tela" description="Subtítulo informativo">
  <template #actions>
    <!-- ZimaButtons aqui -->
  </template>
  <template #tabs>
    <!-- ZimaSubTabs se a tela tiver abas -->
  </template>
</ZimaPageHeader>
```

### Toolbar (filtros + ações)

```html
<div class="zima-toolbar">
  <div class="zima-toolbar__filters">
    <ZimaInput v-model="search" placeholder="Buscar..." style="max-width: 280px;" />
    <ZimaSelect v-model="statusFilter" :options="statusOptions" style="width: 180px;" />
  </div>
  <div class="zima-toolbar__actions">
    <ZimaButton variant="primary">Novo Item</ZimaButton>
  </div>
</div>
```

### KPI Row (métricas no topo da tela)

```html
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <ZimaKpiCard label="Total" value="42" icon="i-lucide-hash" />
  <!-- ... -->
</div>
```

### Section Layout (seções internas)

```html
<div class="flex flex-col gap-6">
  <!-- Seção 1 -->
  <ZimaCard padding="md">
    <template #header>
      <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">
        Título da Seção
      </span>
    </template>
    <template #header-actions>
      <ZimaButton size="sm" variant="ghost">Ação</ZimaButton>
    </template>
    <!-- conteúdo da seção -->
  </ZimaCard>
</div>
```

### Dropdown 3-dot (menus de linha em tabelas)

```html
<div style="position: relative;">
  <button @click.stop="openDropdownId = openDropdownId === item.id ? null : item.id">
    <Icon name="i-lucide-more-vertical" />
  </button>
  <div v-if="openDropdownId === item.id" style="position: fixed; inset: 0; z-index: 39;" @click="openDropdownId = null" />
  <div v-if="openDropdownId === item.id" class="zima-dropdown-menu">
    <button class="zima-dropdown-item" @click="edit(item)">
      <Icon name="i-lucide-edit" /> Editar
    </button>
    <button class="zima-dropdown-item zima-dropdown-item--danger" @click="remove(item)">
      <Icon name="i-lucide-trash-2" /> Excluir
    </button>
  </div>
</div>
```

### Card Selecionável (radio/checkbox visual)

```html
<div
  class="zima-selectable-card"
  :class="{ 'zima-selectable-card--active': selected === option.key }"
  @click="selected = option.key"
>
  {{ option.label }}
</div>
```

---

## 9. Padrões de Modal/Drawer

### Estrutura padrão de modal

```vue
<ZimaModal v-model="isOpen" title="Criar Novo Item" size="lg">
  <div class="flex flex-col gap-4">
    <!-- grid 2 colunas para pares de campos -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ZimaInput v-model="form.name" label="Nome" required />
      <ZimaInput v-model="form.phone" label="Telefone" />
    </div>
    <ZimaTextarea v-model="form.notes" label="Observações" :rows="3" />
    <!-- alert de erro se necessário -->
    <ZimaAlert v-if="error" variant="danger" :message="error" />
  </div>
  <template #footer="{ close }">
    <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
    <ZimaButton :loading="saving" @click="save">Salvar</ZimaButton>
  </template>
</ZimaModal>
```

**Regras:**
- Padding interno: gap-4 entre campos, gap-6 entre seções
- Grid de campos: `grid-cols-1 sm:grid-cols-2 gap-4`
- Textareas: sempre `ZimaTextarea`, nunca `<textarea style="...">`
- Erros: `ZimaAlert variant="danger"` antes do footer

### Grid de time slots (padrão unificado)

```html
<div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
  <button
    v-for="slot in timeSlots"
    :key="slot"
    class="zima-selectable-card text-sm font-medium text-center"
    :class="{ 'zima-selectable-card--active': selectedTime === slot }"
    @click="selectedTime = slot"
  >
    {{ slot }}
  </button>
</div>
```

---

## 10. Responsividade

### Breakpoints

| Breakpoint | Largura | Tailwind | Uso |
|---|---|---|---|
| Mobile | `< 640px` | `sm:` | Stack vertical, ocultar colunas |
| Tablet | `640–1023px` | `md:` | Grid 2 colunas |
| Desktop | `≥ 1024px` | `lg:` | Sidebar fixa, grid completo |
| Wide | `≥ 1280px` | `xl:` | Grid 4+ colunas, layout máximo |

### Comportamento mobile (<1024px)

- **Sidebar:** Drawer off-canvas (oculto por padrão, abre via hamburguer)
- **Tabelas:** Scroll horizontal (`overflow-x-auto`)
- **KPI grids:** 2 colunas (`grid-cols-2 sm:grid-cols-4`)
- **Toolbars:** Stack vertical (`flex-col sm:flex-row`)
- **Modais:** Full-width (`size="full"` em mobile)
- **Inbox:** Painel único com navegação por view
- **Caixa/PDV:** Tab bar fixo no bottom (Serviços | Carrinho)

### Padrão de responsividade CSS-first

```vue
<!-- Gate mobile/desktop via CSS (sem flicker de hidratação) -->
<style scoped>
@media (max-width: 1023px) {
  .coluna-profissional { display: none; }
}
</style>
```

Para estado reativo mobile, usar `useWindowSize()` do VueUse:

```typescript
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640)
```

---

## 11. Acessibilidade

### Focus rings

Todos os elementos interativos devem ter focus visible. Nos componentes Zima, isso é automático via:

```html
class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zima-focus-outline)]"
```

### ARIA labels

```html
<!-- Botões sem texto visível -->
<button aria-label="Fechar menu">
  <Icon name="i-lucide-x" aria-hidden="true" />
</button>

<!-- Item de navegação ativo -->
<a :aria-current="isActive ? 'page' : undefined">...</a>

<!-- Estado de carregamento -->
<div role="status" aria-live="polite">Carregando...</div>

<!-- Inputs com erro -->
<input :aria-invalid="hasError" :aria-describedby="`${id}-error`" />
```

### Contraste mínimo

- Texto primário (`#F1F5F9`) sobre background base (`#07090E`): ratio ~17:1 ✅
- Texto muted (`#64748B`) sobre surface-2 (`#111520`): ratio ~4.5:1 ✅
- Texto disabled (`#475569`) — intencionalmente abaixo de 4.5:1 (uso correto para disabled)

---

## 12. Ícones

Use sempre `@nuxt/icon` com a coleção `lucide`. **Nunca `@nuxt/ui`** (não instalado).

```vue
<!-- ✅ Correto -->
<Icon name="i-lucide-calendar" style="width: 16px; height: 16px;" aria-hidden="true" />

<!-- ❌ Errado — não está instalado -->
<UIcon name="i-lucide-calendar" />
```

**Tamanhos padrão:**
- Em botões: `14px × 14px`
- Em toolbars/headers: `16px × 16px`
- Em cards de feature: `18–20px × 18–20px`
- Em estados vazios: `32–40px × 32–40px`
- `stroke-width: 1.5px` para estilo mais refinado (padrão do projeto)

---

## 13. Animações

Definidas em `app/assets/css/main.css`:

| Animação | Uso |
|---|---|
| `zima-shimmer` | Loading skeleton (ZimaSkeleton) |
| `zima-slide-in-right` | Toast notifications |
| `zima-fade-in` | Overlay/backdrop |
| `zima-scale-in` | Modais, dropdowns |

**Durations:**
- `--zima-duration-fast: 100ms` — micro-interações
- `--zima-duration-base: 150ms` — hover states (padrão)
- `--zima-duration-medium: 200ms` — modais, transitions
- `--zima-duration-slow: 300ms` — page transitions

---

## 14. Regras do CLAUDE.md

Ao criar ou modificar telas, seguir estas regras inegociáveis:

1. **ZimaPageHeader** em todas as telas (`title` + `description` obrigatórios)
2. **ZimaSubTabs** para navegação por abas (não criar tabs inline)
3. **ZimaTextarea** para campos de texto longo (não `<textarea style="...">`)
4. **ZimaAlert** para alertas contextuais (não divs com border-left)
5. **CSS vars** para todas as cores (`var(--zima-*)`, nunca hex hardcoded)
6. **`var(--zima-font-mono)`** para fontes monospace (nunca string literal)
7. **Dropdown 3-dot** seguir padrão com backdrop + `.zima-dropdown-menu`
8. **Grid de time slots**: sempre `grid-cols-4 sm:grid-cols-5` (unificado)
