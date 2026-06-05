import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: { compatibilityVersion: 4 },

  // SSR habilitado (padrão Nuxt 4)
  ssr: true,

  // Nuxt Layers — cada domínio é uma layer independente
  extends: [
    './layers/core',
    './layers/ui',
    './layers/landing',   // Landing page pública (pré-renderizada)
    './layers/saas',      // Design System Zima Blue — SaaS de gestão
    './layers/auth',
    './layers/patients',
    './layers/caregivers',
    './layers/scheduling',
  ],

  modules: [
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@nuxt/image',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/fonts',
    // 'nuxt-api-shield', // incompatível com Nuxt 4 — defineEventHandler not defined
  ],

  icon: {
    // clientBundle: empacota todos os ícones Lucide no JS do cliente — zero requisições de rede
    // Elimina o GET /api/_nuxt_icon/lucide.json a cada navegação
    provider: 'iconify',
    collections: ['lucide'],
    clientBundle: {
      scan: true,                // detecta automaticamente todos os <Icon name="i-lucide-*"> usados
      sizeLimitKb: 512,          // limite do bundle (lucide completo ~300KB)
    },
  },

  // Tailwind v4 via Vite plugin (sem tailwind.config.js)
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
      watch: {
        // Força Vite a observar mudanças nas layers para o Tailwind JIT regenerar as classes zima-*
        ignored: ['!**/layers/**'],
      },
    },
  },


  css: ['~/assets/css/main.css'],

  // TypeScript strict
  typescript: {
    strict: true,
    typeCheck: false, // usar `npm run typecheck` separado via vue-tsc
    shim: false,
  },

  // Internacionalização
  i18n: {
    locales: [
      { code: 'pt-BR', language: 'pt-BR', file: 'pt-BR.json', name: 'Português' },
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
    ],
    defaultLocale: 'pt-BR',
    lazy: false,
    langDir: 'locales', // arquivos lidos de i18n/locales/ — NÃO editar i18n/*.json (esses são ignorados)
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      fallbackLocale: 'pt-BR',
    },
  },

  // Imagens otimizadas
  image: {
    quality: 80,
    formats: ['avif', 'webp'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  // Pinia — detectar stores de todas as layers
  pinia: {
    storesDirs: ['./layers/*/stores/**'],
  },

  // Fontes auto-otimizadas
  fonts: {
    families: [
      // Fontes originais do app Cuidados
      { name: 'Inter', provider: 'google' },
      { name: 'Poppins', weights: [400, 600, 700], provider: 'google' },
      // Fontes do Design System Zima Blue (Geist via bunny/fontsource)
      { name: 'Geist', weights: [400, 500, 600, 700], provider: 'bunny' },
      { name: 'Geist Mono', weights: [400, 500, 600], provider: 'bunny' },
    ],
  },

  // Route rules de performance
  routeRules: {
    '/': { prerender: true },      // Landing pré-renderizada (HTML estático, melhor PageSpeed)
    '/en': { prerender: true },    // Versão EN pré-renderizada
    '/login': { ssr: true },
    '/register': { ssr: true },
    '/pacientes/**': { ssr: true },
    '/cuidadores/**': { ssr: true },
    '/agendamentos/**': { ssr: true },
    '/saas/**': { ssr: true },
  },

  // Head padrão
  app: {
    head: {
      title: 'Zima — Gestão completa para salões, clínicas e cuidados',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Agenda, clientes, financeiro, estoque, nota fiscal, IA para atendimento e campanhas — para salões, clínicas de estética, petshops e estúdios. Feito em Joinville, SC.' },
        { name: 'theme-color', content: '#3B82F6' },
        { property: 'og:site_name', content: 'Zima' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo-capa-com-fundo.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  devtools: { enabled: true },

  // Features experimentais de performance
  experimental: {
    payloadExtraction: true,
    typedPages: true,
  },
})
