import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import { ref } from 'vue'
import ZimaSubTabs from './ZimaSubTabs.vue'
import type { ZimaSubTab } from './ZimaSubTabs.vue'

const meta: Meta<typeof ZimaSubTabs> = {
  title: 'Zima/ZimaSubTabs',
  component: ZimaSubTabs,
  tags: ['autodocs'],
  argTypes: {
    spaced: {
      control: 'boolean',
      description: 'Adiciona margem inferior (var(--zima-page-gap)) abaixo das tabs',
    },
  },
  args: {
    spaced: true,
  },
}

export default meta
type Story = StoryObj<typeof meta>

const defaultTabs: ZimaSubTab[] = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'despesas', label: 'Despesas' },
  { key: 'relatorios', label: 'Relatórios' },
]

export const Padrao: Story = {
  name: 'Padrão',
  render: args => ({
    components: { ZimaSubTabs },
    setup() {
      const active = ref('overview')
      const tabs = defaultTabs
      return { args, active, tabs }
    },
    template: '<ZimaSubTabs v-bind="args" :tabs="tabs" v-model="active" />',
  }),
}

export const ComContadores: Story = {
  name: 'Com Contadores',
  render: () => ({
    components: { ZimaSubTabs },
    setup() {
      const active = ref('pendentes')
      const tabs: ZimaSubTab[] = [
        { key: 'todos',     label: 'Todos',     count: 148 },
        { key: 'pendentes', label: 'Pendentes', count: 12 },
        { key: 'confirmados', label: 'Confirmados', count: 89 },
        { key: 'cancelados', label: 'Cancelados', count: 7 },
      ]
      return { active, tabs }
    },
    template: '<ZimaSubTabs :tabs="tabs" v-model="active" />',
  }),
}

export const ComDesabilitado: Story = {
  name: 'Com Tab Desabilitada',
  render: () => ({
    components: { ZimaSubTabs },
    setup() {
      const active = ref('ativo')
      const tabs: ZimaSubTab[] = [
        { key: 'ativo',      label: 'Ativo' },
        { key: 'agendado',   label: 'Agendado' },
        { key: 'bloqueado',  label: 'Em breve', disabled: true },
      ]
      return { active, tabs }
    },
    template: '<ZimaSubTabs :tabs="tabs" v-model="active" />',
  }),
}

export const MuitasAbas: Story = {
  name: 'Scroll horizontal (muitas abas)',
  render: () => ({
    components: { ZimaSubTabs },
    setup() {
      const active = ref('tab1')
      const tabs: ZimaSubTab[] = Array.from({ length: 10 }, (_, i) => ({
        key: `tab${i + 1}`,
        label: `Aba ${i + 1}`,
        count: i % 3 === 0 ? Math.floor(Math.random() * 50) : undefined,
      }))
      return { active, tabs }
    },
    template: '<div style="max-width: 480px;"><ZimaSubTabs :tabs="tabs" v-model="active" /></div>',
  }),
}
