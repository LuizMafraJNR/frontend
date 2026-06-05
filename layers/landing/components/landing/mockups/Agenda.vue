<script setup lang="ts">
import MockChrome from './MockChrome.vue'
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth <= 480
  const h = () => { isMobile.value = window.innerWidth <= 480 }
  window.addEventListener('resize', h, { passive: true })
  onUnmounted(() => window.removeEventListener('resize', h))
})

const pros = [
  { id: 1, name: 'Carol',   color: '#3B82F6', role: 'Cabeleireira' },
  { id: 2, name: 'Beatriz', color: '#A855F7', role: 'Manicure' },
  { id: 3, name: 'Daniel',  color: '#10B981', role: 'Barber' },
  { id: 4, name: 'Júlia',   color: '#F59E0B', role: 'Estética' },
]
const hours = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
const apts = [
  { pro:1, start:0,   dur:1.5, client:'Marina Silva',   service:'Coloração + Corte',     status:'ok',   value:'R$ 380' },
  { pro:1, start:2,   dur:1,   client:'Renata Aoki',    service:'Hidratação',            status:'warn', value:'R$ 140' },
  { pro:1, start:4,   dur:2,   client:'Sofia Mendes',   service:'Mechas + Escova',       status:'ok',   value:'R$ 520' },
  { pro:1, start:7,   dur:1,   client:'Ana Caldas',     service:'Corte feminino',        status:'ok',   value:'R$ 160' },
  { pro:2, start:0.5, dur:1,   client:'Laura Vieira',   service:'Manicure + Pedicure',   status:'ok',   value:'R$ 110' },
  { pro:2, start:2.5, dur:1.5, client:'Camila Costa',   service:'Spa dos pés',           status:'ok',   value:'R$ 180' },
  { pro:2, start:5,   dur:1,   client:'Patrícia Lima',  service:'Alongamento gel',       status:'warn', value:'R$ 220' },
  { pro:2, start:7,   dur:1,   client:'Vanessa Reis',   service:'Esmaltação',            status:'ok',   value:'R$ 80'  },
  { pro:3, start:1,   dur:1,   client:'Lucas Pereira',  service:'Barba + Corte',         status:'ok',   value:'R$ 120' },
  { pro:3, start:3,   dur:1,   client:'Pedro Henrique', service:'Corte degradê',         status:'ok',   value:'R$ 70'  },
  { pro:3, start:5,   dur:1.5, client:'Rafael Soares',  service:'Pacote barba completo', status:'ok',   value:'R$ 180' },
  { pro:3, start:7.5, dur:0.5, client:'Felipe Reis',    service:'Acabamento',            status:'ok',   value:'R$ 50'  },
  { pro:4, start:0,   dur:2,   client:'Isabela Rocha',  service:'Microagulhamento',      status:'ok',   value:'R$ 480' },
  { pro:4, start:3,   dur:1.5, client:'Larissa Dias',   service:'Limpeza de pele',       status:'ok',   value:'R$ 260' },
  { pro:4, start:6,   dur:2,   client:'Mariana Coelho', service:'Drenagem',              status:'warn', value:'R$ 320' },
]
const proIdx = ref(0)
const statColor = (s: string) => s === 'ok' ? 'var(--ok)' : 'var(--warn)'
</script>

