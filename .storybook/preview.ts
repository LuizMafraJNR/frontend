import type { Preview } from '@storybook-vue/nuxt'
import { setup } from '@storybook-vue/nuxt'
import { createPinia } from 'pinia'

// Importa design tokens e Tailwind para todas as stories
import '../app/assets/css/main.css'

// Instala plugins globais necessários
setup((app) => {
  app.use(createPinia())
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f9fafb' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#111827' },
      ],
    },
    viewport: {
      viewports: {
        mobile:  { name: 'Mobile',  styles: { width: '375px',  height: '812px' } },
        tablet:  { name: 'Tablet',  styles: { width: '768px',  height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
    },
  },
}

export default preview
