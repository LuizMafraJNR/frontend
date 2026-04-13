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
    lazy: true,
    // langDir é relativo a i18nDir (raiz/i18n/). Default: 'locales' → raiz/i18n/locales/
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
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
    '/': { redirect: '/saas' },
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
      title: 'IMAI',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'IMAI — Plataforma de gestão inteligente' },
      ],
      link: [
        // Favicon polvo via SVG emoji (suportado em todos os browsers modernos)
        { rel: 'icon', type: 'image/svg+xml', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐙</text></svg>' },
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
