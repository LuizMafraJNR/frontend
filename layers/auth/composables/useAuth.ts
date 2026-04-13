import { createAuthRepository } from '../repositories/auth.repository'
import { useAuthStore } from '../stores/auth'

// Composable orquestra repository + store.
// Componentes chamam useAuth() — nunca acessam repository ou store diretamente.

export function useAuth() {
  const { $fetch } = useNuxtApp()
  const store = useAuthStore()
  const localePath = useLocalePath()

  const repository = createAuthRepository($fetch as Parameters<typeof createAuthRepository>[0])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const tokens = await repository.login({ email, password })
      store.setTokens(tokens)
      await navigateTo(localePath('/'))
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao fazer login'
    }
    finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await repository.logout()
    }
    finally {
      store.clearSession()
      await navigateTo(localePath('/login'))
    }
  }

  return {
    login,
    logout,
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated: computed(() => store.isAuthenticated),
    user: computed(() => store.user),
    isAdmin: computed(() => store.isAdmin),
  }
}
