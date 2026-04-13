// Regras de validação — retornam string de erro ou undefined

export function validateEmail(email: string): string | undefined {
  if (!email) return 'E-mail é obrigatório'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido'
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Senha é obrigatória'
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula'
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número'
}

export function validateCPF(cpf: string): string | undefined {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return 'CPF deve ter 11 dígitos'
  if (/^(\d)\1{10}$/.test(digits)) return 'CPF inválido'
}

export function validateRequired(value: unknown, label = 'Campo'): string | undefined {
  if (value === undefined || value === null || value === '') {
    return `${label} é obrigatório`
  }
}
