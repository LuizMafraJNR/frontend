/**
 * Reidrata os dados mock do SaaS a partir do localStorage — APÓS a hidratação
 * do Vue (onNuxtReady). Isso é deliberado: ler o localStorage durante a primeira
 * render do cliente causaria hydration mismatch (o servidor renderizou o seed).
 * Ao adiar para onNuxtReady, servidor e cliente renderizam o seed primeiro
 * (idênticos) e os valores persistidos são aplicados logo em seguida.
 *
 * Ver layers/saas/composables/useMockPersistence.ts (hydrateAll).
 */
export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    hydrateAll()
  })
})
