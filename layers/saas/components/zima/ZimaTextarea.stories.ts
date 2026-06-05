import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import { ref } from 'vue'
import ZimaTextarea from './ZimaTextarea.vue'

const meta: Meta<typeof ZimaTextarea> = {
  title: 'Zima/ZimaTextarea',
  component: ZimaTextarea,
  tags: ['autodocs'],
  argTypes: {
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
      description: 'Modo de redimensionamento',
    },
    rows: { control: { type: 'number', min: 1, max: 20 }, description: 'Número de linhas visíveis' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
  },
  args: {
    label: 'Observações',
    placeholder: 'Digite suas observações aqui...',
    rows: 3,
    resize: 'vertical',
    disabled: false,
    required: false,
    hint: '',
    error: '',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  name: 'Padrão',
  render: args => ({
    components: { ZimaTextarea },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: '<ZimaTextarea v-bind="args" v-model="value" style="max-width: 420px;" />',
  }),
}

export const ComHint: Story = {
  name: 'Com Dica',
  args: {
    label: 'Instruções para o profissional',
    placeholder: 'Ex: cliente prefere serviço sem vapor...',
    hint: 'Visível apenas para a equipe interna.',
  },
  render: args => ({
    components: { ZimaTextarea },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: '<ZimaTextarea v-bind="args" v-model="value" style="max-width: 420px;" />',
  }),
}

export const ComErro: Story = {
  name: 'Com Erro',
  args: {
    label: 'Motivo do cancelamento',
    placeholder: 'Descreva o motivo...',
    required: true,
    error: 'Campo obrigatório — informe o motivo do cancelamento.',
  },
  render: args => ({
    components: { ZimaTextarea },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: '<ZimaTextarea v-bind="args" v-model="value" style="max-width: 420px;" />',
  }),
}

export const Desabilitado: Story = {
  name: 'Desabilitado',
  args: {
    label: 'Histórico (somente leitura)',
    modelValue: 'Cliente atendido em 15/05/2026. Retorno programado para 3 meses.',
    disabled: true,
  },
  render: args => ({
    components: { ZimaTextarea },
    setup: () => ({ args }),
    template: '<ZimaTextarea v-bind="args" style="max-width: 420px;" />',
  }),
}

export const SemResize: Story = {
  name: 'Sem Redimensionamento',
  args: {
    label: 'Mensagem automática',
    placeholder: 'Escreva a mensagem que será enviada automaticamente...',
    resize: 'none',
    rows: 4,
  },
  render: args => ({
    components: { ZimaTextarea },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: '<ZimaTextarea v-bind="args" v-model="value" style="max-width: 420px;" />',
  }),
}
