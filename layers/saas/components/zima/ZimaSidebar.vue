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
  appName: 'Zima',
  mobileOpen: false,
})

const emit = defineEmits<{
  navigate: [item: SidebarNavItem]
  close: []
}>()

const { sidebarCollapsed, toggleSidebar } = useSaasLayout()

const handleItemClick = (item: SidebarNavItem) => {
  emit('navigate', item)
}

const isActive = (item: SidebarNavItem) => item.key === props.activeKey
</script>

<template>
  <!-- Sidebar wrapper — gates visuais via CSS media query (ver <style>) -->
  <aside
    class="zima-sidebar flex flex-col fixed left-0 top-0 h-screen overflow-hidden shrink-0"
    :class="{
      'zima-sidebar--collapsed': sidebarCollapsed,
      'zima-sidebar--mobile-open': mobileOpen,
    }"
    :style="{
      background: 'var(--zima-bg-surface-1)',
      borderRight: '1px solid var(--zima-border-default)',
    }"
    :aria-hidden="mobileOpen ? undefined : null"
    data-testid="zima-sidebar"
  >
    <!-- Logo / App Name -->
    <div
      class="flex items-center gap-3 shrink-0"
      :style="{
        height: 'var(--zima-topbar-height)',
        padding: '0 18px',
      }"
    >
      <!-- Logo — com glow sutil no hover -->
      <NuxtImg
        src="/logo-capa-sem-fundo.png"
        alt="Zima"
        class="shrink-0 object-contain zima-sidebar__logo"
        :style="{
          height: '26px',
          width: sidebarCollapsed ? '26px' : 'auto',
          maxWidth: sidebarCollapsed ? '26px' : '100px',
          transition: 'width 200ms ease, max-width 200ms ease, filter 200ms ease',
        }"
      />

      <!-- App name -->
      <span
        v-show="!sidebarCollapsed"
        class="zima-sidebar__app-name font-semibold whitespace-nowrap"
        :style="{
          fontSize: '15px',
          letterSpacing: '-0.02em',
          color: 'var(--zima-text-primary)',
          fontFamily: 'var(--zima-font-display)',
        }"
      >
        {{ appName }}
      </span>

      <!-- Botão fechar drawer — visível apenas em mobile via CSS -->
      <button
        class="zima-sidebar__close ml-auto flex items-center justify-center rounded-md shrink-0 transition-colors"
        :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)', background: 'transparent', border: 'none' }"
        aria-label="Fechar menu"
        @click="emit('close')"
        @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
        @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
      >
        <Icon name="i-lucide-x" style="width: 15px; height: 15px;" aria-hidden="true" />
      </button>
    </div>

    <!-- Separador gradiente sob o logo -->
    <div
      class="shrink-0"
      :style="{
        height: '1px',
        background: 'var(--zima-sidebar-separator)',
        margin: '0 0 4px',
      }"
      aria-hidden="true"
    />

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-1 hide-scrollbar" aria-label="Navegação principal">
      <template v-for="(group, groupIdx) in groups" :key="group.key">
        <!-- Separador gradiente entre grupos (exceto o primeiro) -->
        <div
          v-if="groupIdx > 0"
          v-show="!sidebarCollapsed"
          class="mx-3"
          :style="{
            height: '1px',
            background: 'var(--zima-sidebar-separator)',
            margin: '6px 12px',
          }"
          aria-hidden="true"
        />

        <!-- Group header — expandido -->
        <div
          v-show="!sidebarCollapsed"
          class="zima-sidebar__group-label px-3 pb-1"
          :style="{
            paddingTop: groupIdx === 0 ? '6px' : '10px',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--zima-text-disabled)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }"
          aria-hidden="true"
        >
          {{ group.label }}
        </div>

        <!-- Group divider — colapsado (só desktop) -->
        <div
          v-show="sidebarCollapsed"
          class="zima-sidebar__group-divider py-3 flex justify-center"
        >
          <div
            class="w-4 h-px"
            :style="{ background: 'var(--zima-border-default)', opacity: 0.6 }"
            aria-hidden="true"
          />
        </div>

        <!-- Nav items -->
        <ul class="px-2 space-y-0.5" role="list">
          <li v-for="item in group.items" :key="item.key" role="listitem">
            <component
              :is="item.to ? 'a' : 'button'"
              :href="item.to"
              type="button"
              :aria-current="isActive(item) ? 'page' : undefined"
              class="zima-sidebar__item w-full flex items-center gap-2.5 rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zima-focus-outline)]"
              :style="isActive(item) ? {
                background: 'var(--zima-sidebar-item-active-bg)',
                color: 'var(--zima-sidebar-item-active-color)',
                boxShadow: 'inset 3px 0 0 var(--zima-sidebar-item-active-border)',
              } : {
                color: 'var(--zima-text-secondary)',
              }"
              @click="handleItemClick(item)"
              @mouseenter="(e: MouseEvent) => {
                if (!isActive(item)) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'var(--zima-bg-surface-hover)'
                  el.style.color = 'var(--zima-text-primary)'
                }
              }"
              @mouseleave="(e: MouseEvent) => {
                if (!isActive(item)) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = ''
                  el.style.color = 'var(--zima-text-secondary)'
                }
              }"
            >
              <!-- Icon -->
              <Icon
                :name="item.icon"
                class="shrink-0"
                :style="{
                  width: '16px',
                  height: '16px',
                  strokeWidth: '1.5px',
                  color: isActive(item) ? 'var(--zima-blue-light)' : 'inherit',
                  filter: isActive(item) ? 'drop-shadow(0 0 4px rgba(96,165,250,0.4))' : 'none',
                  transition: 'filter 150ms ease',
                  flexShrink: 0,
                }"
                aria-hidden="true"
              />

              <!-- Label -->
              <span
                v-show="!sidebarCollapsed"
                class="zima-sidebar__item-label flex-1 text-left truncate"
                :style="{
                  fontSize: '13px',
                  letterSpacing: '-0.01em',
                }"
              >
                {{ item.label }}
              </span>

              <!-- Badge -->
              <span
                v-show="!sidebarCollapsed && !!item.badge"
                class="zima-sidebar__item-badge inline-flex items-center justify-center rounded-full text-white shrink-0"
                :style="{
                  fontSize: '10px',
                  fontWeight: '700',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  background: 'var(--zima-danger)',
                  letterSpacing: '0',
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

    <!-- Collapse toggle — desktop only -->
    <div
      class="zima-sidebar__collapse-toggle shrink-0"
      :style="{
        padding: '8px',
        background: 'var(--zima-sidebar-footer-fade)',
        borderTop: '1px solid var(--zima-border-divider)',
      }"
    >
      <button
        class="w-full flex items-center justify-center rounded-md transition-all"
        :style="{
          height: '32px',
          color: 'var(--zima-text-muted)',
          opacity: '0.65',
          transitionDuration: '150ms',
        }"
        :aria-label="sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'"
        :aria-expanded="!sidebarCollapsed"
        @click="toggleSidebar"
        @mouseenter="(e: MouseEvent) => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'var(--zima-bg-surface-hover)'
          el.style.color = 'var(--zima-text-secondary)'
          el.style.opacity = '1'
        }"
        @mouseleave="(e: MouseEvent) => {
          const el = e.currentTarget as HTMLElement
          el.style.background = ''
          el.style.color = 'var(--zima-text-muted)'
          el.style.opacity = '0.65'
        }"
      >
        <Icon
          :name="sidebarCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          :style="{
            width: '15px',
            height: '15px',
            strokeWidth: '1.5px',
            transition: 'transform 200ms ease',
          }"
          aria-hidden="true"
        />
        <span
          v-show="!sidebarCollapsed"
          class="ml-2 text-xs"
          :style="{ letterSpacing: '0.01em' }"
        >
          Colapsar
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* ------------------------------------------------------------------
 * Gates mobile/desktop via media query — evita flicker de hidratação
 * Breakpoint: 1024px (igual ao `lg:` do Tailwind)
 * ------------------------------------------------------------------ */

