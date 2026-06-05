<script setup lang="ts">
import MockChrome from './MockChrome.vue'
const isMobile = ref(false)
const step = ref<'catalog' | 'cart'>('catalog')
onMounted(() => {
  isMobile.value = window.innerWidth <= 480
  const h = () => { isMobile.value = window.innerWidth <= 480 }
  window.addEventListener('resize', h, { passive: true })
  onUnmounted(() => window.removeEventListener('resize', h))
})

const cartItems = [
  { name:'Coloração + Corte', pro:'Carol',   qty:1, price:380, kind:'Serviço' },
  { name:'Hidratação K-Pro',  pro:'Estoque', qty:1, price:95,  kind:'Produto' },
  { name:'Escova modeladora', pro:'Carol',   qty:1, price:80,  kind:'Serviço' },
]
const subtotal = computed(() => cartItems.reduce((s, i) => s + i.qty * i.price, 0))
const disc = 55
const total = computed(() => subtotal.value - disc)

const catalog = [
  { c:'#3B82F6', n:'Corte fem.',   p:160 },
  { c:'#A855F7', n:'Coloração',    p:280 },
  { c:'#10B981', n:'Hidratação',   p:140 },
  { c:'#F59E0B', n:'Manicure',     p:70  },
  { c:'#EF4444', n:'Pedicure',     p:90  },
  { c:'#6366F1', n:'Limpeza pele', p:260 },
  { c:'#22D3EE', n:'Drenagem',     p:180 },
  { c:'#F97316', n:'Design sobr.', p:65  },
]
</script>

