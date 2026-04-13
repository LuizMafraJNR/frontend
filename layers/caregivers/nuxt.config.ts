// Layer Caregivers: domínio de cuidadores
// Depende de: core, ui, auth
export default defineNuxtConfig({
  routeRules: {
    '/cuidadores/**': { ssr: true },
  },
})
