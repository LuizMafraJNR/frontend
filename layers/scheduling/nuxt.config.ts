// Layer Scheduling: domínio de agendamentos
// Depende de: core, ui, auth, patients, caregivers
export default defineNuxtConfig({
  routeRules: {
    '/agendamentos/**': { ssr: true },
  },
})
