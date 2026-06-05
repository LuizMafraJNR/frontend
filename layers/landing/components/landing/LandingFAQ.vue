<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()
const items = computed(() => data.value.faq.items as Array<[string, string]>)
const open = ref(0)
</script>

<template>
  <section id="faq" class="section">
    <div class="container">
      <div class="faq-grid">
        <div class="faq-left">
          <span class="eyebrow"><span class="dot" /> {{ t('landing.faq.eyebrow') }}</span>
          <h2 class="title-multiline">{{ t('landing.faq.title') }}</h2>
          <p class="sect-sub" style="margin-top:14px;max-width:360px">{{ t('landing.faq.contact') }}</p>
          <a href="#" class="btn btn--ghost" style="margin-top:20px">
            <LandingIcon name="chat" :size="14" /> {{ t('landing.faq.contactBtn') }}
          </a>
        </div>
        <div class="faq-right">
          <div
            v-for="(item, i) in items"
            :key="i"
            :class="['faq-item', open === i && 'is-open']"
          >
            <button class="faq-q" @click="open = open === i ? -1 : i">
              <span>{{ item[0] }}</span>
              <span class="faq-toggle">
                <LandingIcon :name="open === i ? 'minus' : 'plus'" :size="14" />
              </span>
            </button>
            <div class="faq-a">
              <p>{{ item[1] }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
