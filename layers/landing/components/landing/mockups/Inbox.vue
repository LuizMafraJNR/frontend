<script setup lang="ts">
import MockChrome from './MockChrome.vue'
const isMobile = ref(false)
const chatOpen = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth <= 480
  const h = () => { isMobile.value = window.innerWidth <= 480 }
  window.addEventListener('resize', h, { passive: true })
  onUnmounted(() => window.removeEventListener('resize', h))
})

const convos = [
  { ch:'whatsapp',  name:'Marina Silva',    last:'Posso remarcar para sábado?',           time:'agora', unread:2, active:true, ai:false },
  { ch:'instagram', name:'Beleza Studio',   last:'Vocês fazem progressiva?',               time:'2m',    unread:1, ai:true },
  { ch:'whatsapp',  name:'Renata Aoki',     last:'Obrigada, confirmado!',                  time:'8m',    unread:0, ai:true },
  { ch:'chat',      name:'Visitante #4192', last:'Qual o valor do design de sobrancelha?', time:'12m',   unread:0, ai:true },
  { ch:'whatsapp',  name:'Camila Costa',    last:'Pode ser 15h?',                          time:'1h',    unread:0, ai:false },
  { ch:'instagram', name:'Pedro H.',        last:'Marquei já',                             time:'3h',    unread:0, ai:false },
]
const msgs = [
  { who:'client', t:'Oi Carol! Vi que tenho horário marcado pra quinta às 14h' },
  { who:'client', t:'Surgiu um compromisso. Tem como remarcar pra sábado de manhã?' },
  { who:'ai', name:'Zima IA', t:'Oi Marina! Achei seu agendamento de Coloração + Corte com a Carol. Tenho sábado às 10h ou 11h30. Qual prefere? 💙' },
  { who:'client', t:'Posso remarcar para sábado?' },
]
const chIcon = (c: string) => c === 'whatsapp' ? 'whatsapp' : c === 'instagram' ? 'instagram' : 'chat'
const chColor = (c: string) => c === 'whatsapp' ? '#25D366' : c === 'instagram' ? '#E1306C' : '#6366F1'
</script>

