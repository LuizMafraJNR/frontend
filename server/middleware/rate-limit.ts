// Rate limiting é gerenciado pelo módulo nuxt-api-shield (configurado em nuxt.config.ts).
// Este arquivo existe para overrides customizados por rota, se necessário.
// Exemplo: aplicar limites diferentes para /api/auth vs /api/*

export default defineEventHandler((_event) => {
  // nuxt-api-shield aplica automaticamente as regras globais configuradas.
  // Para criar exceções ou limites específicos, inspecionar 'event.path' aqui.
})
