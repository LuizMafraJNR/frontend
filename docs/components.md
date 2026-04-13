# Padrões de Componentes e Storybook

## Hierarquia de Componentes

```
layers/ui/components/base/       ← Presentacionais puros, sem lógica de negócio
layers/ui/components/feedback/   ← Toast, Loader, Alert, Badge
layers/<domínio>/components/     ← Componentes específicos do domínio
layers/saas/components/zima/     ← Design System Zima Blue (21 componentes)
app/components/                  ← Shell da aplicação (AppHeader, AppSidebar)
```

## Regras de Nomenclatura

| Tipo | Prefixo | Exemplo |
|---|---|---|
| Base (UI layer) | `Base` | `BaseButton`, `BaseInput`, `BaseModal` |
| Feedback (UI layer) | `App` | `AppLoader`, `AppToast`, `AppAlert` |
| Domínio | Nome do domínio | `PatientCard`, `CaregiverForm`, `ScheduleCalendar` |
| Shell | `App` | `AppHeader`, `AppSidebar`, `AppFooter` |
| SaaS (Zima Blue) | `Zima` | `ZimaButton`, `ZimaTable`, `ZimaModal` |

> **Nunca colocar componentes em `components/layout/`** — o Nuxt adicionaria o prefixo `Layout` automaticamente. Componentes Zima ficam em `components/zima/`.

## Regras de Implementação

- Props tipadas com `defineProps<Interface>()` e `withDefaults()`
- Emits tipados com `defineEmits<{ event: [type] }>()`
- Usar union types para variantes (`'primary' | 'secondary'`), não booleans (`isPrimary`)
- Base components: **zero** chamadas de composable ou store
- Domínio components: chamam composables, **nunca** repository ou store diretamente
- Acessibilidade: `aria-*`, `role`, labels em todos os elementos interativos

## Exemplo de Props Tipadas

```vue
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
})
</script>
```

## Ícones

O projeto usa `@nuxt/icon` com a coleção `lucide`. **Nunca usar `@nuxt/ui` (não instalado).**

```vue
<!-- ✅ Correto -->
<Icon name="i-lucide-calendar" style="width: 18px; height: 18px;" />
<Icon name="i-lucide-settings" style="width: 16px; height: 16px; stroke-width: 1.5px;" />

<!-- ❌ Quebra — @nuxt/ui não está instalado -->
<UIcon name="i-lucide-calendar" />
```

## Storybook

```bash
npm run storybook    # http://localhost:6006
npm run build-storybook   # build estático
```

**Todo componente base DEVE ter uma story** antes de ser mergeado.
Componentes de domínio devem ter stories para estados críticos (vazio, loading, erro, preenchido).

### Estrutura de Story

- Arquivo: `layers/<nome>/stories/<ComponentName>.stories.ts`
- Title: `<Categoria>/<Subcategoria>/<NomeComponente>` (ex: `UI/Base/BaseButton`)
- Tag `autodocs` para gerar documentação automática
- Incluir story para cada variante visual relevante

### Importação do Tipo

```typescript
import type { Meta, StoryObj } from '@storybook-vue/nuxt'
```

## Lazy Loading de Componentes

Para componentes pesados ou abaixo do fold, usar prefixo `Lazy`:

```vue
<!-- Nuxt registra automaticamente como lazy -->
<LazyPatientModal v-if="showModal" />
```

---

## Design System Zima Blue (layer `saas`)

Componentes com prefixo `Zima` — auto-importados a partir de `layers/saas/components/zima/`.

Design "dark enterprise" inspirado em Linear, Vercel e Stripe Dashboard. Tokens em `app/assets/css/tokens-zima.css`.

### Referência Completa de Componentes

