// Layer Patients: domínio de pacientes
// Depende de: core, ui, auth
export default defineNuxtConfig({
  routeRules: {
    '/pacientes/**': { ssr: true },
  },
})
