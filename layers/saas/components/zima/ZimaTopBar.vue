<script setup lang="ts">
export interface Breadcrumb {
  label: string
  to?: string
}

export interface Notification {
  id: string
  title: string
  description?: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'danger'
  to?: string
}

interface Props {
  breadcrumbs?: Breadcrumb[]
  notifications?: Notification[]
  userName?: string
  userAvatar?: string
  userRole?: string
}

const props = withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [],
  notifications: () => [],
  userName: 'Usuário',
  userRole: 'Proprietário',
})

const emit = defineEmits<{
  'notification-click': [notification: Notification]
  'mark-all-read': []
  'profile': []
  'settings': []
  'logout': []
}>()

const { openCommandPalette, notificationsOpen } = useSaasLayout()

const userMenuOpen = ref(false)

// Scroll-aware topbar
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const unreadCount = computed(() =>
  props.notifications.filter(n => !n.read).length
)

// Apenas o primeiro nome
const firstName = computed(() => props.userName.trim().split(' ')[0])

const userInitials = computed(() => {
  const parts = props.userName.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const notificationTypeIcon: Record<string, string> = {
  info:    'i-lucide-info',
  success: 'i-lucide-circle-check',
  warning: 'i-lucide-triangle-alert',
  danger:  'i-lucide-circle-x',
}

const notificationTypeColor: Record<string, string> = {
  info:    'var(--zima-info)',
  success: 'var(--zima-success)',
  warning: 'var(--zima-warning)',
  danger:  'var(--zima-danger)',
}

const notificationTypeBg: Record<string, string> = {
  info:    'var(--zima-info-subtle)',
  success: 'var(--zima-success-subtle)',
  warning: 'var(--zima-warning-subtle)',
  danger:  'var(--zima-danger-subtle)',
}

// Fechar menus ao clicar fora
const handleOutsideClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('[data-topbar-menu]')) {
    userMenuOpen.value = false
    notificationsOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))

const { toggleSidebarMobile } = useSaasLayout()
</script>

