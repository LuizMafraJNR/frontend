<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="cta-final">
        <div class="cta-final-glow" />
        <div class="cta-final-inner">
          <span class="eyebrow eyebrow--brand"><span class="dot" /> {{ t('landing.cta.eyebrow') }}</span>
          <h2 class="title-multiline">{{ t('landing.cta.title') }}</h2>
          <p class="sect-sub" style="margin-top:14px">{{ t('landing.cta.sub') }}</p>
          <div class="hero-ctas" style="margin-top:30px">
            <a href="#waitlist" class="btn btn--primary btn--lg">
              {{ t('landing.hero.ctaPrimary') }} <LandingIcon name="arrow" :size="15" />
            </a>
            <a href="#waitlist" class="btn btn--ghost btn--lg">
              <LandingIcon name="spark" :size="13" /> {{ t('landing.testi.cta') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
