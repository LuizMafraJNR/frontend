import type { $Fetch } from 'nitropack'

// === TYPES ===

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number // segundos
}

// === INTERFACE DO REPOSITÓRIO ===
// Definir interface permite trocar implementação e facilita mock em testes

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthTokens>
  register(data: RegisterData): Promise<AuthTokens>
  logout(): Promise<void>
  refresh(refreshToken: string): Promise<AuthTokens>
}

// === FACTORY FUNCTION (padrão de injeção de dependência) ===
// Nunca chamar $fetch diretamente em componentes ou stores — sempre via repositório

export function createAuthRepository($fetch: $Fetch): AuthRepository {
  return {
    login(credentials) {
      return $fetch<AuthTokens>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      })
    },

    register(data) {
      return $fetch<AuthTokens>('/api/auth/register', {
        method: 'POST',
        body: data,
      })
    },

    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
    },

    refresh(refreshToken) {
      return $fetch<AuthTokens>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      })
    },
  }
}
