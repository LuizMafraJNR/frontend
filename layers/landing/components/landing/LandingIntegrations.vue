<script setup lang="ts">
const { t } = useI18n()

const integs = [
  { n: 'WhatsApp Business', c: '#25D366', i: 'whatsapp' },
  { n: 'Instagram',         c: '#E1306C', i: 'instagram' },
  { n: 'Google Calendar',   c: '#4285F4', i: 'calendar' },
  { n: 'PIX',               c: '#32BCAD', i: 'pix' },
  { n: 'Stripe',            c: '#6772E5', i: 'card' },
  { n: 'Mercado Pago',      c: '#00B1EA', i: 'wallet' },
  { n: 'NFS-e Municipal',   c: '#10B981', i: 'receipt' },
  { n: 'Receita Federal',   c: '#F59E0B', i: 'shield' },
  { n: 'Contabilidade BR',  c: '#A855F7', i: 'chart' },
  { n: 'iFood Beleza',      c: '#EA1D2C', i: 'spark' },
  { n: 'Google Sheets',     c: '#0F9D58', i: 'chart' },
  { n: 'Zapier',            c: '#FF4A00', i: 'bolt' },
]
</script>

<template>
  <section class="section section--tight">
    <div class="container">
      <header class="sect-head">
        <span class="eyebrow"><span class="dot" /> {{ t('landing.integ.eyebrow') }}</span>
        <h2 class="title-multiline">{{ t('landing.integ.title') }}</h2>
        <p class="sect-sub">{{ t('landing.integ.sub') }}</p>
      </header>
      <div class="integ-grid">
        <div v-for="it in integs" :key="it.n" class="integ-card">
          <div
            class="integ-icon"
            :style="{
              background: `linear-gradient(135deg, ${it.c}33, ${it.c}11)`,
              color: it.c,
              borderColor: `${it.c}44`,
            }"
          >
            <LandingIcon :name="it.i" :size="18" />
          </div>
          <div class="integ-name">{{ it.n }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