| Componente | Props principais | Slots / Emits |
|---|---|---|
| `ZimaButton` | `variant` (primary/secondary/ghost/danger), `size` (xs/sm/md/lg), `loading`, `disabled`, `iconOnly` | `#icon-left`, `#icon-right` / `click` |
| `ZimaInput` | `modelValue`, `type`, `label`, `placeholder`, `hint`, `error`, `disabled`, `prefix`, `suffix` | `update:modelValue`, `blur` |
| `ZimaSelect` | `modelValue`, `options: ZimaSelectOption[]`, `label`, `placeholder`, `clearable`, `disabled` | `update:modelValue` |
| `ZimaSearchAutocomplete` | `modelValue`, `items: ZimaSearchItem[]`, `loading`, `minChars` (default 2), `label` | `update:modelValue`, `select` |
| `ZimaModal` | `modelValue`, `title`, `description`, `size` (sm/md/lg/xl/full), `preventClose`, `danger` | `default`, `#footer` / `update:modelValue`, `close` |
| `ZimaDrawer` | `modelValue`, `title`, `description`, `width` (default 480px), `preventClose` | `#header`, `default`, `#footer` / `update:modelValue`, `close` |
| `ZimaCard` | `variant` (default/elevated/ghost/highlight), `padding` (none/sm/md/lg), `hoverable`, `clickable`, `as` | `default` / `click` |
| `ZimaBadge` | `variant` (success/warning/danger/info/neutral/blue), `size` (sm/md), `dot`, `removable`, `uppercase` | `default` / `remove` |
| `ZimaAvatar` | `src`, `name` (fallback iniciais), `size` (xs/sm/md/lg/xl), `status` (online/offline/busy), `clickable` | `click` |
| `ZimaTable` | `columns: ZimaTableColumn[]`, `rows`, `loading`, `selectable`, `rowClickable`, `total`, `emptyTitle`, `emptyIcon` | `#cell-{key}`, `#actions` / `row-click`, `update:selection` |
| `ZimaSkeleton` | `preset` (text/title/avatar/block/custom), `width`, `height`, `rounded`, `lines`, `avatarSize` | — |
| `ZimaToggle` | `modelValue`, `label`, `labelPosition` (left/right), `disabled`, `size` (sm/md) | `update:modelValue` |
| `ZimaStepper` | `modelValue` (key do step ativo), `steps: ZimaStep[]` | — |
| `ZimaTabs` | `modelValue` (key ativa), `tabs: ZimaTab[]` | `update:modelValue` |
| `ZimaKpiCard` | `label`, `value`, `change` (ex: '+12.4'), `changeSuffix` (default '%'), `icon`, `loading`, `clickable` | `click` |
| `ZimaEmptyState` | `icon`, `title`, `description`, `compact` | `default` (slot CTA) |
| `ZimaCommandPalette` | `items: CommandItem[]` | — (abre via Ctrl+K, integrado com `useSaasLayout()`) |
| `ZimaSidebar` | `groups: SidebarNavGroup[]`, `activeKey`, `logo`, `appName` | `navigate` |
| `ZimaTopBar` | `breadcrumbs`, `notifications`, `userName`, `userAvatar`, `userRole` | `mark-all-read`, `notification-click`, `profile`, `settings`, `logout` |
| `ZimaToast` | `toasts: ZimaToastItem[]` | `dismiss` |
| `ZimaPhonePreview` | `agentName`, `messages: PhoneMessage[]` | — |

### Padrão de ícones em ZimaButton

```vue
<!-- CORRETO: usar slot #icon-left / #icon-right -->
<ZimaButton @click="handler">
  <template #icon-left>
    <Icon name="i-lucide-plus" style="width: 14px; height: 14px;" />
  </template>
  Novo Item
</ZimaButton>

<!-- ERRADO: prop left-icon não existe -->
<ZimaButton left-icon="i-lucide-plus">Novo Item</ZimaButton>
```

### Tipos exportados pelos componentes

```typescript
// ZimaTable
export interface ZimaTableColumn<T = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

// ZimaSelect
export interface ZimaSelectOption {
  label: string
  value: string | number
  disabled?: boolean
  group?: string
}

// ZimaSearchAutocomplete
export interface ZimaSearchItem {
  id: string | number
  label: string
  sublabel?: string
  avatar?: string
}

// ZimaSidebar
export interface SidebarNavItem {
  key: string
  label: string
  icon: string
  to?: string
  badge?: number
  children?: SidebarNavItem[]
}
export interface SidebarNavGroup {
  key: string
  label: string
  items: SidebarNavItem[]
}

// ZimaTopBar
export interface Notification {
  id: string
  title: string
  description?: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'danger'
  to?: string
}

// ZimaToast
export interface ZimaToastItem {
  id: string
  type: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description?: string
  duration?: number   // ms, 0 = persistente
  action?: () => void
  actionLabel?: string
}
```

