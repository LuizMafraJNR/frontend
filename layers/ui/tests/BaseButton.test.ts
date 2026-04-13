import { render, screen } from '@testing-library/vue'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import BaseButton from '../components/base/BaseButton.vue'

describe('BaseButton', () => {
  it('renderiza o slot corretamente', () => {
    render(BaseButton, { slots: { default: 'Confirmar' } })
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('emite evento click quando clicado', async () => {
    const user = userEvent.setup()
    const { emitted } = render(BaseButton, { slots: { default: 'Clique' } })
    await user.click(screen.getByRole('button'))
    expect(emitted('click')).toHaveLength(1)
  })

  it('não emite click quando disabled', async () => {
    const user = userEvent.setup()
    const { emitted } = render(BaseButton, {
      props: { disabled: true },
      slots: { default: 'Desabilitado' },
    })
    await user.click(screen.getByRole('button'))
    expect(emitted('click')).toBeUndefined()
  })

  it('não emite click quando loading', async () => {
    const user = userEvent.setup()
    const { emitted } = render(BaseButton, {
      props: { loading: true },
      slots: { default: 'Salvando' },
    })
    await user.click(screen.getByRole('button'))
    expect(emitted('click')).toBeUndefined()
  })

  it('mostra spinner quando loading=true', () => {
    render(BaseButton, { props: { loading: true }, slots: { default: 'Salvando' } })
    expect(document.querySelector('[aria-hidden="true"].animate-spin')).toBeInTheDocument()
  })

  it('aplica variante danger', () => {
    render(BaseButton, { props: { variant: 'danger' }, slots: { default: 'Excluir' } })
    expect(screen.getByRole('button')).toHaveClass('bg-danger-500')
  })
})
