// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import storybook from 'eslint-plugin-storybook'

export default withNuxt(
  // Regras do Storybook para arquivos *.stories.ts
  ...storybook.configs['flat/recommended'],
)
