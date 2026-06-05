<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()
const items = computed(() => data.value.diff.items as Array<{ t: string; d: string }>)
const icons = ['bot', 'trend', 'bolt', 'globe', 'spark', 'command']
</script>

<template>
  <section class="section">
    <div class="container">
      <header class="sect-head sect-head--split">
        <div>
          <span class="eyebrow eyebrow--brand"><span class="dot" /> {{ t('landing.diff.eyebrow') }}</span>
          <h2 class="title-multiline">{{ t('landing.diff.title') }}</h2>
        </div>
      </header>
      <div class="diff-grid">
        <div v-for="(item, i) in items" :key="i" class="diff-card">
          <div class="diff-card-mark">
            <LandingIcon :name="icons[i]" :size="20" />
          </div>
          <div class="diff-card-n mono">.0{{ i + 1 }}</div>
          <h3>{{ item.t }}</h3>
          <p>{{ item.d }}</p>
          <div class="diff-card-glow" />
        </div>
      </div>
    </div>
  </section>
</template>
