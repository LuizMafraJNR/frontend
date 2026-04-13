import { defineStore } from 'pinia'
import type { AuthTokens } from '../repositories/auth.repository'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'caregiver' | 'viewer'
  avatarUrl?: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: number | null // timestamp ms
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
  }),

  getters: {
    isAuthenticated: (state): boolean =>
      !!state.accessToken && Date.now() < (state.tokenExpiresAt ?? 0),

    isAdmin: (state): boolean => state.user?.role === 'admin',

    displayName: (state): string => state.user?.name ?? '',
  },

  actions: {
    setTokens(tokens: AuthTokens) {
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken
      this.tokenExpiresAt = Date.now() + tokens.expiresIn * 1000
    },

    setUser(user: AuthUser) {
      this.user = user
    },

    clearSession() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.tokenExpiresAt = null
    },
  },
})
