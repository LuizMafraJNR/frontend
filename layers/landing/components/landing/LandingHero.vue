<script setup lang="ts">
const { t } = useI18n()
const { themeMode } = useTheme()

const tabs = computed(() => [
  { id:'agenda', label: t('landing.hero.tabs.agenda'), icon:'calendar' },
  { id:'inbox',  label: t('landing.hero.tabs.inbox'),  icon:'bot' },
  { id:'pdv',    label: t('landing.hero.tabs.pdv'),    icon:'wallet' },
  { id:'dre',    label: t('landing.hero.tabs.dre'),    icon:'trend' },
])

const tab = ref('agenda')

onMounted(() => {
  const id = setInterval(() => {
    const i = tabs.value.findIndex(x => x.id === tab.value)
    tab.value = tabs.value[(i + 1) % tabs.value.length].id
  }, 7000)
  onUnmounted(() => clearInterval(id))
})

const title = computed(() => t('landing.hero.titleA'))
</script>

<template>
  <section class="hero section--xl">
    <div class="hero-glow" />
    <div class="container hero-inner">
      <div class="hero-pill">
        <span class="hero-pill-dot" />
        <span>{{ t('landing.hero.eyebrow') }}</span>
      </div>

      <h1 class="hero-title">
        <span v-for="(line, i) in title.split('\n')" :key="i" class="hero-title-line">{{ line }}</span>
      </h1>

      <p class="hero-sub">{{ t('landing.hero.sub') }}</p>

      <div class="hero-ctas">
        <a href="#waitlist" class="btn btn--primary btn--lg">
          {{ t('landing.hero.ctaPrimary') }} <LandingIcon name="arrow" :size="15" />
        </a>
        <a href="#features" class="btn btn--ghost btn--lg">
          <LandingIcon name="play" :size="13" /> {{ t('landing.hero.ctaSecondary') }}
        </a>
      </div>

      <div class="hero-notice mono">
        <LandingIcon name="check" :size="12" /> {{ t('landing.hero.notice') }}
      </div>

      <div class="hero-mock-wrap">
        <div class="hero-mock-glow" />
        <div class="hero-mock-tabs">
          <button
            v-for="x in tabs"
            :key="x.id"
            :class="['hero-mock-tab', tab === x.id && 'is-active']"
            @click="tab = x.id"
          >
            <LandingIcon :name="x.icon" :size="13" /> {{ x.label }}
          </button>
        </div>
        <div class="hero-mock surface surface--lifted">
          <ClientOnly>
            <LandingMockupsAgenda v-if="tab === 'agenda'" />
            <LandingMockupsInbox  v-else-if="tab === 'inbox'" />
            <LandingMockupsPDV    v-else-if="tab === 'pdv'" />
            <LandingMockupsDRE    v-else-if="tab === 'dre'" />
          </ClientOnly>
        </div>
      </div>

      <div class="trusted">
        <div class="trusted-line" />
        <span class="mono">{{ t('landing.trusted') }}</span>
        <div class="trusted-line" />
      </div>
    </div>
  </section>
</template>
