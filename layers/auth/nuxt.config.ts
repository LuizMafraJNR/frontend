// Layer Auth: login, registro, sessão, middleware de autenticação
// Depende de: core, ui
export default defineNuxtConfig({
  routeRules: {
    '/login': { ssr: true },
    '/register': { ssr: true },
  },
})
