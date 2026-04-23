<script setup lang="ts">
import type { SidebarNavGroup } from '../components/zima/ZimaSidebar.vue'
import type { Notification } from '../components/zima/ZimaTopBar.vue'

/**
 * Layout padrão do SaaS de gestão — "saas".
 * Uso nas pages: definePageMeta({ layout: 'saas' })
 *
 * Inclui:
 * - ZimaSidebar fixa à esquerda (colapsável)
 * - ZimaTopBar fixa no topo
 * - ZimaCommandPalette (Ctrl+K)
 * - ZimaToast container
 * - Slot de conteúdo com offset automático
 */

const {
  sidebarCollapsed,
  sidebarMobileOpen,
  closeSidebarMobile,
  setupCommandPaletteShortcut,
} = useSaasLayout()
const toast = useZimaToast()

setupCommandPaletteShortcut()

// Navegação da sidebar — configuração central do SaaS
const navGroups: SidebarNavGroup[] = [
  {
    key: 'operacional',
    label: 'Operacional',
    items: [
      { key: 'dashboard',    label: 'Dashboard',     icon: 'i-lucide-layout-dashboard', to: '/saas' },
      { key: 'agenda',       label: 'Agenda',         icon: 'i-lucide-calendar',          to: '/saas/agenda' },
      { key: 'clientes',     label: 'Clientes',       icon: 'i-lucide-users',             to: '/saas/clientes' },
      { key: 'servicos',     label: 'Serviços',       icon: 'i-lucide-scissors',          to: '/saas/servicos' },
      { key: 'profissionais',label: 'Equipe',         icon: 'i-lucide-user-check',        to: '/saas/equipe' },
    ],
  },
  {
    key: 'atendimento',
    label: 'Atendimento',
    items: [
      { key: 'inbox',        label: 'Inbox',          icon: 'i-lucide-message-square',    to: '/saas/inbox', badge: 12 },
      { key: 'ia',           label: 'IA & Automação', icon: 'i-lucide-bot',               to: '/saas/ia' },
      { key: 'campanhas',    label: 'Campanhas',       icon: 'i-lucide-megaphone',         to: '/saas/campanhas' },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    items: [
      { key: 'financeiro',   label: 'Financeiro',     icon: 'i-lucide-trending-up',       to: '/saas/financeiro' },
      { key: 'caixa',        label: 'Caixa / PDV',    icon: 'i-lucide-shopping-cart',     to: '/saas/caixa' },
      { key: 'estoque',      label: 'Estoque',        icon: 'i-lucide-package',           to: '/saas/estoque' },
      { key: 'notas',        label: 'Notas Fiscais',  icon: 'i-lucide-receipt',           to: '/saas/notas' },
    ],
  },
  {
    key: 'gestao',
    label: 'Gestão',
    items: [
      { key: 'relatorios',   label: 'Relatórios',     icon: 'i-lucide-bar-chart-2',       to: '/saas/relatorios' },
      { key: 'configuracoes',label: 'Configurações',  icon: 'i-lucide-settings',          to: '/saas/configuracoes' },
    ],
  },
]

// Command palette items
const commandItems = [
  // Páginas
  { id: 'p-dashboard',     label: 'Dashboard',       icon: 'i-lucide-layout-dashboard', group: 'Páginas',         to: '/saas' },
  { id: 'p-agenda',        label: 'Agenda',           icon: 'i-lucide-calendar',          group: 'Páginas',         to: '/saas/agenda' },
  { id: 'p-clientes',      label: 'Clientes',         icon: 'i-lucide-users',             group: 'Páginas',         to: '/saas/clientes' },
  { id: 'p-financeiro',    label: 'Financeiro',       icon: 'i-lucide-trending-up',       group: 'Páginas',         to: '/saas/financeiro' },
  { id: 'p-estoque',       label: 'Estoque',          icon: 'i-lucide-package',           group: 'Páginas',         to: '/saas/estoque' },
  { id: 'p-inbox',         label: 'Inbox',            icon: 'i-lucide-message-square',    group: 'Páginas',         to: '/saas/inbox' },
  { id: 'p-relatorios',    label: 'Relatórios',       icon: 'i-lucide-bar-chart-2',       group: 'Páginas',         to: '/saas/relatorios' },
  { id: 'p-config',        label: 'Configurações',    icon: 'i-lucide-settings',          group: 'Páginas',         to: '/saas/configuracoes' },
  // Ações rápidas
  { id: 'a-novo-agend',    label: 'Novo Agendamento', icon: 'i-lucide-calendar-plus',     group: 'Ações Rápidas',   shortcut: 'N', action: () => { const s = useState<boolean>('saas:modal:newAppointment', () => false); s.value = true } },
  { id: 'a-nova-venda',    label: 'Nova Venda',       icon: 'i-lucide-shopping-cart',     group: 'Ações Rápidas',   shortcut: 'V', action: () => toast.info('Abrir PDV') },
  { id: 'a-novo-cliente',  label: 'Novo Cliente',     icon: 'i-lucide-user-plus',         group: 'Ações Rápidas',   shortcut: 'C', action: () => toast.info('Abrir cadastro de cliente') },
]

// Notificações mock para demo
const notifications = ref<Notification[]>([
  {
    id: 'n1',
    title: 'Novo agendamento confirmado',
    description: 'Maria Silva agendou Corte + Escova para hoje às 15h',
    time: 'há 5 min',
    read: false,
    type: 'success',
    to: '/saas/agenda',
  },
  {
    id: 'n2',
    title: 'Estoque baixo: Wella Color Touch',
    description: 'Restam apenas 2 unidades. Estoque mínimo: 5',
    time: 'há 23 min',
    read: false,
    type: 'warning',
    to: '/saas/estoque',
  },
  {
    id: 'n3',
    title: 'Avaliação negativa recebida',
    description: 'João Mendes deu 2 estrelas. Verifique e responda.',
    time: 'há 1h',
    read: false,
    type: 'danger',
    to: '/saas/marketing',
  },
  {
    id: 'n4',
    title: 'Pagamento recebido via Pix',
    description: 'R$ 245,00 — Ana Costa (Coloração + Hidratação)',
    time: 'há 2h',
    read: true,
    type: 'success',
  },
])

const route = useRoute()

// Breadcrumbs dinâmicos baseados na rota atual
const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  return segments.map((seg, idx) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    to: idx < segments.length - 1
      ? '/' + segments.slice(0, idx + 1).join('/')
      : undefined,
  }))
})

