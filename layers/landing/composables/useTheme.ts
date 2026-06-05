export type ThemeMode = 'eclipse' | 'light'

const STORAGE_KEY = 'zima_theme'

export function useTheme() {
  const themeMode = useState<ThemeMode>('landing-theme', () => {
    if (import.meta.client) {
      return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'eclipse'
    }
    return 'eclipse'
  })

  function applyTheme(mode: ThemeMode) {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', mode)
    }
  }

  function toggleTheme() {
    const next: ThemeMode = themeMode.value === 'eclipse' ? 'light' : 'eclipse'
    themeMode.value = next
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
    }
  }

  onMounted(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'eclipse'
    themeMode.value = saved
    applyTheme(saved)
  })

  return { themeMode, toggleTheme }
}
