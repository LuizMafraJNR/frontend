<script setup lang="ts">
const { t } = useI18n()
const { themeMode } = useTheme()
const SITE_URL = 'https://zimaapp.com.br' // substituir quando o domínio for definido

definePageMeta({
  layout: 'landing',
})

useSeoMeta({
  title: 'Zima — Gestão completa para salões, clínicas e cuidados',
  description: 'Agenda, clientes, financeiro, estoque, nota fiscal, IA para atendimento e campanhas — para salões, clínicas de estética, petshops e estúdios. Feito em Joinville, SC.',
  ogTitle: 'Zima — Gestão completa para salões, clínicas e cuidados',
  ogDescription: 'Agenda, PDV, DRE, IA, fiscal e marketing em um lugar só. Feito em Joinville, SC.',
  ogImage: `${SITE_URL}/og-image.png`,
  ogUrl: SITE_URL,
  ogType: 'website',
  ogSiteName: 'Zima',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Zima — Gestão completa para salões, clínicas e cuidados',
  twitterDescription: 'Agenda, PDV, DRE, IA, fiscal e marketing em um lugar só.',
  twitterImage: `${SITE_URL}/og-image.png`,
  robots: 'index, follow',
  themeColor: '#3B82F6',
})

const faqItems = [
  ['Quando o Zima vai lançar?', 'Estamos em beta fechado com um grupo seleto de parceiros. A previsão de lançamento público é para o segundo semestre de 2025. Inscreva-se na lista de espera para ser notificado em primeira mão.'],
  ['E se eu já uso outro sistema? Como migro?', 'Importamos clientes, agenda e catálogo de planilha ou diretamente de Booksy, Trinks, Mindbody e iGestão. Nosso time faz a migração junto com você, sem custo.'],
  ['A nota fiscal funciona na minha cidade?', 'NFS-e está homologada em mais de 4.500 municípios brasileiros, incluindo todas as capitais. Se sua cidade ainda não estiver, integramos em até 5 dias úteis.'],
  ['Funciona no celular?', 'Sim. Toda a plataforma é responsiva e há aplicativo nativo iOS e Android para você operar agenda, PDV e atendimento de qualquer lugar.'],
  ['E se minha equipe é pequena? Vale a pena?', 'O plano Starter foi desenhado para profissionais sozinhos. A partir de R$ 79/mês você já tem agenda profissional, CRM e PDV — mais barato que perder 1 cliente por mês por no-show.'],
  ['Como funciona a IA de atendimento?', 'Você configura nome, tom de voz e base de conhecimento. A IA responde no WhatsApp, agenda, confirma e transfere para humano quando necessário. Treinada com casos do setor de beleza.'],
  ['Meus dados ficam seguros?', 'Conformidade LGPD, criptografia em repouso e em trânsito, backups diários, certificação ISO 27001 em andamento. Você é dono dos seus dados — exportação em CSV a qualquer momento.'],
]

useHead({
  htmlAttrs: { 'data-theme': themeMode.value },
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            name: 'Zima',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, iOS, Android',
            description: 'Plataforma completa de gestão para salões, clínicas de estética, petshops e estúdios. Agenda, PDV, DRE, IA, fiscal e marketing em um lugar só.',
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '79',
              highPrice: '189',
              priceCurrency: 'BRL',
            },
            url: SITE_URL,
            screenshot: `${SITE_URL}/og-image.png`,
          },
          {
            '@type': 'Organization',
            name: 'Zima Tecnologia',
            url: SITE_URL,
            logo: `${SITE_URL}/logo-capa-com-fundo.png`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Joinville',
              addressRegion: 'SC',
              addressCountry: 'BR',
            },
            sameAs: [
              'https://instagram.com/zimaapp',
            ],
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqItems.map(([q, a]) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          },
        ],
      }),
    },
  ],
  link: [
    { rel: 'canonical', href: SITE_URL },
  ],
})
</script>

<template>
  <LandingNav />
  <main>
    <LandingHero />
    <LandingProblem />
    <LandingSolution />
    <LandingFeatures />
    <LandingDifferentials />
    <LandingComparison />
    <LandingWaitlist />
    <LandingTestimonials />
    <LandingPricing />
    <LandingIntegrations />
    <LandingFAQ />
    <LandingCTA />
  </main>
  <LandingFooter />
</template>
