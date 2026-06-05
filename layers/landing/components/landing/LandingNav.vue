<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const { themeMode, toggleTheme } = useTheme()
const scrolled = ref(false)

onMounted(() => {
  const onScroll = () => { scrolled.value = window.scrollY > 20 }
  window.addEventListener('scroll', onScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})
</script>

<template>
  <header :class="['nav', scrolled && 'is-scrolled']">
    <div class="nav-inner">
      <a href="#" class="nav-brand">
        <span class="nav-logo"><LandingIcon name="logo" :size="30" /></span>
        <span class="nav-name">Zima</span>
      </a>
      <nav class="nav-links">
        <a href="#features">{{ t('landing.nav.features') }}</a>
        <a href="#pricing">{{ t('landing.nav.pricing') }}</a>
        <a href="#compare">{{ t('landing.nav.compare') }}</a>
        <a href="#faq">{{ t('landing.nav.faq') }}</a>
      </nav>
      <div class="nav-actions">
        <div class="lang-toggle">
          <button :data-on="locale === 'pt-BR'" @click="setLocale('pt-BR')">PT</button>
          <button :data-on="locale === 'en'" @click="setLocale('en')">EN</button>
        </div>
        <button
          class="theme-toggle"
          :title="themeMode === 'eclipse' ? t('landing.themeLight') : t('landing.themeDark')"
          :aria-label="themeMode === 'eclipse' ? t('landing.themeLight') : t('landing.themeDark')"
          @click="toggleTheme"
        >
          <LandingIcon :name="themeMode === 'eclipse' ? 'sun' : 'moon'" :size="14" />
        </button>
        <a href="/saas" class="nav-link-sub">{{ t('landing.nav.signin') }}</a>
        <a href="#waitlist" class="btn btn--primary btn--sm">
          {{ t('landing.nav.start') }} <LandingIcon name="arrow" :size="13" />
        </a>
      </div>
    </div>
  </header>
</template>
