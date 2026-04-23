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
  mobileOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activeKey: '',
  appName: 'Onyra',
  mobileOpen: false,
})

const emit = defineEmits<{
  navigate: [item: SidebarNavItem]
  close: []
}>()

const { sidebarCollapsed, toggleSidebar } = useSaasLayout()

// Gates mobile/desktop são feitos por CSS media query (via classes e data-attrs)
// para evitar flicker de hidratação. Em mobile, CSS força sidebar expandida
// independente de sidebarCollapsed, e aplica width/transform/z-index do drawer.
const handleItemClick = (item: SidebarNavItem) => {
  emit('navigate', item)
}

const isActive = (item: SidebarNavItem) => item.key === props.activeKey
</script>

<template>
  <!-- Sidebar wrapper — gates visuais via CSS media query (ver <style>) -->
  <aside
    class="zima-sidebar flex flex-col fixed left-0 top-0 h-screen border-r overflow-hidden shrink-0"
    :class="{
      'zima-sidebar--collapsed': sidebarCollapsed,
      'zima-sidebar--mobile-open': mobileOpen,
    }"
    :style="{
      background: 'var(--zima-bg-surface-1)',
      borderColor: 'var(--zima-border-default)',
    }"
    :aria-hidden="mobileOpen ? undefined : null"
    data-testid="zima-sidebar"
  >
    <!-- Logo / App Name -->
    <div
      class="flex items-center gap-3 shrink-0"
      :style="{
        height: 'var(--zima-topbar-height)',
        padding: '0 20px',
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

      <!-- App name — v-show permite CSS forçar visível em mobile -->
      <span
        v-show="!sidebarCollapsed"
        class="zima-sidebar__app-name font-semibold text-sm whitespace-nowrap"
        :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
      >
        {{ appName }}
      </span>

      <!-- Botão fechar drawer — visível apenas em mobile via CSS -->
      <button
        class="zima-sidebar__close ml-auto flex items-center justify-center rounded-md shrink-0"
        style="width: 28px; height: 28px; color: var(--zima-text-muted); background: transparent; border: none;"
        aria-label="Fechar menu"
        @click="emit('close')"
      >
        <Icon name="i-lucide-x" style="width: 16px; height: 16px;" aria-hidden="true" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Navegação principal">
      <template v-for="group in groups" :key="group.key">
        <!-- Group header — expandido -->
        <div
          v-show="!sidebarCollapsed"
          class="zima-sidebar__group-label px-5 pt-4 pb-1"
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
        <!-- Group divider — colapsado (só desktop) -->
        <div
          v-show="sidebarCollapsed"
          class="zima-sidebar__group-divider pt-4 pb-1 flex justify-center"
        >
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
              :aria-current="isActive(item) ? 'page' : undefined"
              class="zima-sidebar__item w-full flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zima-focus-outline)]"
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

              <!-- Label — v-show permite CSS forçar visível em mobile -->
              <span
                v-show="!sidebarCollapsed"
                class="zima-sidebar__item-label flex-1 text-left truncate"
              >
                {{ item.label }}
              </span>

              <!-- Badge -->
              <span
                v-show="!sidebarCollapsed && !!item.badge"
                class="zima-sidebar__item-badge inline-flex items-center justify-center rounded-full text-white shrink-0"
                :style="{
                  fontSize: '11px',
                  fontWeight: '700',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  background: 'var(--zima-badge-danger-bg)',
                }"
                :aria-label="item.badge ? `${item.badge} notificações` : undefined"
              >
                {{ item.badge && item.badge > 99 ? '99+' : item.badge }}
              </span>
            </component>
          </li>
        </ul>
      </template>
    </nav>

    <!-- Collapse toggle — desktop only (CSS esconde em mobile) -->
    <div
      class="zima-sidebar__collapse-toggle shrink-0 p-2"
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
        <span v-show="!sidebarCollapsed" class="ml-2 text-sm">Colapsar</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* ------------------------------------------------------------------
 * Gates mobile/desktop via media query — evita flicker de hidratação
 * Breakpoint: 1024px (igual ao `lg:` do Tailwind)
 * ------------------------------------------------------------------ */

/* DESKTOP (>=1024px) — comportamento fixo com colapso */
@media (min-width: 1024px) {
  .zima-sidebar {
    width: var(--zima-sidebar-width);
    transform: none;
    z-index: var(--zima-z-sidebar);
    transition: width 200ms ease;
  }
  .zima-sidebar.zima-sidebar--collapsed {
    width: var(--zima-sidebar-width-collapsed);
  }
  /* Botão X não aparece em desktop */
  .zima-sidebar__close {
    display: none;
  }
}

/* MOBILE (<1024px) — drawer off-canvas */
@media (max-width: 1023.98px) {
  .zima-sidebar {
    width: var(--zima-sidebar-drawer-width);
    transform: translateX(-100%);
    z-index: var(--zima-z-overlay);
    transition: transform 220ms ease;
  }
  .zima-sidebar.zima-sidebar--mobile-open {
    transform: translateX(0);
  }
  /* Em mobile, a sidebar é sempre "expandida" — sobrescreve o v-show colapsado */
  .zima-sidebar .zima-sidebar__app-name,
  .zima-sidebar .zima-sidebar__group-label,
  .zima-sidebar .zima-sidebar__item-label,
  .zima-sidebar .zima-sidebar__item-badge {
    display: revert !important;
  }
  /* Ocultar divider de grupo colapsado (só faz sentido em desktop) */
  .zima-sidebar .zima-sidebar__group-divider {
    display: none !important;
  }
  /* Botão de colapsar não se aplica em mobile */
  .zima-sidebar__collapse-toggle {
    display: none;
  }
  /* Item sempre em modo expandido (px-3 h-9) */
  .zima-sidebar__item {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    height: 2.25rem;
    justify-content: flex-start;
  }
}

/* DESKTOP — aplicar classes utility de forma explícita em substituição ao Tailwind dinâmico */
@media (min-width: 1024px) {
  .zima-sidebar .zima-sidebar__item {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    height: 2.25rem;
  }
  .zima-sidebar.zima-sidebar--collapsed .zima-sidebar__item {
    padding-left: 0;
    padding-right: 0;
    height: 2.5rem;
    justify-content: center;
  }
}
</style>