/* Logo hover glow */
.zima-sidebar__logo {
  filter: none;
  transition: filter 200ms ease;
}
.zima-sidebar:hover .zima-sidebar__logo {
  filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.3));
}

/* Item — transição suave */
.zima-sidebar__item {
  transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
}

/* DESKTOP (>=1024px) — comportamento fixo com colapso */
@media (min-width: 1024px) {
  .zima-sidebar {
    width: var(--zima-sidebar-width);
    transform: none;
    z-index: var(--zima-z-sidebar);
    transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .zima-sidebar.zima-sidebar--collapsed {
    width: var(--zima-sidebar-width-collapsed);
  }
  .zima-sidebar__close {
    display: none;
  }
  .zima-sidebar .zima-sidebar__item {
    padding-left: 0.625rem;
    padding-right: 0.625rem;
    height: 2.375rem;  /* 38px */
  }
  .zima-sidebar.zima-sidebar--collapsed .zima-sidebar__item {
    padding-left: 0;
    padding-right: 0;
    height: 2.5rem;
    justify-content: center;
  }
}

/* MOBILE (<1024px) — drawer off-canvas com sombra profunda */
@media (max-width: 1023.98px) {
  .zima-sidebar {
    width: var(--zima-sidebar-drawer-width);
    transform: translateX(-100%);
    z-index: var(--zima-z-overlay);
    transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
  }
  .zima-sidebar.zima-sidebar--mobile-open {
    transform: translateX(0);
    box-shadow: 6px 0 48px rgba(0, 0, 0, 0.6);
  }
  /* Em mobile, sidebar sempre expandida */
  .zima-sidebar .zima-sidebar__app-name,
  .zima-sidebar .zima-sidebar__group-label,
  .zima-sidebar .zima-sidebar__item-label,
  .zima-sidebar .zima-sidebar__item-badge {
    display: revert !important;
  }
  .zima-sidebar .zima-sidebar__group-divider {
    display: none !important;
  }
  .zima-sidebar__collapse-toggle {
    display: none;
  }
  .zima-sidebar__item {
    padding-left: 0.625rem;
    padding-right: 0.625rem;
    height: 2.375rem;
    justify-content: flex-start;
  }
}
</style>
