<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()
const cols = ['Zima', 'Booksy', 'Mindbody', 'Trinks', 'Bling', 'iGestão']
const rows = computed(() => data.value.compare.rows as Array<[string, ...Array<boolean | string>]>)
</script>

<template>
  <section id="compare" class="section">
    <div class="container">
      <header class="sect-head">
        <span class="eyebrow"><span class="dot" /> {{ t('landing.compare.eyebrow') }}</span>
        <h2>{{ t('landing.compare.title') }}</h2>
        <p class="sect-sub">{{ t('landing.compare.sub') }}</p>
      </header>

      <div class="cmp-card">
        <!-- Header row -->
        <div class="cmp-row cmp-row--head">
          <div class="cmp-cell cmp-cell--feat cmp-cell--head-feat">{{ t('landing.compare.feature') }}</div>
          <div
            v-for="(col, i) in cols"
            :key="col"
            :class="['cmp-cell', 'cmp-cell--col-head', i === 0 && 'cmp-cell--zima-head']"
          >
            <span v-if="i === 0" class="cmp-best-tag">
              <span class="cmp-best-star">✦</span>
              <span class="cmp-best-text"> {{ t('landing.compare.bestChoice') }}</span>
            </span>
            <span v-if="i === 0" class="cmp-zima-pill">
              <span class="cmp-zima-icon"><LandingIcon name="logo" :size="20" /></span>
              {{ col }}
            </span>
            <span v-else class="cmp-rival-name">{{ col }}</span>
          </div>
        </div>

        <!-- Data rows -->
        <div v-for="(row, ri) in rows" :key="ri" class="cmp-row">
          <div class="cmp-cell cmp-cell--feat">{{ row[0] }}</div>
          <div
            v-for="(val, ci) in row.slice(1)"
            :key="ci"
            :class="['cmp-cell', 'cmp-cell--val', ci === 0 && 'cmp-cell--zima-val']"
          >
            <span v-if="val === true" :class="['cmp-icon', ci === 0 ? 'cmp-icon--blue' : 'cmp-icon--green']">
              <LandingIcon name="check" :size="13" />
            </span>
            <span v-else-if="val === false" class="cmp-icon cmp-icon--dim">
              <LandingIcon name="minus" :size="11" />
            </span>
            <span v-else class="cmp-badge-partial">{{ val }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="cmp-legend">
          <span class="cmp-legend-item">
            <span class="cmp-icon cmp-icon--green cmp-icon--sm"><LandingIcon name="check" :size="9" /></span>
            {{ t('landing.compare.legendYes') }}
          </span>
          <span class="cmp-legend-item">
            <span class="cmp-badge-partial" style="font-size:9px;padding:1px 6px">{{ t('landing.compare.legendBasic') }}</span>
            Parcial
          </span>
          <span class="cmp-legend-item">
            <span class="cmp-icon cmp-icon--dim cmp-icon--sm"><LandingIcon name="minus" :size="9" /></span>
            {{ t('landing.compare.legendNo') }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
