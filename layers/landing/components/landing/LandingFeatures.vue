<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()

const feats = [
  { k:'agenda', icon:'calendar',   hue:'#3B82F6', mock:'agenda' },
  { k:'ia',     icon:'bot',        hue:'#6366F1', mock:'inbox'  },
  { k:'inbox',  icon:'chat',       hue:'#22D3EE', mock:null     },
  { k:'pdv',    icon:'wallet',     hue:'#10B981', mock:'pdv'    },
  { k:'fin',    icon:'trend',      hue:'#A855F7', mock:'dre'    },
  { k:'stock',  icon:'box',        hue:'#F59E0B', mock:null     },
  { k:'camp',   icon:'megaphone',  hue:'#EC4899', mock:null     },
  { k:'nf',     icon:'receipt',    hue:'#84CC16', mock:null     },
]
const active = ref(0)
const items = computed(() => data.value.features.items as Array<{ k:string; t:string; d:string }>)
const visual = computed(() => feats[active.value])
</script>

<template>
  <section id="features" class="section">
    <div class="container">
      <header class="sect-head">
        <span class="eyebrow"><span class="dot" /> {{ t('landing.features.eyebrow') }}</span>
        <h2 class="title-multiline">{{ t('landing.features.title') }}</h2>
        <p class="sect-sub">{{ t('landing.features.sub') }}</p>
      </header>

      <div class="feat-layout">
        <div class="feat-list">
          <button
            v-for="(f, i) in feats"
            :key="f.k"
            :class="['feat-item', active === i && 'is-active']"
            :style="{ '--feat-hue': f.hue }"
            @mouseenter="active = i"
            @click="active = i"
          >
            <div class="feat-icon"><LandingIcon :name="f.icon" :size="17" /></div>
            <div class="feat-body">
              <h3>{{ items[i]?.t }}</h3>
              <p>{{ items[i]?.d }}</p>
            </div>
            <div class="feat-arrow"><LandingIcon name="arrow" :size="14" /></div>
          </button>
        </div>

        <div class="feat-visual surface surface--lifted" :style="{ '--feat-hue': visual.hue }">
          <div class="feat-visual-glow" />
          <div class="feat-visual-head">
            <div class="feat-visual-icon"><LandingIcon :name="visual.icon" :size="15" /></div>
            <div>
              <b>{{ items[active]?.t }}</b>
              <div class="t-mute mono" style="font-size:10px;letter-spacing:.06em;text-transform:uppercase">
                {{ t('landing.features.preview') }}
              </div>
            </div>
          </div>
          <div class="feat-visual-frame">
            <ClientOnly>
              <LandingMockupsAgenda v-if="visual.mock === 'agenda'" />
              <LandingMockupsInbox  v-else-if="visual.mock === 'inbox'" />
              <LandingMockupsPDV    v-else-if="visual.mock === 'pdv'" />
              <LandingMockupsDRE    v-else-if="visual.mock === 'dre'" />
              <LandingFeatPlaceholder v-else :feat-key="visual.k" />
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
