import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import BaseButton from '../components/base/BaseButton.vue'

const meta: Meta<typeof BaseButton> = {
  title: 'UI/Base/BaseButton',
  component: BaseButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Variante visual do botão',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamanho do botão',
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: args => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">Confirmar</BaseButton>',
  }),
}

export const AllVariants: Story = {
  name: 'Todas as Variantes',
  render: () => ({
    components: { BaseButton },
    template: `
      <div class="flex flex-wrap gap-4">
        <BaseButton variant="primary">Primary</BaseButton>
        <BaseButton variant="secondary">Secondary</BaseButton>
        <BaseButton variant="ghost">Ghost</BaseButton>
        <BaseButton variant="danger">Danger</BaseButton>
      </div>
    `,
  }),
}

export const AllSizes: Story = {
  name: 'Todos os Tamanhos',
  render: () => ({
    components: { BaseButton },
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <BaseButton size="sm">Pequeno</BaseButton>
        <BaseButton size="md">Médio</BaseButton>
        <BaseButton size="lg">Grande</BaseButton>
      </div>
    `,
  }),
}

export const Loading: Story = {
  name: 'Carregando',
  args: { loading: true },
  render: args => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">Salvando...</BaseButton>',
  }),
}

export const Disabled: Story = {
  name: 'Desabilitado',
  args: { disabled: true },
  render: args => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">Indisponível</BaseButton>',
  }),
}
