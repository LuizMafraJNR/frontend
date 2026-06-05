<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()
const yearly = ref(true)
const tiers = computed(() => data.value.pricing.tiers as Array<{
  k: string; t: string; d: string
  price: { m: number; y: number } | null
  popular: boolean; features: string[]
}>)

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
</script>

<template>
  <section id="pricing" class="section">
    <div class="container">
      <header class="sect-head">
        <span class="eyebrow"><span class="dot" /> {{ t('landing.pricing.eyebrow') }}</span>
        <h2>{{ t('landing.pricing.title') }}</h2>
        <p class="sect-sub">{{ t('landing.pricing.sub') }}</p>

        <div class="price-toggle">
          <button :class="!yearly && 'is-active'" @click="yearly = false">{{ t('landing.pricing.monthly') }}</button>
          <button :class="yearly && 'is-active'" @click="yearly = true">
            {{ t('landing.pricing.yearly') }}
            <span class="pill pill--brand" style="height:18px;font-size:10px">{{ t('landing.pricing.save') }}</span>
          </button>
        </div>
      </header>

      <div class="price-grid">
        <div
          v-for="tier in tiers"
          :key="tier.k"
          :class="['price-card surface', tier.popular && 'is-popular']"
        >
          <span v-if="tier.popular" class="price-pop">{{ t('landing.pricing.popular') }}</span>
          <div class="price-card-head">
            <h3>{{ tier.t }}</h3>
            <p class="t-mute">{{ tier.d }}</p>
          </div>
          <div class="price-card-price">
            <template v-if="tier.price === null">
              <div class="price-val mono">{{ t('landing.pricing.consultation') }}</div>
            </template>
            <template v-else>
              <span class="price-cur mono">R$</span>
              <span class="price-val mono">{{ fmt(yearly ? tier.price.y : tier.price.m) }}</span>
              <span class="price-per t-mute">{{ t('landing.pricing.perMonth') }}</span>
              <div v-if="yearly" class="price-foot mono">
                {{ t('landing.pricing.yearly_note') }} · R$ {{ fmt((yearly ? tier.price.y : tier.price.m) * 12) }}/ano
              </div>
              <div v-else class="price-foot mono">{{ t('landing.pricing.cancel_note') }}</div>
            </template>
          </div>
          <a href="#waitlist" :class="['btn', tier.popular ? 'btn--primary' : 'btn--ghost']">
            {{ tier.price === null ? t('landing.pricing.ctaEnterprise') : t('landing.pricing.cta') }}
            <LandingIcon name="arrow" :size="13" />
          </a>
          <div class="price-divider" />
          <ul class="price-feats">
            <li v-for="f in tier.features" :key="f">
              <LandingIcon name="check" :size="13" /> {{ f }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