<template>
  <MockChrome tab="agenda" page="Agenda">
    <template #default="{ isMobile: mob }">
      <!-- Toolbar -->
      <div class="ag-toolbar">
        <div class="ag-date">
          <div class="t-day">Hoje · Terça-feira</div>
          <div class="t-mute mono">21 Mai 2026</div>
        </div>
        <template v-if="!mob">
          <div class="ag-tabs">
            <button class="is-active">Dia</button>
            <button>Semana</button>
            <button>Lista</button>
          </div>
          <div class="ag-actions">
            <div class="ag-kpi"><span class="t-mute">Ocupação</span> <b>87%</b></div>
            <div class="ag-kpi"><span class="t-mute">Receita prevista</span> <b class="mono">R$ 3.290</b></div>
            <button class="btn btn--primary btn--sm"><LandingIcon name="plus" :size="13" /> Novo</button>
          </div>
        </template>
        <template v-else>
          <div class="ag-mobile-actions">
            <div class="ag-kpi-inline"><span class="t-mute">Ocupação</span><b>87%</b></div>
            <div class="ag-kpi-inline"><span class="t-mute">Receita</span><b class="mono">R$ 3.290</b></div>
            <button class="btn btn--primary btn--sm" style="margin-left:auto"><LandingIcon name="plus" :size="13" /></button>
          </div>
        </template>
      </div>

      <!-- Mobile: picker + timeline -->
      <template v-if="mob">
        <div class="ag-pro-picker">
          <button class="ag-pro-prev" @click="proIdx = (proIdx - 1 + pros.length) % pros.length">
            <LandingIcon name="chevron" :size="14" style="transform:rotate(180deg)" />
          </button>
          <div class="ag-pro-pills">
            <button
              v-for="(p, i) in pros"
              :key="p.id"
              :class="['ag-pro-pill', i === proIdx && 'is-active']"
              :style="{ '--pro-color': p.color }"
              @click="proIdx = i"
            >
              <span class="ag-pro-dot" :style="{ background: p.color }" />
              {{ p.name }}
            </button>
          </div>
          <button class="ag-pro-next" @click="proIdx = (proIdx + 1) % pros.length">
            <LandingIcon name="chevron" :size="14" />
          </button>
        </div>
        <div class="ag-timeline">
          <div v-for="(h, hi) in hours" :key="h" class="ag-tl-slot">
            <div class="ag-tl-hour mono">{{ h }}</div>
            <div class="ag-tl-events">
              <template v-for="a in apts.filter(a => a.pro === pros[proIdx].id && a.start >= hi && a.start < hi + 1)" :key="a.client">
                <div class="ag-tl-apt" :style="{
                  background: `linear-gradient(135deg, ${pros[proIdx].color}22, ${pros[proIdx].color}0d)`,
                  borderColor: `${pros[proIdx].color}55`,
                  borderLeftColor: pros[proIdx].color,
                }">
                  <div class="ag-tl-apt-head">
                    <span class="ag-apt-stat" :style="{ background: statColor(a.status) }" />
                    <b>{{ a.client }}</b>
                    <span class="ag-tl-apt-time mono t-mute">{{ h }}</span>
                  </div>
                  <div class="ag-apt-sub">{{ a.service }}</div>
                  <div class="ag-apt-meta mono">{{ a.value }} · {{ Math.round(a.dur * 60) }} min</div>
                </div>
              </template>
              <div v-if="!apts.some(a => a.pro === pros[proIdx].id && a.start >= hi && a.start < hi + 1)" class="ag-tl-empty" />
            </div>
          </div>
        </div>
      </template>

      <!-- Desktop: grid -->
      <template v-else>
        <div class="ag-grid">
          <div class="ag-hours">
            <div class="ag-pro-head" />
            <div v-for="h in hours" :key="h" class="ag-hour mono">{{ h }}</div>
          </div>
          <div v-for="p in pros" :key="p.id" class="ag-col">
            <div class="ag-pro-head">
              <div class="ag-pro-dot" :style="{ background: p.color }" />
              <div>
                <div class="ag-pro-name">{{ p.name }}</div>
                <div class="t-mute" style="font-size:10px">{{ p.role }}</div>
              </div>
              <div class="ag-pro-online" />
            </div>
            <div class="ag-col-body">
              <div v-for="(_, i) in hours" :key="i" class="ag-slot" />
              <div
                v-for="(a, ai) in apts.filter(a => a.pro === p.id)"
                :key="ai"
                class="ag-apt"
                :style="{
                  top: `${a.start * 56 + 4}px`,
                  height: `${a.dur * 56 - 8}px`,
                  background: `linear-gradient(180deg, ${p.color}22, ${p.color}10)`,
                  borderColor: `${p.color}55`,
                }"
              >
                <div class="ag-apt-bar" :style="{ background: p.color }" />
                <div class="ag-apt-body">
                  <div class="ag-apt-head">
                    <span class="ag-apt-stat" :style="{ background: statColor(a.status) }" />
                    <b>{{ a.client }}</b>
                  </div>
                  <div class="ag-apt-sub">{{ a.service }}</div>
                  <div class="ag-apt-meta mono">{{ a.value }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </MockChrome>
</template>