<template>
  <header
    class="fixed top-0 right-0 left-0 flex items-center gap-3"
    :style="{
      height: 'var(--zima-topbar-height)',
      background: scrolled ? 'var(--zima-topbar-bg-scrolled)' : 'transparent',
      backdropFilter: scrolled ? 'var(--zima-topbar-blur)' : 'none',
      WebkitBackdropFilter: scrolled ? 'var(--zima-topbar-blur)' : 'none',
      borderBottom: scrolled ? '1px solid var(--zima-border-default)' : '1px solid transparent',
      zIndex: 'var(--zima-z-topbar)',
      paddingLeft: '14px',
      paddingRight: '14px',
      transition: 'var(--zima-topbar-transition)',
    }"
    data-testid="zima-topbar"
  >
    <!-- Mobile hamburger (visible <lg) -->
    <button
      class="lg:hidden flex items-center justify-center rounded-lg transition-all"
      :style="{
        width: '32px', height: '32px',
        background: 'var(--zima-bg-surface-2)',
        border: '1px solid var(--zima-border-default)',
        color: 'var(--zima-text-secondary)',
        flexShrink: '0',
        transitionDuration: '150ms',
      }"
      aria-label="Abrir menu"
      @click="toggleSidebarMobile"
      @mouseenter="(e: MouseEvent) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-hover)'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'
      }"
      @mouseleave="(e: MouseEvent) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-secondary)'
      }"
    >
      <Icon name="i-lucide-menu" style="width:15px; height:15px;" />
    </button>

    <!-- Left: Breadcrumbs -->
    <nav
      v-if="breadcrumbs.length"
      aria-label="Breadcrumb"
      class="flex items-center gap-1 flex-1 min-w-0"
    >
      <!-- Mobile: só o último segmento -->
      <span
        class="flex md:hidden text-xs truncate font-medium"
        :style="{ color: 'var(--zima-text-secondary)' }"
      >
        {{ breadcrumbs[breadcrumbs.length - 1]?.label }}
      </span>
      <!-- Desktop: breadcrumbs com chevron -->
      <ol class="hidden md:flex items-center gap-0.5" style="color: var(--zima-text-muted);">
        <li
          v-for="(crumb, idx) in breadcrumbs"
          :key="idx"
          class="flex items-center gap-0.5 min-w-0"
        >
          <!-- Separador chevron (exceto o primeiro) -->
          <Icon
            v-if="idx > 0"
            name="i-lucide-chevron-right"
            :style="{
              width: '11px', height: '11px',
              color: 'var(--zima-text-disabled)',
              strokeWidth: '1.5px',
              flexShrink: '0',
            }"
            aria-hidden="true"
          />
          <a
            v-if="crumb.to && idx < breadcrumbs.length - 1"
            :href="crumb.to"
            class="text-xs truncate transition-colors duration-[150ms] hover:text-[var(--zima-text-secondary)]"
            :style="{ color: 'var(--zima-text-muted)' }"
          >
            {{ crumb.label }}
          </a>
          <span
            v-else
            class="text-xs truncate"
            :style="{
              color: idx === breadcrumbs.length - 1 ? 'var(--zima-text-secondary)' : 'var(--zima-text-muted)',
              fontWeight: idx === breadcrumbs.length - 1 ? '500' : '400',
            }"
            :aria-current="idx === breadcrumbs.length - 1 ? 'page' : undefined"
          >
            {{ crumb.label }}
          </span>
        </li>
      </ol>
    </nav>
    <div v-else class="flex-1" />

    <!-- Mobile search icon (visible <md) -->
    <button
      class="flex md:hidden items-center justify-center rounded-lg transition-all"
      :style="{
        width: '32px', height: '32px',
        background: 'var(--zima-bg-surface-2)',
        border: '1px solid var(--zima-border-default)',
        color: 'var(--zima-text-secondary)',
        flexShrink: '0',
      }"
      aria-label="Abrir busca global"
      @click="openCommandPalette"
    >
      <Icon name="i-lucide-search" style="width:14px; height:14px;" />
    </button>

    <!-- Center: Global Search -->
    <button
      class="hidden md:flex items-center gap-2 rounded-lg px-3 focus-visible:outline-none focus-visible:ring-2 group"
      :style="{
        height: '32px',
        background: 'var(--zima-bg-surface-2)',
        border: '1px solid var(--zima-border-default)',
        color: 'var(--zima-text-muted)',
        width: '220px',
        transition: 'width 200ms ease, border-color 150ms ease',
        '--tw-ring-color': 'var(--zima-focus-outline)',
        flexShrink: '0',
      }"
      aria-label="Abrir busca global (Ctrl+K)"
      @click="openCommandPalette"
      @mouseenter="(e: MouseEvent) => {
        (e.currentTarget as HTMLElement).style.width = '280px'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-active)'
      }"
      @mouseleave="(e: MouseEvent) => {
        (e.currentTarget as HTMLElement).style.width = '220px'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'
      }"
    >
      <Icon name="i-lucide-search" style="width: 12px; height: 12px; flex-shrink: 0; opacity: 0.7;" aria-hidden="true" />
      <span style="font-size: 12px; flex: 1; text-align: left; opacity: 0.6;">Pesquisar ou ir para...</span>
      <kbd
        class="flex items-center rounded px-1.5 flex-shrink-0 transition-opacity"
        :style="{
          fontSize: '10px',
          fontFamily: 'var(--zima-font-mono)',
          background: 'var(--zima-bg-surface-3)',
          color: 'var(--zima-text-disabled)',
          border: '1px solid var(--zima-border-divider)',
          height: '18px',
          lineHeight: '1',
          letterSpacing: '0.02em',
          opacity: '0.5',
          transition: 'opacity 150ms ease',
        }"
        aria-label="Atalho Ctrl K"
      >
        <span>⌘K</span>
      </kbd>
    </button>

    <!-- Right: Actions -->
    <div class="flex items-center gap-1.5" data-topbar-menu>

      <!-- Notifications -->
      <div class="relative">
        <button
          class="relative flex items-center justify-center rounded-lg transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2"
          :style="{
            width: '32px',
            height: '32px',
            color: notificationsOpen ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
            background: notificationsOpen ? 'var(--zima-bg-surface-2)' : 'transparent',
            '--tw-ring-color': 'var(--zima-focus-outline)',
          }"
          :aria-label="`Notificações${unreadCount ? ` (${unreadCount} não lidas)` : ''}`"
          :aria-expanded="notificationsOpen"
          :aria-haspopup="true"
          @click.stop="notificationsOpen = !notificationsOpen; userMenuOpen = false"
          @mouseenter="(e: MouseEvent) => {
            if (!notificationsOpen) {
              (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-2)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'
            }
          }"
          @mouseleave="(e: MouseEvent) => {
            if (!notificationsOpen) {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'
            }
          }"
        >
          <Icon name="i-lucide-bell" style="width: 15px; height: 15px; stroke-width: 1.5px;" aria-hidden="true" />
          <!-- Unread badge com pulse -->
          <span
            v-if="unreadCount > 0"
            class="absolute top-0.5 right-0.5 flex items-center justify-center rounded-full"
            :style="{
              minWidth: '14px',
              height: '14px',
              padding: '0 3px',
              fontSize: '9px',
              fontWeight: '700',
              background: 'var(--zima-danger)',
              color: '#fff',
              transform: 'translate(30%, -30%)',
              animation: 'zima-badge-pulse 2.5s ease-in-out infinite',
            }"
            :aria-hidden="true"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <!-- Notifications dropdown -->
        <Transition name="zima-dropdown">
          <div
            v-if="notificationsOpen"
            class="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
            :style="{
              width: 'min(360px, calc(100vw - 32px))',
              maxWidth: 'calc(100vw - 32px)',
              background: 'var(--zima-bg-surface-3)',
              border: '1px solid var(--zima-border-modal)',
              boxShadow: 'var(--zima-shadow-lg)',
              zIndex: 'var(--zima-z-dropdown)',
            }"
            role="dialog"
            aria-label="Notificações"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between px-4 py-3"
              :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold" :style="{ color: 'var(--zima-text-primary)' }">
                  Notificações
                </span>
                <span
                  v-if="unreadCount > 0"
                  class="inline-flex items-center justify-center rounded-full"
                  :style="{
                    minWidth: '18px', height: '18px', padding: '0 5px',
                    fontSize: '10px', fontWeight: '700',
                    background: 'var(--zima-danger-subtle)',
                    color: 'var(--zima-danger)',
                  }"
                >
                  {{ unreadCount }}
                </span>
              </div>
              <button
                v-if="unreadCount > 0"
                class="text-xs transition-all duration-[150ms]"
                :style="{ color: 'var(--zima-blue-light)', opacity: '0.8' }"
                @click="emit('mark-all-read')"
                @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.opacity = '1'"
                @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.opacity = '0.8'"
              >
                Marcar como lidas
              </button>
            </div>

            <!-- Notification list -->
            <div class="overflow-y-auto" style="max-height: 360px;">
              <template v-if="notifications.length">
                <button
                  v-for="notif in notifications"
                  :key="notif.id"
                  class="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-[150ms] focus-visible:outline-none"
                  :style="{
                    background: notif.read ? '' : 'var(--zima-blue-subtle)',
                    borderBottom: '1px solid var(--zima-border-divider)',
                  }"
                  @click="emit('notification-click', notif)"
                  @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                  @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = notif.read ? '' : 'var(--zima-blue-subtle)'"
                >
                  <div
                    class="flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                    :style="{
                      width: '30px', height: '30px',
                      background: notificationTypeBg[notif.type],
                      color: notificationTypeColor[notif.type],
                    }"
                  >
                    <Icon
                      :name="notificationTypeIcon[notif.type]"
                      style="width: 14px; height: 14px;"
                      :style="{ color: notificationTypeColor[notif.type] }"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      class="text-sm font-medium truncate"
                      :style="{ color: 'var(--zima-text-primary)', letterSpacing: '-0.01em' }"
                    >
                      {{ notif.title }}
                    </p>
                    <p
                      v-if="notif.description"
                      class="text-xs mt-0.5 line-clamp-2"
                      :style="{ color: 'var(--zima-text-secondary)' }"
                    >
                      {{ notif.description }}
                    </p>
                    <p class="text-xs mt-1" :style="{ color: 'var(--zima-text-muted)' }">
                      {{ notif.time }}
                    </p>
                  </div>
                  <div
                    v-if="!notif.read"
                    class="shrink-0 rounded-full mt-2"
                    :style="{ width: '6px', height: '6px', background: 'var(--zima-blue-core)' }"
                    aria-hidden="true"
                  />
                </button>
              </template>

              <!-- Empty state -->
              <div
                v-else
                class="flex flex-col items-center justify-center py-10 gap-2"
              >
                <div
                  class="flex items-center justify-center rounded-xl"
                  :style="{
                    width: '48px', height: '48px',
                    background: 'var(--zima-success-subtle)',
                    marginBottom: '4px',
                  }"
                >
                  <Icon name="i-lucide-check-circle" style="width: 22px; height: 22px;" :style="{ color: 'var(--zima-success)' }" />
                </div>
                <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">Tudo em dia!</p>
                <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Sem notificações pendentes</p>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Divider vertical -->
      <div
        class="hidden md:block"
        :style="{
          width: '1px', height: '20px',
          background: 'var(--zima-border-divider)',
          margin: '0 2px',
        }"
        aria-hidden="true"
      />

      <!-- User menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-lg px-2 py-1 transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2"
          :style="{
            background: userMenuOpen ? 'var(--zima-bg-surface-2)' : 'transparent',
            border: userMenuOpen ? '1px solid var(--zima-border-default)' : '1px solid transparent',
            '--tw-ring-color': 'var(--zima-focus-outline)',
            transitionDuration: '150ms',
          }"
          :aria-label="`Menu do usuário: ${userName}`"
          :aria-expanded="userMenuOpen"
          :aria-haspopup="true"
          @click.stop="userMenuOpen = !userMenuOpen; notificationsOpen = false"
          @mouseenter="(e: MouseEvent) => {
            if (!userMenuOpen) {
              (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-2)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'
            }
          }"
          @mouseleave="(e: MouseEvent) => {
            if (!userMenuOpen) {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
            }
          }"
        >
          <!-- Avatar com gradiente -->
          <div
            v-if="userAvatar"
            class="rounded-full overflow-hidden shrink-0"
            style="width: 28px; height: 28px;"
          >
            <NuxtImg :src="userAvatar" :alt="userName" width="28" height="28" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="flex items-center justify-center rounded-full shrink-0 text-xs font-bold"
            :style="{
              width: '28px',
              height: '28px',
              background: 'var(--zima-gradient-primary)',
              color: '#fff',
              letterSpacing: '0.02em',
              fontSize: '11px',
            }"
            aria-hidden="true"
          >
            {{ userInitials }}
          </div>

          <!-- Primeiro nome (desktop only) -->
          <span
            class="hidden md:block text-sm font-medium"
            :style="{ color: 'var(--zima-text-secondary)', letterSpacing: '-0.01em' }"
          >
            {{ firstName }}
          </span>

          <Icon
            name="i-lucide-chevron-down"
            :style="{
              width: '12px',
              height: '12px',
              color: 'var(--zima-text-muted)',
              transform: userMenuOpen ? 'rotate(180deg)' : '',
              transition: 'transform 150ms ease',
              flexShrink: '0',
            }"
            aria-hidden="true"
          />
        </button>

        <!-- User dropdown -->
        <Transition name="zima-dropdown">
          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
            :style="{
              width: 'min(220px, calc(100vw - 32px))',
              maxWidth: 'calc(100vw - 32px)',
              background: 'var(--zima-bg-surface-3)',
              border: '1px solid var(--zima-border-modal)',
              boxShadow: 'var(--zima-shadow-lg)',
              zIndex: 'var(--zima-z-dropdown)',
            }"
            role="menu"
          >
            <!-- User info header -->
            <div
              class="flex items-center gap-3 px-4 py-3.5"
              :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
            >
              <!-- Avatar grande -->
              <div
                class="flex items-center justify-center rounded-full shrink-0 font-bold"
                :style="{
                  width: '36px', height: '36px',
                  background: 'var(--zima-gradient-primary)',
                  color: '#fff',
                  fontSize: '13px',
                  letterSpacing: '0.02em',
                }"
              >
                {{ userInitials }}
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-sm font-semibold truncate"
                  :style="{ color: 'var(--zima-text-primary)', letterSpacing: '-0.01em' }"
                >
                  {{ userName }}
                </p>
                <span
                  class="inline-flex items-center rounded-full px-1.5 mt-0.5"
                  :style="{
                    height: '16px',
                    fontSize: '10px',
                    fontWeight: '600',
                    background: 'var(--zima-bg-surface-hover)',
                    color: 'var(--zima-text-muted)',
                    border: '1px solid var(--zima-border-default)',
                  }"
                >
                  {{ userRole }}
                </span>
              </div>
            </div>

            <!-- Menu items -->
            <div class="py-1">
              <button
                v-for="item in [
                  { label: 'Meu Perfil', icon: 'i-lucide-user-circle', action: 'profile' },
                  { label: 'Configurações', icon: 'i-lucide-settings-2', action: 'settings' },
                ]"
                :key="item.action"
                class="w-full flex items-center gap-3 px-4 transition-colors duration-[150ms] focus-visible:outline-none"
                :style="{ height: '36px', color: 'var(--zima-text-secondary)', fontSize: '13px' }"
                role="menuitem"
                @click="emit(item.action as 'profile' | 'settings')"
                @mouseenter="(e: MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'
                }"
                @mouseleave="(e: MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.background = ''
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-secondary)'
                }"
              >
                <Icon :name="item.icon" style="width: 14px; height: 14px; stroke-width: 1.5px;" aria-hidden="true" />
                {{ item.label }}
              </button>
            </div>

            <div
              class="py-1"
              :style="{ borderTop: '1px solid var(--zima-border-divider)' }"
            >
              <button
                class="w-full flex items-center gap-3 px-4 transition-colors duration-[150ms] focus-visible:outline-none"
                :style="{ height: '36px', color: 'var(--zima-danger)', fontSize: '13px' }"
                role="menuitem"
                @click="emit('logout')"
                @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-danger-subtle)'"
                @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
              >
                <Icon name="i-lucide-log-out" style="width: 14px; height: 14px; stroke-width: 1.5px;" aria-hidden="true" />
                Sair da conta
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.zima-dropdown-enter-active {
  animation: zima-scale-in 150ms ease forwards;
}
.zima-dropdown-leave-active {
  transition: opacity 100ms ease;
}
.zima-dropdown-leave-to {
  opacity: 0;
}

@keyframes zima-badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
  50%       { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
}
</style>
