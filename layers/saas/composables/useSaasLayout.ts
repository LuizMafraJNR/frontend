/**
 * Estado global do layout SaaS.
 * Controla: sidebar collapsed, command palette, notificações.
 */
export const useSaasLayout = () => {
  const sidebarCollapsed = useState<boolean>('saas:sidebar:collapsed', () => false)
  const commandPaletteOpen = useState<boolean>('saas:command:open', () => false)
  const notificationsOpen = useState<boolean>('saas:notifications:open', () => false)

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
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
    commandPaletteOpen,
    notificationsOpen,
    toggleSidebar,
    openCommandPalette,
    closeCommandPalette,
    setupCommandPaletteShortcut,
  }
}
