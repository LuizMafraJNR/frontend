<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()
const icons = ['whatsapp', 'wallet', 'box', 'megaphone', 'bell', 'settings']
const items = computed(() => data.value.problem.items as Array<{ t: string; d: string; bad: string }>)
</script>

<template>
  <section class="section">
    <div class="container">
      <header class="sect-head">
        <span class="eyebrow"><span class="dot" /> {{ t('landing.problem.eyebrow') }}</span>
        <h2>{{ t('landing.problem.title') }}</h2>
        <p class="sect-sub">{{ t('landing.problem.sub') }}</p>
      </header>
      <div class="prob-grid">
        <div v-for="(item, i) in items" :key="i" class="prob-card surface">
          <div class="prob-card-top">
            <div class="prob-icon"><LandingIcon :name="icons[i]" :size="16" /></div>
            <span class="prob-n mono">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>
          <h3 class="prob-t">{{ item.t }}</h3>
          <p class="prob-d">{{ item.d }}</p>
          <div class="prob-bad">
            <LandingIcon name="x" :size="11" /> {{ item.bad }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
