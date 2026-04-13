<script setup lang="ts">
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

interface Props {
  groups: SidebarNavGroup[]
  activeKey?: string
  logo?: string
  appName?: string
}

const props = withDefaults(defineProps<Props>(), {
  activeKey: '',
  appName: 'Onyra',
})

const emit = defineEmits<{
  navigate: [item: SidebarNavItem]
}>()

const { sidebarCollapsed, toggleSidebar } = useSaasLayout()

const handleItemClick = (item: SidebarNavItem) => {
  emit('navigate', item)
}

const isActive = (item: SidebarNavItem) => item.key === props.activeKey
</script>

<template>
  <!-- Sidebar wrapper -->
  <aside
    :class="[
      'flex flex-col h-screen fixed left-0 top-0 transition-all duration-200 ease-default',
      'border-r overflow-hidden shrink-0',
      sidebarCollapsed ? 'w-16' : 'w-60',
    ]"
    :style="{
      background: 'var(--zima-bg-surface-1)',
      borderColor: 'var(--zima-border-default)',
      zIndex: 'var(--zima-z-sidebar)',
    }"
    data-testid="zima-sidebar"
  >
    <!-- Logo / App Name -->
    <div
      class="flex items-center gap-3 shrink-0"
      :style="{
        height: 'var(--zima-topbar-height)',
        padding: sidebarCollapsed ? '0 20px' : '0 20px',
        borderBottom: '1px solid var(--zima-border-default)',
      }"
    >
      <!-- Logo mark -->
      <div
        class="flex items-center justify-center rounded-lg shrink-0"
        style="width: 28px; height: 28px; background: var(--zima-gradient-primary);"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" opacity="0.9"/>
          <path d="M8 6L11 7.5V10.5L8 12L5 10.5V7.5L8 6Z" fill="white"/>
        </svg>
      </div>

      <!-- App name (hidden when collapsed) -->
      <Transition name="zima-fade">
        <span
          v-if="!sidebarCollapsed"
          class="font-semibold text-sm whitespace-nowrap"
          :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
        >
          {{ appName }}
        </span>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Navegação principal">
      <template v-for="group in groups" :key="group.key">
        <!-- Group header -->
        <div
          v-if="!sidebarCollapsed"
          class="px-5 pt-4 pb-1"
          :style="{
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--zima-text-muted)',
          }"
          aria-hidden="true"
        >
          {{ group.label }}
        </div>
        <div v-else class="pt-4 pb-1 flex justify-center">
          <div
            class="w-4 h-px"
            :style="{ background: 'var(--zima-border-default)' }"
            aria-hidden="true"
          />
        </div>

        <!-- Nav items -->
        <ul class="space-y-0.5 px-2" role="list">
          <li v-for="item in group.items" :key="item.key" role="listitem">
            <component
              :is="item.to ? 'a' : 'button'"
              :href="item.to"
              type="button"
              :aria-label="sidebarCollapsed ? item.label : undefined"
              :aria-current="isActive(item) ? 'page' : undefined"
              :class="[
                'w-full flex items-center gap-3 rounded-md text-sm font-medium',
                'transition-all duration-[150ms] focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-[var(--zima-focus-outline)]',
                sidebarCollapsed ? 'justify-center px-0 h-10' : 'px-3 h-9',
              ]"
              :style="isActive(item) ? {
                background: 'var(--zima-sidebar-item-active-bg)',
                color: 'var(--zima-sidebar-item-active-color)',
                boxShadow: 'inset 2px 0 0 var(--zima-sidebar-item-active-border)',
              } : {
                color: 'var(--zima-text-secondary)',
              }"
              @click="handleItemClick(item)"
              @mouseenter="(e: MouseEvent) => {
                if (!isActive(item)) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'
                }
              }"
              @mouseleave="(e: MouseEvent) => {
                if (!isActive(item)) {
                  (e.currentTarget as HTMLElement).style.background = ''
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-secondary)'
                }
              }"
            >
              <!-- Icon -->
              <Icon
                :name="item.icon"
                class="shrink-0"
                style="width: 18px; height: 18px; stroke-width: 1.5px;"
                :style="{ color: isActive(item) ? 'var(--zima-blue-light)' : 'inherit' }"
                aria-hidden="true"
              />

              <!-- Label (hidden when collapsed) -->
              <Transition name="zima-fade">
                <span v-if="!sidebarCollapsed" class="flex-1 text-left truncate">
                  {{ item.label }}
                </span>
              </Transition>

              <!-- Badge -->
              <Transition name="zima-fade">
                <span
                  v-if="!sidebarCollapsed && item.badge"
                  class="inline-flex items-center justify-center rounded-full text-white shrink-0"
                  :style="{
                    fontSize: '11px',
                    fontWeight: '700',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 4px',
                    background: 'var(--zima-badge-danger-bg)',
                  }"
                  :aria-label="`${item.badge} notificações`"
                >
                  {{ item.badge > 99 ? '99+' : item.badge }}
                </span>
              </Transition>
            </component>
          </li>
        </ul>
      </template>
    </nav>

    <!-- Collapse toggle -->
    <div
      class="shrink-0 p-2"
      :style="{ borderTop: '1px solid var(--zima-border-default)' }"
    >
      <button
        class="w-full flex items-center justify-center rounded-md h-9 transition-colors duration-[150ms]"
        :style="{ color: 'var(--zima-text-muted)' }"
        :aria-label="sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'"
        :aria-expanded="!sidebarCollapsed"
        @click="toggleSidebar"
        @mouseenter="(e: MouseEvent) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-secondary)'
        }"
        @mouseleave="(e: MouseEvent) => {
          (e.currentTarget as HTMLElement).style.background = ''
          ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'
        }"
      >
        <Icon
          :name="sidebarCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          style="width: 16px; height: 16px; stroke-width: 1.5px;"
          aria-hidden="true"
        />
        <Transition name="zima-fade">
          <span v-if="!sidebarCollapsed" class="ml-2 text-sm">Colapsar</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.zima-fade-enter-active,
.zima-fade-leave-active {
  transition: opacity 150ms ease;
}
.zima-fade-enter-from,
.zima-fade-leave-to {
  opacity: 0;
}
</style>