<template>
  <MockChrome tab="pdv" page="Caixa">
    <template #default="{ isMobile: mob }">
      <!-- Mobile layout -->
      <div v-if="mob" class="pdv-mobile">
        <div v-if="step === 'catalog'" class="pdv-mobile-catalog">
          <div class="pdv-mobile-client">
            <div class="ibx-avatar" style="background:linear-gradient(135deg,#3B82F655,#3B82F611);width:32px;height:32px;font-size:12px">M</div>
            <div><b style="font-size:13px">Marina Silva</b><div class="t-mute" style="font-size:11px">VIP · 240 pts</div></div>
            <div class="pdv-mobile-badge">3 itens no carrinho</div>
          </div>
          <div class="pdv-search">
            <LandingIcon name="search" :size="14" />
            <input placeholder="Buscar serviço ou produto…" readonly />
          </div>
          <div class="pdv-cats">
            <button v-for="(c, i) in ['Tudo','Serviços','Produtos']" :key="c" :class="i===0 && 'is-active'">{{ c }}</button>
          </div>
          <div class="pdv-grid pdv-grid--mobile">
            <div v-for="it in catalog" :key="it.n" class="pdv-card">
              <div class="pdv-card-top" :style="{ background: `linear-gradient(135deg, ${it.c}44, ${it.c}11)` }">
                <div :style="{ width:'28px', height:'28px', borderRadius:'8px', background:it.c, opacity:.85 }" />
              </div>
              <div class="pdv-card-body">
                <div class="pdv-card-name">{{ it.n }}</div>
                <div class="pdv-card-price mono">R$ {{ it.p }}</div>
              </div>
            </div>
          </div>
          <button class="pdv-mobile-cart-btn btn btn--primary" @click="step='cart'">
            <LandingIcon name="wallet" :size="15" />
            Ver carrinho ({{ cartItems.length }} itens) · R$ {{ total }}
            <LandingIcon name="arrow" :size="14" />
          </button>
        </div>
        <div v-else class="pdv-mobile-cart">
          <button class="pdv-mobile-back" @click="step='catalog'">
            <LandingIcon name="chevron" :size="14" style="transform:rotate(180deg)" />
            Continuar comprando
          </button>
          <div class="pdv-client" style="margin:0 0 10px">
            <div class="ibx-avatar md" style="background:linear-gradient(135deg,#3B82F655,#3B82F611)">M</div>
            <div><b>Marina Silva</b><div class="t-mute" style="font-size:11px">VIP · 14 visitas · 240 pontos</div></div>
          </div>
          <div class="pdv-items">
            <div v-for="(it, i) in cartItems" :key="i" class="pdv-item">
              <div><b>{{ it.name }}</b><div class="t-mute" style="font-size:11px">{{ it.kind }} · {{ it.pro }}</div></div>
              <div class="pdv-item-qty mono">{{ it.qty }}×</div>
              <div class="pdv-item-price mono">R$ {{ it.price }}</div>
            </div>
          </div>
          <div class="pdv-totals">
            <div class="pdv-row"><span>Subtotal</span><span class="mono">R$ {{ subtotal }}</span></div>
            <div class="pdv-row"><span>Desconto VIP</span><span class="mono" style="color:var(--ok)">− R$ {{ disc }}</span></div>
            <div class="pdv-row pdv-total"><span>Total</span><span class="mono">R$ {{ total }}</span></div>
          </div>
          <div class="pdv-pay">
            <div class="t-mute mono" style="font-size:10px">PAGAMENTO</div>
            <div class="pdv-methods">
              <button class="is-active"><LandingIcon name="pix" :size="14" /> PIX</button>
              <button><LandingIcon name="card" :size="14" /> Cartão</button>
              <button><LandingIcon name="wallet" :size="14" /> Dinheiro</button>
            </div>
          </div>
          <div class="pdv-effects">
            <div class="t-mute mono" style="font-size:10px">AO FINALIZAR</div>
            <div class="pdv-effects-row"><LandingIcon name="check" :size="11" /> Receita lançada no financeiro</div>
            <div class="pdv-effects-row"><LandingIcon name="check" :size="11" /> Comissão de Carol (40%)</div>
            <div class="pdv-effects-row"><LandingIcon name="check" :size="11" /> NFS-e emitida automaticamente</div>
          </div>
          <button class="btn btn--primary" style="width:100%;height:48px;font-size:15px">Finalizar · R$ {{ total }}</button>
        </div>
      </div>

      <!-- Desktop layout -->
      <div v-else class="pdv">
        <div class="pdv-left">
          <div class="pdv-search">
            <LandingIcon name="search" :size="14" />
            <input placeholder="Buscar serviço ou produto…" readonly />
            <kbd>F2</kbd>
          </div>
          <div class="pdv-cats">
            <button v-for="(c, i) in ['Tudo','Serviços','Produtos','Pacotes','Combos']" :key="c" :class="i===0&&'is-active'">{{ c }}</button>
          </div>
          <div class="pdv-grid">
            <div v-for="it in catalog" :key="it.n" class="pdv-card">
              <div class="pdv-card-top" :style="{ background: `linear-gradient(135deg, ${it.c}44, ${it.c}11)` }">
                <div :style="{ width:'28px', height:'28px', borderRadius:'8px', background:it.c, opacity:.85 }" />
              </div>
              <div class="pdv-card-body">
                <div class="pdv-card-name">{{ it.n }}</div>
                <div class="pdv-card-price mono">R$ {{ it.p }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="pdv-right">
          <div class="pdv-client">
            <div class="ibx-avatar md" style="background:linear-gradient(135deg,#3B82F655,#3B82F611)">M</div>
            <div><b>Marina Silva</b><div class="t-mute" style="font-size:11px">VIP · 14 visitas · 240 pontos</div></div>
          </div>
          <div class="pdv-items">
            <div v-for="(it, i) in cartItems" :key="i" class="pdv-item">
              <div><b>{{ it.name }}</b><div class="t-mute" style="font-size:11px">{{ it.kind }} · {{ it.pro }}</div></div>
              <div class="pdv-item-qty mono">{{ it.qty }}×</div>
              <div class="pdv-item-price mono">R$ {{ it.price }}</div>
            </div>
          </div>
          <div class="pdv-totals">
            <div class="pdv-row"><span>Subtotal</span><span class="mono">R$ {{ subtotal }}</span></div>
            <div class="pdv-row"><span>Desconto · cupom VIP</span><span class="mono" style="color:var(--ok)">− R$ {{ disc }}</span></div>
            <div class="pdv-row pdv-total"><span>Total</span><span class="mono">R$ {{ total }}</span></div>
          </div>
          <div class="pdv-pay">
            <div class="t-mute mono" style="font-size:10px">FORMA DE PAGAMENTO</div>
            <div class="pdv-methods">
              <button class="is-active"><LandingIcon name="pix" :size="14" /> PIX</button>
              <button><LandingIcon name="card" :size="14" /> Cartão</button>
              <button><LandingIcon name="wallet" :size="14" /> Dinheiro</button>
            </div>
          </div>
          <div class="pdv-effects">
            <div class="t-mute mono" style="font-size:10px">AO FINALIZAR</div>
            <div class="pdv-effects-row"><LandingIcon name="check" :size="11" /> Receita lançada no financeiro</div>
            <div class="pdv-effects-row"><LandingIcon name="check" :size="11" /> Comissão de Carol calculada (40%)</div>
            <div class="pdv-effects-row"><LandingIcon name="check" :size="11" /> Baixa de 1 Hidratação K-Pro</div>
            <div class="pdv-effects-row"><LandingIcon name="check" :size="11" /> NFS-e emitida automaticamente</div>
          </div>
          <button class="btn btn--primary" style="width:100%;height:46px;font-size:15px">Finalizar venda · R$ {{ total }}</button>
        </div>
      </div>
    </template>
  </MockChrome>
</template>
