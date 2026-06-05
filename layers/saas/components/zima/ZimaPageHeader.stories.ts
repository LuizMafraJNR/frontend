import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import ZimaPageHeader from './ZimaPageHeader.vue'

const meta: Meta<typeof ZimaPageHeader> = {
  title: 'Zima/ZimaPageHeader',
  component: ZimaPageHeader,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Título principal da página' },
    description: { control: 'text', description: 'Subtítulo/descrição abaixo do título' },
    badge: { control: 'text', description: 'Badge inline ao lado do título' },
  },
  args: {
    title: 'Agenda',
    description: 'Gerencie seus agendamentos e disponibilidade',
    badge: '',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  name: 'Padrão',
  render: args => ({
    components: { ZimaPageHeader },
    setup: () => ({ args }),
    template: '<ZimaPageHeader v-bind="args" />',
  }),
}

export const ComBadge: Story = {
  name: 'Com Badge',
  args: {
    title: 'Clientes',
    description: 'Base completa de clientes da sua empresa',
    badge: '248',
  },
  render: args => ({
    components: { ZimaPageHeader },
    setup: () => ({ args }),
    template: '<ZimaPageHeader v-bind="args" />',
  }),
}

export const ComAcoes: Story = {
  name: 'Com Ações',
  render: args => ({
    components: { ZimaPageHeader },
    setup: () => ({ args }),
    template: `
      <ZimaPageHeader v-bind="args">
        <template #actions>
          <button
            style="padding: 7px 14px; font-size: 13px; font-weight: 500; border-radius: 6px;
                   background: var(--zima-blue-core); color: #fff; border: none; cursor: pointer;"
          >
            + Novo Agendamento
          </button>
        </template>
      </ZimaPageHeader>
    `,
  }),
}

export const ComTabs: Story = {
  name: 'Com Tabs abaixo',
  render: args => ({
    components: { ZimaPageHeader },
    setup: () => ({ args }),
    template: `
      <ZimaPageHeader v-bind="args">
        <template #actions>
          <button
            style="padding: 7px 14px; font-size: 13px; font-weight: 500; border-radius: 6px;
                   background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);
                   color: var(--zima-text-secondary); cursor: pointer;"
          >
            Exportar
          </button>
        </template>
        <template #tabs>
          <div style="display: flex; gap: 4px; border-bottom: 1px solid var(--zima-border-divider);">
            <button
              style="padding: 10px 16px; font-size: 13px; font-weight: 500; background: none; border: none;
                     cursor: pointer; border-bottom: 2px solid var(--zima-blue-core); margin-bottom: -1px;
                     color: var(--zima-blue-core);"
            >Visão Geral</button>
            <button
              style="padding: 10px 16px; font-size: 13px; background: none; border: none; cursor: pointer;
                     border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--zima-text-muted);"
            >Detalhes</button>
          </div>
        </template>
      </ZimaPageHeader>
    `,
  }),
}

export const SomenteTitulo: Story = {
  name: 'Somente Título',
  args: {
    title: 'Configurações',
    description: '',
  },
  render: args => ({
    components: { ZimaPageHeader },
    setup: () => ({ args }),
    template: '<ZimaPageHeader v-bind="args" />',
  }),
}
