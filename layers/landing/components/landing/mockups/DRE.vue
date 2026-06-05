<script setup lang="ts">
import MockChrome from './MockChrome.vue'
const months = ['Jan','Fev','Mar','Abr','Mai']
const revenue = [42,48,51,58,67]
const cost    = [28,31,33,36,38]
const max = 80

const rows = [
  { k:'Receita Bruta',          v:'R$ 67.420,00', pct:'+15.4%', trend:true  },
  { k:'(–) Deduções',           v:'R$ 4.110,00',  pct:'+8.1%',  sub:true   },
  { k:'Receita Líquida',        v:'R$ 63.310,00', pct:'+15.8%', trend:true  },
  { k:'(–) Custos diretos',     v:'R$ 18.880,00', pct:'+4.2%',  sub:true   },
  { k:'Lucro Bruto',            v:'R$ 44.430,00', pct:'+21.0%', trend:true, hi:true },
  { k:'(–) Comissões',          v:'R$ 11.290,00', pct:'+12.6%', sub:true   },
  { k:'(–) Despesas operacionais', v:'R$ 8.520,00', pct:'+2.0%', sub:true  },
  { k:'EBITDA',                 v:'R$ 24.620,00', pct:'+34.2%', trend:true, hi:true },
  { k:'(–) Impostos & taxas',   v:'R$ 3.180,00',  pct:'+9.0%',  sub:true   },
  { k:'Lucro Líquido',          v:'R$ 21.440,00', pct:'+37.6%', trend:true, hi:true, accent:true },
]

function pt(i: number, arr: number[]) {
  return `${(i / 4) * 180} ${50 - (arr[i] / max) * 40}`
}
const revPath = computed(() => revenue.map((_, i) => pt(i, revenue)).join(' L '))
const costPath = computed(() => cost.map((_, i) => pt(i, cost)).join(' L '))
</script>

<template>
  <MockChrome tab="fin" page="Financeiro · DRE">
    <template #default>
      <div class="dre-tabs">
        <button v-for="(tab, i) in ['Overview','Receitas','Despesas','A receber','A pagar','Comissões','DRE']" :key="tab" :class="i===6&&'is-active'">{{ tab }}</button>
        <div class="grow" />
        <div class="dre-period">
          <span class="t-mute">Maio 2026</span>
          <LandingIcon name="chevd" :size="12" />
        </div>
      </div>

      <div class="dre-kpis">
        <div class="dre-kpi">
          <div class="t-mute" style="font-size:11px">RECEITA BRUTA</div>
          <div class="dre-kpi-v mono">R$ 67.420</div>
          <div class="dre-kpi-d" style="color:var(--ok)"><LandingIcon name="trend" :size="11" /> +15.4% vs Abril</div>
        </div>
        <div class="dre-kpi">
          <div class="t-mute" style="font-size:11px">EBITDA</div>
          <div class="dre-kpi-v mono">R$ 24.620</div>
          <div class="dre-kpi-d" style="color:var(--ok)"><LandingIcon name="trend" :size="11" /> +34.2% vs Abril</div>
        </div>
        <div class="dre-kpi">
          <div class="t-mute" style="font-size:11px">LUCRO LÍQUIDO</div>
          <div class="dre-kpi-v mono" style="color:var(--accent-soft)">R$ 21.440</div>
          <div class="dre-kpi-d" style="color:var(--ok)"><LandingIcon name="trend" :size="11" /> +37.6% vs Abril</div>
        </div>
        <div class="dre-kpi dre-chart">
          <div class="t-mute" style="font-size:11px">EVOLUÇÃO 5 MESES</div>
          <svg viewBox="0 0 180 60" preserveAspectRatio="none" class="dre-svg">
            <defs>
              <linearGradient id="rg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stop-color="var(--accent)" stop-opacity=".5"/>
                <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <line v-for="y in [10,25,40]" :key="y" x1="0" x2="180" :y1="y" :y2="y" stroke="rgba(255,255,255,.05)" />
            <path :d="`M ${revPath} L 180 60 L 0 60 Z`" fill="url(#rg)" />
            <path :d="`M ${revPath}`" fill="none" stroke="var(--accent-soft)" stroke-width="1.5" />
            <path :d="`M ${costPath}`" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1" stroke-dasharray="2 2" />
            <circle v-for="(r, i) in revenue" :key="i" :cx="(i/4)*180" :cy="50-(r/max)*40" r="2" fill="var(--accent-soft)" />
          </svg>
          <div class="dre-chart-x mono">
            <span v-for="m in months" :key="m">{{ m }}</span>
          </div>
        </div>
      </div>

      <div class="dre-table surface">
        <div class="dre-table-head">
          <div>Linha</div>
          <div class="dre-num">Valor</div>
          <div class="dre-num">vs anterior</div>
        </div>
        <div
          v-for="(r, i) in rows"
          :key="i"
          :class="['dre-table-row', r.hi&&'hi', r.accent&&'accent', r.sub&&'sub']"
        >
          <div>{{ r.k }}</div>
          <div class="dre-num mono">{{ r.v }}</div>
          <div class="dre-num mono" :style="{ color: r.trend ? 'var(--ok)' : 'var(--text-mute)' }">{{ r.pct }}</div>
        </div>
      </div>
    </template>
  </MockChrome>
</template>
