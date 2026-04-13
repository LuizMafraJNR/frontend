# Guia de Testes

## Stack

- **Vitest** — runner de testes unitários e de componente
- **@nuxt/test-utils** — utilitários Nuxt-aware
- **@testing-library/vue** — testes centrados no usuário
- **happy-dom** — ambiente DOM

## Comandos

```bash
npm run test              # execução única
npm run test:watch        # modo watch
npm run test:coverage     # relatório de cobertura em coverage/
```

## Localização dos Arquivos

- Testes de componente: `layers/<nome>/tests/*.test.ts`
- Testes de composable/utils: co-localizados ou em `layers/<nome>/tests/`
- Testes de integração: `tests/unit/`

## Exemplo — Teste de Componente

```typescript
import { render, screen } from '@testing-library/vue'
import { userEvent } from '@testing-library/user-event'
import BaseButton from '@/layers/ui/components/base/BaseButton.vue'

test('emite click quando não está desabilitado', async () => {
  const user = userEvent.setup()
  const { emitted } = render(BaseButton, { slots: { default: 'Clique' } })
  await user.click(screen.getByRole('button'))
  expect(emitted('click')).toHaveLength(1)
})
```

## Exemplo — Mock de Repository

```typescript
import { vi, describe, it, expect } from 'vitest'
import { createAuthRepository } from '@/layers/auth/repositories/auth.repository'

// Mock da factory — retorna implementação controlada
vi.mock('@/layers/auth/repositories/auth.repository', () => ({
  createAuthRepository: vi.fn(() => ({
    login: vi.fn().mockResolvedValue({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    }),
    logout: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
  })),
}))
```

## Exemplo — Teste com Pinia

```typescript
import { createTestingPinia } from '@pinia/testing'
import { render } from '@testing-library/vue'
import MyComponent from './MyComponent.vue'

render(MyComponent, {
  global: {
    plugins: [
      createTestingPinia({ initialState: { auth: { user: { id: '1', name: 'Test' } } } }),
    ],
  },
})
```

## Targets de Cobertura

| Camada | Target |
|---|---|
| repositories | 90%+ (funções puras, fácil de testar) |
| composables | 80%+ |
| stores | 70%+ |
| components | 60%+ (caminhos críticos) |

## O Que NÃO Testar

- Markup estático sem lógica
- Props passagem direta (sem transformação)
- Geração de classes CSS
