<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="section section--tight">
    <div class="container">
      <div class="testi surface">
        <div class="testi-grid">
          <div class="testi-left">
            <span class="eyebrow"><span class="dot" style="background:var(--warn)" /> {{ t('landing.testi.eyebrow') }}</span>
            <h2>{{ t('landing.testi.title') }}</h2>
            <p class="sect-sub" style="margin-top:12px;max-width:520px">{{ t('landing.testi.sub') }}</p>
            <a href="#waitlist" class="btn btn--ghost btn--lg" style="margin-top:24px">
              {{ t('landing.testi.cta') }} <LandingIcon name="arrow" :size="14" />
            </a>
          </div>
          <div class="testi-right">
            <div v-for="n in 3" :key="n" class="testi-card testi-skel">
              <div class="testi-card-head">
                <div class="testi-av" />
                <div>
                  <div class="testi-skel-line" style="width:96px" />
                  <div class="testi-skel-line" style="width:64px;margin-top:6px;opacity:.5" />
                </div>
              </div>
              <div class="testi-skel-line" style="width:92%;margin-top:16px" />
              <div class="testi-skel-line" style="width:78%;margin-top:8px" />
              <div class="testi-skel-line" style="width:60%;margin-top:8px" />
              <span class="pill" style="margin-top:18px">{{ t('landing.testi.soon') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
