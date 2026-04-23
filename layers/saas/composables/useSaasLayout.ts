/**
 * Estado global do layout SaaS.
 * Controla: sidebar collapsed, command palette, notificações, viewport mobile.
 */
const MOBILE_BREAKPOINT = 1024

let resizeListenerAttached = false

export const useSaasLayout = () => {
  const sidebarCollapsed = useState<boolean>('saas:sidebar:collapsed', () => false)
  const sidebarMobileOpen = useState<boolean>('saas:sidebar:mobile-open', () => false)
  const commandPaletteOpen = useState<boolean>('saas:command:open', () => false)
  const notificationsOpen = useState<boolean>('saas:notifications:open', () => false)
  const isMobile = useState<boolean>('saas:is-mobile', () => false)

  // Um único listener global de resize, em vez de um por componente
  if (import.meta.client && !resizeListenerAttached) {
    resizeListenerAttached = true
    const update = () => { isMobile.value = window.innerWidth < MOBILE_BREAKPOINT }
    update()
    window.addEventListener('resize', update, { passive: true })
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const toggleSidebarMobile = () => {
    sidebarMobileOpen.value = !sidebarMobileOpen.value
  }

  const closeSidebarMobile = () => {
    sidebarMobileOpen.value = false
  }

  const openCommandPalette = () => {
    commandPaletteOpen.value = true
  }

  const closeCommandPalette = () => {
    commandPaletteOpen.value = false
  }

  // Atalho ⌘K / Ctrl+K — registrar uma única vez no layout raiz
  const setupCommandPaletteShortcut = () => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        commandPaletteOpen.value = !commandPaletteOpen.value
      }
      if (e.key === 'Escape') {
        commandPaletteOpen.value = false
        notificationsOpen.value = false
      }
    }
    onMounted(() => window.addEventListener('keydown', handler))
    onUnmounted(() => window.removeEventListener('keydown', handler))
  }

  return {
    sidebarCollapsed,
    sidebarMobileOpen,
    commandPaletteOpen,
    notificationsOpen,
    isMobile,
    toggleSidebar,
    toggleSidebarMobile,
    closeSidebarMobile,
    openCommandPalette,
    closeCommandPalette,
    setupCommandPaletteShortcut,
  }
}
