<script setup lang="ts">
const { t } = useI18n()
const { data } = useLandingData()

const cols = computed(() => {
  const foot = data.value?.foot
  if (!foot) return []
  return [
    [foot.product,   foot.productLinks],
    [foot.company,   foot.companyLinks],
    [foot.resources, foot.resourcesLinks],
    [foot.legal,     foot.legalLinks],
  ]
})

const socials = [
  { icon: 'instagram', label: 'Instagram', color: '#E1306C' },
  { icon: 'whatsapp',  label: 'WhatsApp',  color: '#25D366' },
  { icon: 'chat',      label: 'Comunidade', color: '#6366F1' },
]
</script>

<template>
  <footer class="foot">
    <div class="container">
      <div class="foot-grid">
        <div class="foot-brand">
          <a href="#" class="nav-brand">
            <span class="nav-logo"><LandingIcon name="logo" :size="30" /></span>
            <span class="nav-name">Zima</span>
          </a>
          <p class="foot-tag">{{ data.foot.tag }}</p>
          <div class="foot-status">
            <span class="dot" style="background:var(--ok);box-shadow:0 0 8px var(--ok)" />
            <span class="mono" style="font-size:11px">{{ data.foot.statusOnline }}</span>
          </div>
          <div class="foot-socials">
            <a
              v-for="s in socials"
              :key="s.icon"
              href="#"
              class="foot-social-btn"
              :aria-label="s.label"
            >
              <LandingIcon :name="s.icon" :size="15" />
            </a>
          </div>
        </div>
        <div v-for="([title, links]) in cols" :key="String(title)" class="foot-col">
          <h4>{{ title }}</h4>
          <ul>
            <li v-for="l in (links as string[])" :key="l">
              <a href="#">
                <span class="foot-link-dot" />
                {{ l }}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <span class="mono t-mute" style="font-size:11px">{{ data.foot.rights }}</span>
        <span class="t-mute" style="font-size:12px;display:flex;align-items:center;gap:8px">
          <LandingIcon name="logo" :size="14" style="opacity:0.4" />
          Zima · {{ data.foot.tagline }}
        </span>
      </div>
    </div>
  </footer>
</template>
