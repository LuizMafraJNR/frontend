<script setup lang="ts">
defineProps<{ tab: string; page: string; hasSidebar?: boolean }>()
// false por padrão no SSR — atualizado no cliente via onMounted
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth <= 480
  const h = () => { isMobile.value = window.innerWidth <= 480 }
  window.addEventListener('resize', h, { passive: true })
  onUnmounted(() => window.removeEventListener('resize', h))
})

const navItems = [
  ['home',   'Dashboard',  'chart'],
  ['agenda', 'Agenda',     'calendar'],
  ['clients','Clientes',   'users'],
  ['inbox',  'Atendimento','chat'],
  ['pdv',    'Caixa',      'wallet'],
  ['stock',  'Estoque',    'box'],
  ['fin',    'Financeiro', 'trend'],
  ['nf',     'Fiscal',     'receipt'],
  ['camp',   'Campanhas',  'megaphone'],
  ['ia',     'IA',         'bot'],
]
</script>

<template>
  <div class="mock">
    <aside v-if="(hasSidebar ?? true) && !isMobile" class="mock-side">
      <div class="mock-side-brand">
        <div class="mock-logo"><LandingIcon name="logo" :size="22" /></div>
        <div class="mock-side-name">
          <div>Atelier Carol</div>
          <div class="t-mute">Pro · Joinville</div>
        </div>
      </div>
      <nav class="mock-nav">
        <div
          v-for="([k, label, icon]) in navItems"
          :key="k"
          :class="['mock-nav-item', k === tab && 'is-active']"
        >
          <LandingIcon :name="icon" :size="15" />
          <span>{{ label }}</span>
        </div>
      </nav>
      <div class="mock-side-foot">
        <div class="mock-cmd">
          <LandingIcon name="command" :size="12" /> <span>K</span>
        </div>
      </div>
    </aside>
    <div class="mock-main">
      <div class="mock-top">
        <div class="mock-crumb">
          <template v-if="!isMobile">
            <span class="t-mute">Zima</span>
            <LandingIcon name="chevron" :size="12" />
          </template>
          <span>{{ page }}</span>
        </div>
        <div class="mock-top-r">
          <div v-if="!isMobile" class="mock-search">
            <LandingIcon name="search" :size="13" />
            <span>Buscar cliente, serviço, NF…</span>
            <kbd>⌘K</kbd>
          </div>
          <div v-else class="mock-iconbtn mock-search-icon"><LandingIcon name="search" :size="14" /></div>
          <div class="mock-iconbtn"><LandingIcon name="bell" :size="14" /></div>
          <div class="mock-avatar">CB</div>
        </div>
      </div>
      <div class="mock-body">
        <slot :is-mobile="isMobile" />
      </div>
    </div>
  </div>
</template>
