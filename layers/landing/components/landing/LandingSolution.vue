<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()
const flow = computed(() => data.value.solution.flow as string[])
const icons = ['calendar', 'bot', 'users', 'wallet', 'trend']
</script>

<template>
  <section id="solution" class="section">
    <div class="container">
      <header class="sect-head">
        <span class="eyebrow eyebrow--brand"><span class="dot" /> {{ t('landing.solution.eyebrow') }}</span>
        <h2 class="title-multiline">{{ t('landing.solution.title') }}</h2>
        <p class="sect-sub">{{ t('landing.solution.sub') }}</p>
      </header>

      <div class="flow surface">
        <div class="flow-grid">
          <template v-for="(step, i) in flow" :key="i">
            <div class="flow-step">
              <div class="flow-step-n mono">{{ String(i + 1).padStart(2, '0') }}</div>
              <div class="flow-step-icon"><LandingIcon :name="icons[i]" :size="18" /></div>
              <div class="flow-step-label">{{ step }}</div>
            </div>
            <div v-if="i < flow.length - 1" class="flow-arrow">
              <svg viewBox="0 0 40 8" preserveAspectRatio="none">
                <line x1="0" x2="34" y1="4" y2="4" stroke="var(--hairline-bright)" stroke-dasharray="2 2" />
                <path d="M30 1 36 4 30 7Z" fill="var(--accent-soft)" />
              </svg>
            </div>
          </template>
        </div>
        <div class="flow-foot">
          <div class="flow-foot-l">
            <span class="pill pill--brand"><LandingIcon name="bolt" :size="11" /> {{ t('landing.solution.footAuto') }}</span>
            <span class="t-mute" style="font-size:13px">{{ t('landing.solution.footDesc') }}</span>
          </div>
          <div class="flow-foot-r mono">
            <span><span class="dot" style="background:var(--ok)" /> {{ t('landing.solution.footModules') }}</span>
            <span><span class="dot" style="background:var(--accent)" /> {{ t('landing.solution.footDb') }}</span>
            <span><span class="dot" style="background:var(--info)" /> {{ t('landing.solution.footSheets') }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
