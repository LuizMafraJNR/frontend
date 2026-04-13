import type { StorybookConfig } from '@storybook-vue/nuxt'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  stories: [
    // Stories nas layers (principal)
    '../layers/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    // Stories de componentes na pasta app (se houver)
    '../app/components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook-vue/nuxt',
  viteFinal(config) {
    // Adicionar Tailwind v4 ao Vite do Storybook
    config.plugins = config.plugins ?? []
    config.plugins.push(tailwindcss())
    return config
  },
  docs: {
    autodocs: 'tag',
  },
}

export default config