const activeKey = computed(() => {
  const last = route.path.split('/').filter(Boolean).pop()
  return last || 'dashboard'
})

const handleMarkAllRead = () => {
  notifications.value.forEach(n => n.read = true)
  toast.success('Todas as notificações marcadas como lidas')
}

const handleNotificationClick = (notif: Notification) => {
  notif.read = true
  if (notif.to) navigateTo(notif.to)
}
</script>

<template>
  <div
    class="saas-layout min-h-screen"
    :style="{ background: 'var(--zima-bg-base)', overflowX: 'hidden' }"
  >
    <!-- Overlay mobile — gate por CSS media query (só aparece <1024px) -->
    <Transition name="zima-fade">
      <div
        v-if="sidebarMobileOpen"
        class="saas-layout__mobile-overlay"
        :style="{
          position: 'fixed',
          inset: '0',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 'calc(var(--zima-z-overlay) - 1)',
        }"
        aria-hidden="true"
        @click="closeSidebarMobile"
      />
    </Transition>

    <!-- Sidebar — drawer mobile gerenciado internamente -->
    <ZimaSidebar
      :groups="navGroups"
      :active-key="activeKey"
      :mobile-open="sidebarMobileOpen"
      @navigate="(item) => { if (item.to) { navigateTo(item.to); closeSidebarMobile() } }"
      @close="closeSidebarMobile"
    />

    <!-- Top Bar -->
    <ZimaTopBar
      :breadcrumbs="breadcrumbs"
      :notifications="notifications"
      user-name="Luiz Matos"
      user-role="Proprietário"
      @mark-all-read="handleMarkAllRead"
      @notification-click="handleNotificationClick"
      @profile="navigateTo('/saas/configuracoes/perfil')"
      @settings="navigateTo('/saas/configuracoes')"
      @logout="toast.info('Saindo...')"
    />

    <!-- Main content area — padding-left via CSS media query -->
    <main
      class="saas-layout__main"
      :class="{ 'saas-layout__main--sidebar-collapsed': sidebarCollapsed }"
      :style="{
        paddingTop: 'var(--zima-topbar-height)',
        transition: 'padding-left 200ms ease',
        minHeight: '100vh',
      }"
    >
      <div
        :style="{
          maxWidth: 'var(--zima-content-max-width)',
          margin: '0 auto',
          padding: 'var(--zima-content-padding)',
        }"
      >
        <slot />
      </div>
    </main>

    <!-- Command Palette -->
    <ZimaCommandPalette :items="commandItems" />

    <!-- Toast container -->
    <ZimaToast
      :toasts="toast.toasts.value"
      @dismiss="toast.dismiss"
    />
  </div>
</template>

<style scoped>
.zima-fade-enter-active,
.zima-fade-leave-active {
  transition: opacity 200ms ease;
}
.zima-fade-enter-from,
.zima-fade-leave-to {
  opacity: 0;
}

/* Gate mobile/desktop via media query — sem dependência de JS */
@media (min-width: 1024px) {
  .saas-layout__main {
    padding-left: var(--zima-sidebar-width);
  }
  .saas-layout__main.saas-layout__main--sidebar-collapsed {
    padding-left: var(--zima-sidebar-width-collapsed);
  }
  /* Overlay mobile nunca aparece em desktop, mesmo se o state vazar */
  .saas-layout__mobile-overlay {
    display: none !important;
  }
}

@media (max-width: 1023.98px) {
  .saas-layout__main {
    padding-left: 0 !important;
  }
}
</style>
