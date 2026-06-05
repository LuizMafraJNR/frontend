<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()
type Status = 'idle' | 'loading' | 'success'
const status = ref<Status>('idle')
const form = reactive({ name: '', email: '', phone: '' })
const count = ref(312)

onMounted(() => {
  const saved = parseInt(localStorage.getItem('zima_wl_extra') || '0', 10)
  count.value = 312 + saved
  if (localStorage.getItem('zima_wl_done') === '1') status.value = 'success'
})

function handlePhone(e: Event) {
  const d = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11)
  let v = d
  if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length > 7) v = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  form.phone = v
}

function handleSubmit(e: Event) {
  e.preventDefault()
  if (!form.name || !form.email) return
  status.value = 'loading'
  setTimeout(() => {
    const extra = parseInt(localStorage.getItem('zima_wl_extra') || '0', 10) + 1
    localStorage.setItem('zima_wl_extra', String(extra))
    localStorage.setItem('zima_wl_done', '1')
    count.value += 1
    status.value = 'success'
  }, 1100)
}

const perks = computed(() => (data.value.waitlist.perks as string[]).map((text: string, i: number) => ({
  text,
  icon: ['bolt', 'spark', 'bot', 'chat'][i],
})))
</script>

<template>
  <section id="waitlist" class="section section--tight">
    <div class="container">
      <div class="wl-card">
        <div class="wl-left">
          <span class="eyebrow" style="margin-bottom:20px">
            <span class="dot" style="background:var(--accent)" /> {{ t('landing.waitlist.eyebrow') }}
          </span>
          <h2 class="wl-title">{{ t('landing.waitlist.title') }}</h2>
          <p class="wl-sub">{{ t('landing.waitlist.sub') }}</p>

          <ul class="wl-perks">
            <li v-for="p in perks" :key="p.text">
              <span class="wl-perk-icon"><LandingIcon :name="p.icon" :size="13" /></span>
              {{ p.text }}
            </li>
          </ul>

          <div class="wl-counter">
            <span class="wl-count-num">{{ count.toLocaleString('pt-BR') }}+</span>
            <span class="wl-count-sep">·</span>
            <span class="wl-count-label">{{ t('landing.waitlist.counter') }}</span>
          </div>
        </div>

        <div class="wl-right">
          <div v-if="status === 'success'" class="wl-success">
            <div class="wl-success-ring"><LandingIcon name="check" :size="30" /></div>
            <h3>{{ t('landing.waitlist.successTitle') }}</h3>
            <p>{{ t('landing.waitlist.successText') }}</p>
            <span class="wl-position">{{ t('landing.waitlist.position') }} <strong>#{{ count + 1 }}</strong></span>
          </div>
          <form v-else class="wl-form" novalidate @submit="handleSubmit">
            <div class="wl-field">
              <label class="wl-label">{{ t('landing.waitlist.nameLabel') }}</label>
              <input v-model="form.name" class="wl-input" type="text" :placeholder="t('landing.waitlist.namePlaceholder')" required />
            </div>
            <div class="wl-field">
              <label class="wl-label">{{ t('landing.waitlist.emailLabel') }}</label>
              <input v-model="form.email" class="wl-input" type="email" :placeholder="t('landing.waitlist.emailPlaceholder')" required />
            </div>
            <div class="wl-field">
              <label class="wl-label">
                {{ t('landing.waitlist.whatsappLabel') }}
                <span class="wl-opt">{{ t('landing.waitlist.optional') }}</span>
              </label>
              <input
                class="wl-input"
                type="tel"
                :placeholder="t('landing.waitlist.whatsappPlaceholder')"
                :value="form.phone"
                @input="handlePhone"
              />
            </div>
            <button
              type="submit"
              :disabled="status === 'loading'"
              :class="['btn', 'btn--primary', 'btn--lg', 'wl-btn', status === 'loading' && 'is-loading']"
            >
              <span v-if="status === 'loading'" class="wl-spinner" />
              <template v-else>
                <span>{{ t('landing.waitlist.submit') }}</span>
                <LandingIcon name="arrow" :size="14" />
              </template>
            </button>
            <p class="wl-privacy">
              <LandingIcon name="shield" :size="11" /> {{ t('landing.waitlist.privacy') }}
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
