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

const unreadCount = computed(() =>
  props.notifications.filter(n => !n.read).length
)

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
</script>

<template>
  <header
    class="fixed top-0 right-0 left-0 flex items-center gap-4"
    :style="{
      height: 'var(--zima-topbar-height)',
      background: 'var(--zima-bg-base)',
      borderBottom: '1px solid var(--zima-border-default)',
      zIndex: 'var(--zima-z-topbar)',
      paddingLeft: '16px',
      paddingRight: '16px',
    }"
    data-testid="zima-topbar"
  >
    <!-- Left: Breadcrumbs -->
    <nav
      v-if="breadcrumbs.length"
      aria-label="Breadcrumb"
      class="flex items-center gap-1 flex-1 min-w-0"
    >
      <ol class="flex items-center gap-1 text-xs" style="color: var(--zima-text-muted);">
        <li
          v-for="(crumb, idx) in breadcrumbs"
          :key="idx"
          class="flex items-center gap-1 min-w-0"
        >
          <span
            v-if="idx > 0"
            aria-hidden="true"
            style="color: var(--zima-text-disabled);"
          >/</span>
          <a
            v-if="crumb.to && idx < breadcrumbs.length - 1"
            :href="crumb.to"
            class="hover:text-[var(--zima-text-secondary)] transition-colors duration-[150ms] truncate"
          >
            {{ crumb.label }}
          </a>
          <span
            v-else
            class="truncate"
            :style="idx === breadcrumbs.length - 1 ? { color: 'var(--zima-text-secondary)' } : {}"
            :aria-current="idx === breadcrumbs.length - 1 ? 'page' : undefined"
          >
            {{ crumb.label }}
          </span>
        </li>
      </ol>
    </nav>
    <div v-else class="flex-1" />

    <!-- Center: Global Search (Command Palette trigger) -->
    <button
      class="flex items-center gap-2 rounded-md px-3 transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2"
      :style="{
        height: '32px',
        background: 'var(--zima-bg-surface-2)',
        border: '1px solid var(--zima-border-default)',
        color: 'var(--zima-text-muted)',
        minWidth: '200px',
        maxWidth: '320px',
        '--tw-ring-color': 'var(--zima-focus-outline)',
      }"
      aria-label="Abrir busca global (Ctrl+K)"
      @click="openCommandPalette"
      @mouseenter="(e: MouseEvent) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-hover)'
      }"
      @mouseleave="(e: MouseEvent) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'
      }"
    >
      <Icon name="i-lucide-search" style="width: 14px; height: 14px;" aria-hidden="true" />
      <span style="font-size: 13px;">Buscar...</span>
      <kbd
        class="ml-auto flex items-center gap-0.5 rounded px-1"
        :style="{
          fontSize: '10px',
          fontFamily: 'var(--zima-font-mono)',
          background: 'var(--zima-bg-surface-3)',
          color: 'var(--zima-text-disabled)',
          border: '1px solid var(--zima-border-default)',
          height: '18px',
          lineHeight: '1',
        }"
        aria-label="Atalho Ctrl K"
      >
        <span>⌘</span><span>K</span>
      </kbd>
    </button>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2" data-topbar-menu>
      <!-- Notifications -->
      <div class="relative">
        <button
          class="relative flex items-center justify-center rounded-md transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2"
          :style="{
            width: '32px',
            height: '32px',
            color: 'var(--zima-text-secondary)',
            '--tw-ring-color': 'var(--zima-focus-outline)',
          }"
          :aria-label="`Notificações${unreadCount ? ` (${unreadCount} não lidas)` : ''}`"
          :aria-expanded="notificationsOpen"
          :aria-haspopup="true"
          @click.stop="notificationsOpen = !notificationsOpen; userMenuOpen = false"
          @mouseenter="(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-2)'
          }"
          @mouseleave="(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.background = ''
          }"
        >
          <Icon name="i-lucide-bell" style="width: 16px; height: 16px; stroke-width: 1.5px;" aria-hidden="true" />
          <!-- Unread badge -->
          <span
            v-if="unreadCount > 0"
            class="absolute top-1 right-1 flex items-center justify-center rounded-full"
            :style="{
              minWidth: '14px',
              height: '14px',
              padding: '0 3px',
              fontSize: '9px',
              fontWeight: '700',
              background: 'var(--zima-danger)',
              color: '#fff',
              transform: 'translate(25%, -25%)',
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
            class="absolute right-0 top-full mt-2 rounded-lg overflow-hidden"
            :style="{
              width: '380px',
              background: 'var(--zima-bg-surface-3)',
              border: '1px solid var(--zima-border-modal)',
              boxShadow: 'var(--zima-shadow-dropdown)',
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
              <span
                class="text-sm font-semibold"
                :style="{ color: 'var(--zima-text-primary)' }"
              >
                Notificações
              </span>
              <button
                v-if="unreadCount > 0"
                class="text-xs transition-colors duration-[150ms]"
                :style="{ color: 'var(--zima-blue-light)' }"
                @click="emit('mark-all-read')"
              >
                Marcar todas como lidas
              </button>
            </div>

            <!-- Notification list -->
            <div class="max-h-80 overflow-y-auto">
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
                  @mouseenter="(e: MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'
                  }"
                  @mouseleave="(e: MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = notif.read ? '' : 'var(--zima-blue-subtle)'
                  }"
                >
                  <div
                    class="flex items-center justify-center rounded-full shrink-0 mt-0.5"
                    :style="{
                      width: '28px',
                      height: '28px',
                      background: `rgba(${notificationTypeColor[notif.type]}, 0.1)`,
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
                      :style="{ color: 'var(--zima-text-primary)' }"
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
                    <p
                      class="text-xs mt-1"
                      :style="{ color: 'var(--zima-text-muted)' }"
                    >
                      {{ notif.time }}
                    </p>
                  </div>
                  <div
                    v-if="!notif.read"
                    class="shrink-0 rounded-full mt-2"
                    :style="{
                      width: '6px',
                      height: '6px',
                      background: 'var(--zima-blue-core)',
                    }"
                    aria-hidden="true"
                  />
                </button>
              </template>
              <div
                v-else
                class="flex flex-col items-center justify-center py-10 gap-2"
              >
                <Icon
                  name="i-lucide-bell-off"
                  style="width: 32px; height: 32px;"
                  :style="{ color: 'var(--zima-text-muted)' }"
                  aria-hidden="true"
                />
                <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">
                  Nenhuma notificação
                </p>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- User menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2"
          :style="{
            '--tw-ring-color': 'var(--zima-focus-outline)',
          }"
          :aria-label="`Menu do usuário: ${userName}`"
          :aria-expanded="userMenuOpen"
          :aria-haspopup="true"
          @click.stop="userMenuOpen = !userMenuOpen; notificationsOpen = false"
          @mouseenter="(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-2)'
          }"
          @mouseleave="(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.background = ''
          }"
        >
          <!-- Avatar -->
          <div
            v-if="userAvatar"
            class="rounded-full overflow-hidden shrink-0"
            style="width: 32px; height: 32px;"
          >
            <NuxtImg :src="userAvatar" :alt="userName" width="32" height="32" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="flex items-center justify-center rounded-full shrink-0 text-xs font-semibold"
            :style="{
              width: '32px',
              height: '32px',
              background: 'var(--zima-avatar-fallback-bg)',
              color: 'var(--zima-avatar-fallback-color)',
            }"
            aria-hidden="true"
          >
            {{ userInitials }}
          </div>

          <Icon
            name="i-lucide-chevron-down"
            :style="{
              width: '14px',
              height: '14px',
              color: 'var(--zima-text-muted)',
              transform: userMenuOpen ? 'rotate(180deg)' : '',
              transition: 'transform 150ms ease',
            }"
            aria-hidden="true"
          />
        </button>

        <!-- User dropdown -->
        <Transition name="zima-dropdown">
          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 rounded-lg overflow-hidden"
            :style="{
              width: '200px',
              background: 'var(--zima-bg-surface-3)',
              border: '1px solid var(--zima-border-modal)',
              boxShadow: 'var(--zima-shadow-dropdown)',
              zIndex: 'var(--zima-z-dropdown)',
            }"
            role="menu"
          >
            <!-- User info -->
            <div
              class="px-4 py-3"
              :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
            >
              <p class="text-sm font-medium truncate" :style="{ color: 'var(--zima-text-primary)' }">
                {{ userName }}
              </p>
              <p class="text-xs truncate mt-0.5" :style="{ color: 'var(--zima-text-muted)' }">
                {{ userRole }}
              </p>
            </div>

            <!-- Menu items -->
            <div class="py-1">
              <button
                v-for="item in [
                  { label: 'Meu Perfil', icon: 'i-lucide-user', action: 'profile' },
                  { label: 'Configurações', icon: 'i-lucide-settings', action: 'settings' },
                ]"
                :key="item.action"
                class="w-full flex items-center gap-3 px-4 text-sm transition-colors duration-[150ms] focus-visible:outline-none"
                :style="{ height: '36px', color: 'var(--zima-text-secondary)' }"
                role="menuitem"
                @click="emit(item.action as 'profile' | 'settings')"
                @mouseenter="(e: MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--zima-blue-subtle)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'
                }"
                @mouseleave="(e: MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.background = ''
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-secondary)'
                }"
              >
                <Icon :name="item.icon" style="width: 14px; height: 14px;" aria-hidden="true" />
                {{ item.label }}
              </button>
            </div>

            <div
              class="py-1"
              :style="{ borderTop: '1px solid var(--zima-border-divider)' }"
            >
              <button
                class="w-full flex items-center gap-3 px-4 text-sm transition-colors duration-[150ms] focus-visible:outline-none"
                :style="{ height: '36px', color: 'var(--zima-danger)' }"
                role="menuitem"
                @click="emit('logout')"
                @mouseenter="(e: MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--zima-danger-subtle)'
                }"
                @mouseleave="(e: MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.background = ''
                }"
              >
                <Icon name="i-lucide-log-out" style="width: 14px; height: 14px;" aria-hidden="true" />
                Sair
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
</style>
