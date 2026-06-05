/**
 * useProfile — perfil do usuário logado (persistido).
 * Fonte única para a topbar (nome/avatar/função) e a página de perfil.
 */
export interface UserProfile {
  name: string
  email: string
  role: string
  phone: string
  avatarUrl: string | null
}

const profile = persistedRef<UserProfile>('profile:user', () => ({
  name: 'Luiz Matos',
  email: 'luiz@studiobeleza.com.br',
  role: 'Proprietário',
  phone: '(11) 98888-7777',
  avatarUrl: null,
}))

export const useProfile = () => {
  const updateProfile = (data: Partial<UserProfile>) => {
    profile.value = { ...profile.value, ...data }
  }
  return { profile, updateProfile }
}
