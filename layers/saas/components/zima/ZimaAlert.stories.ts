import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import ZimaAlert from './ZimaAlert.vue'

const meta: Meta<typeof ZimaAlert> = {
  title: 'Zima/ZimaAlert',
  component: ZimaAlert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
      description: 'Variante semântica do alerta',
    },
    message: { control: 'text', description: 'Texto da mensagem (alternativa ao slot)' },
    icon: { control: 'boolean', description: 'Exibe ícone à esquerda' },
    dismissible: { control: 'boolean', description: 'Exibe botão de fechar' },
  },
  args: {
    variant: 'info',
    message: 'Esta é uma mensagem informativa contextual.',
    icon: true,
    dismissible: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  name: 'Info (padrão)',
  render: args => ({
    components: { ZimaAlert },
    setup: () => ({ args }),
    template: '<ZimaAlert v-bind="args" />',
  }),
}

export const AllVariants: Story = {
  name: 'Todas as Variantes',
  render: () => ({
    components: { ZimaAlert },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 480px;">
        <ZimaAlert variant="info"    message="Informação: verifique os dados antes de continuar." />
        <ZimaAlert variant="success" message="Sucesso: agendamento confirmado com o cliente." />
        <ZimaAlert variant="warning" message="Atenção: estoque abaixo do mínimo configurado." />
        <ZimaAlert variant="danger"  message="Erro: não foi possível processar o pagamento." />
      </div>
    `,
  }),
}

export const Dismissible: Story = {
  name: 'Descartável',
  args: {
    variant: 'warning',
    message: 'Este alerta pode ser fechado pelo usuário.',
    dismissible: true,
  },
  render: args => ({
    components: { ZimaAlert },
    setup: () => ({ args }),
    template: '<ZimaAlert v-bind="args" />',
  }),
}

export const WithSlot: Story = {
  name: 'Conteúdo via Slot',
  render: () => ({
    components: { ZimaAlert },
    template: `
      <ZimaAlert variant="info" style="max-width: 480px;">
        <p style="font-size: 13px; color: var(--zima-text-secondary); margin: 0;">
          Você pode incluir <strong>HTML rico</strong> via slot padrão,
          como links e botões adicionais.
        </p>
      </ZimaAlert>
    `,
  }),
}

export const SemIcone: Story = {
  name: 'Sem Ícone',
  args: {
    variant: 'danger',
    message: 'Alerta sem ícone à esquerda.',
    icon: false,
  },
  render: args => ({
    components: { ZimaAlert },
    setup: () => ({ args }),
    template: '<ZimaAlert v-bind="args" style="max-width: 480px;" />',
  }),
}