<template>
  <MockChrome tab="inbox" page="Atendimento">
    <template #default="{ isMobile: mob }">
      <div class="ibx">
        <!-- Desktop filters -->
        <div v-if="!mob" class="ibx-filters">
          <button class="is-active">Todos <span>23</span></button>
          <button>IA <span class="brand">11</span></button>
          <button>Humano <span>8</span></button>
          <button>Não lidos <span>4</span></button>
          <div class="grow" />
          <div class="ibx-channels">
            <span class="t-mute mono" style="font-size:10px">CANAIS</span>
            <LandingIcon name="whatsapp" :size="14" style="color:#25D366" />
            <LandingIcon name="instagram" :size="14" style="color:#E1306C" />
            <LandingIcon name="chat" :size="14" style="color:#6366F1" />
          </div>
        </div>
        <!-- Mobile filters -->
        <div v-else class="ibx-mobile-filters">
          <button class="is-active">Todos <span>23</span></button>
          <button>IA <span class="brand">11</span></button>
          <button>Não lidos <span>4</span></button>
        </div>

        <!-- Mobile view -->
        <div v-if="mob" class="ibx-mobile-view">
          <!-- List -->
          <aside v-if="!chatOpen" class="ibx-list ibx-list--mobile">
            <div
              v-for="(c, i) in convos"
              :key="i"
              :class="['ibx-row', c.active && 'is-active']"
              @click="chatOpen = true"
            >
              <div class="ibx-avatar" :style="{ background: `linear-gradient(135deg, ${chColor(c.ch)}55, ${chColor(c.ch)}11)` }">
                {{ c.name[0] }}
                <div class="ibx-avatar-ch" :style="{ background: chColor(c.ch) }">
                  <LandingIcon :name="chIcon(c.ch)" :size="9" />
                </div>
              </div>
              <div class="ibx-row-body">
                <div class="ibx-row-head">
                  <b>{{ c.name }}</b>
                  <span class="t-mute mono" style="font-size:10px">{{ c.time }}</span>
                </div>
                <div class="ibx-row-last">
                  <span v-if="c.ai" class="ibx-ai-tag"><LandingIcon name="spark" :size="9" /> IA</span>
                  <span>{{ c.last }}</span>
                </div>
              </div>
              <div v-if="c.unread > 0" class="ibx-unread">{{ c.unread }}</div>
            </div>
          </aside>
          <!-- Chat -->
          <section v-else class="ibx-chat ibx-chat--mobile">
            <div class="ibx-chat-head">
              <button class="ibx-back-btn" @click="chatOpen = false">
                <LandingIcon name="chevron" :size="14" style="transform:rotate(180deg)" />
                <span>Voltar</span>
              </button>
              <div class="ibx-avatar md" style="background:linear-gradient(135deg,#25D36655,#25D36611)">M</div>
              <div><b>Marina Silva</b><div class="t-mute" style="font-size:11px">WhatsApp · VIP · 14 visitas</div></div>
              <div class="grow" />
              <span class="pill pill--brand"><LandingIcon name="spark" :size="10" /> IA ativa</span>
            </div>
            <div class="ibx-chat-body">
              <div v-for="(m, i) in msgs" :key="i" :class="['ibx-msg', m.who === 'client' ? 'left' : m.who === 'ai' ? 'ai' : 'me']">
                <div v-if="m.who === 'ai'" class="ibx-msg-tag"><LandingIcon name="spark" :size="10" /> {{ m.name }}</div>
                <div class="ibx-msg-bub">{{ m.t }}</div>
              </div>
              <div class="ibx-suggested">
                <span class="t-mute mono" style="font-size:10px">SUGESTÕES DA IA</span>
                <button>Confirmar sábado 10h</button>
                <button>Confirmar sábado 11h30</button>
              </div>
            </div>
            <div class="ibx-chat-input">
              <input placeholder="Resposta — ou deixe a IA responder…" readonly />
              <button class="btn btn--primary btn--sm"><LandingIcon name="send" :size="13" /></button>
            </div>
          </section>
        </div>

        <!-- Desktop view -->
        <div v-else class="ibx-grid">
          <aside class="ibx-list">
            <div v-for="(c, i) in convos" :key="i" :class="['ibx-row', c.active && 'is-active']">
              <div class="ibx-avatar" :style="{ background: `linear-gradient(135deg, ${chColor(c.ch)}55, ${chColor(c.ch)}11)` }">
                {{ c.name[0] }}
                <div class="ibx-avatar-ch" :style="{ background: chColor(c.ch) }">
                  <LandingIcon :name="chIcon(c.ch)" :size="9" />
                </div>
              </div>
              <div class="ibx-row-body">
                <div class="ibx-row-head">
                  <b>{{ c.name }}</b>
                  <span class="t-mute mono" style="font-size:10px">{{ c.time }}</span>
                </div>
                <div class="ibx-row-last">
                  <span v-if="c.ai" class="ibx-ai-tag"><LandingIcon name="spark" :size="9" /> IA</span>
                  <span>{{ c.last }}</span>
                </div>
              </div>
              <div v-if="c.unread > 0" class="ibx-unread">{{ c.unread }}</div>
            </div>
          </aside>
          <section class="ibx-chat">
            <div class="ibx-chat-head">
              <div class="ibx-avatar md" style="background:linear-gradient(135deg,#25D36655,#25D36611)">M</div>
              <div>
                <b>Marina Silva</b>
                <div class="t-mute" style="font-size:11px">WhatsApp · cliente desde 2024 · 14 visitas · LTV R$ 2.840</div>
              </div>
              <div class="grow" />
              <span class="pill pill--brand"><LandingIcon name="spark" :size="10" /> IA ativa</span>
            </div>
            <div class="ibx-chat-body">
              <div v-for="(m, i) in msgs" :key="i" :class="['ibx-msg', m.who === 'client' ? 'left' : m.who === 'ai' ? 'ai' : 'me']">
                <div v-if="m.who === 'ai'" class="ibx-msg-tag"><LandingIcon name="spark" :size="10" /> {{ m.name }}</div>
                <div class="ibx-msg-bub">{{ m.t }}</div>
              </div>
              <div class="ibx-suggested">
                <span class="t-mute mono" style="font-size:10px">SUGESTÕES DA IA</span>
                <button>Confirmar sábado 10h</button>
                <button>Confirmar sábado 11h30</button>
                <button>Oferecer cupom -10%</button>
              </div>
            </div>
            <div class="ibx-chat-input">
              <input placeholder="Resposta — ou deixe a IA responder…" readonly />
              <button class="btn btn--ghost btn--sm"><LandingIcon name="bot" :size="13" /> Transferir IA</button>
              <button class="btn btn--primary btn--sm"><LandingIcon name="send" :size="13" /></button>
            </div>
          </section>
        </div>
      </div>
    </template>
  </MockChrome>
</template>