---

## Composables de Domínio SaaS

Todos os composables usam **mock** com `setTimeout(400ms)` e um `initialized` ref para evitar double-fetch. Prontos para substituição por repositórios reais.

| Composable | Arquivo | Tipos principais | Funções principais |
|---|---|---|---|
| `useAppointments()` | `useAppointments.ts` | `Appointment`, `AppointmentStatus`, `STATUS_STYLE` | `fetchAll`, `updateStatus`, `reschedule`, `cancel` |
| `useCustomers()` | `useCustomers.ts` | `Customer`, `CustomerStatus`, `CUSTOMER_STATUS` | `fetchAll`, `createCustomer`, `updateCustomer`, `searchCustomers` |
| `useServices()` | `useServices.ts` | `Service`, `ServiceCategory` | `fetchAll`, `servicesByCategory`, `createService`, `toggleServiceActive` |
| `useProfessionals()` | `useProfessionals.ts` | `Professional`, `WorkSchedule`, `Blockout` | `fetchAll`, `createProfessional`, `updateSchedule`, `addBlockout` |
| `useFinancial()` | `useFinancial.ts` | `Transaction`, `Receivable`, `Payable`, `CommissionEntry`, `TransactionType`, `TxPaymentMethod` | `fetchAll`, `addTransaction`, `receivePayment`, `payBill`, `kpi` |
| `useInbox()` | `useInbox.ts` | `Conversation`, `InboxMessage`, `ConversationStatus`, `MessageChannel` | `fetchAll`, `sendMessage`, `assumeConversation`, `resolveConversation`, `markAsRead` |
| `useInventory()` | `useInventory.ts` | `Product`, `ProductCategory`, `ProductVariation`, `Supplier`, `StockMovement`, `UnitOfMeasure`, `MovementType` | `fetchAll`, `addProduct`, `updateProduct`, `adjustStock`, `registerEntry`, `addSupplier`, `kpi` |
| `useFiscal()` | `useFiscal.ts` | `FiscalDocument`, `FiscalConfig`, `FiscalDocType`, `FiscalDocStatus`, `FiscalServiceItem`, `FiscalProductItem` | `fetchAll`, `issueNfse`, `issueNfe`, `cancelDocument`, `saveFiscalConfig` |
| `useCampaigns()` | `useCampaigns.ts` | `Campaign`, `CampaignStatus`, `CampaignChannel`, `CampaignType` | `fetchAll`, `createCampaign`, `duplicateCampaign`, `cancelCampaign` |
| `useAI()` | `useAI.ts` | `AIAgentConfig`, `KnowledgeEntry`, `ConvFlow`, `BusinessAutomation`, `AIDashboard` | `fetchAll`, `saveAgentConfig`, `addKnowledgeEntry`, `toggleAutomation` |
| `useSaasLayout()` | `useSaasLayout.ts` | — | `toggleSidebar`, `setupCommandPaletteShortcut`, `sidebarCollapsed`, `commandPaletteOpen` |
| `useZimaToast()` | `useZimaToast.ts` | `ZimaToastItem` | `success()`, `error()`, `warning()`, `info()`, `dismiss()` |

### Constantes exportadas pelos composables

| Composable | Constantes |
|---|---|
| `useCustomers()` | `CUSTOMER_STATUS` — mapa de status → `{ label, variant }` |
| `useAppointments()` | `STATUS_STYLE` — mapa de status → `{ bg, border, label, variant }` |
| `useFiscal()` | `SERVICE_CODES` (10 códigos LC116), `CFOP_OPTIONS` (6 CFOPs), `MUNICIPIOS_NFSE` (10 municípios com URLs) |
