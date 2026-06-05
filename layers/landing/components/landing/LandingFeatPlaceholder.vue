<script setup lang="ts">
defineProps<{ featKey: string }>()
</script>

<template>
  <!-- Inbox placeholder -->
  <div v-if="featKey === 'inbox'" class="fp">
    <div class="fp-head"><b>Inbox Multi-canal</b></div>
    <div class="fp-list">
      <div v-for="(row, i) in [
        ['WhatsApp','Marina Silva','Posso remarcar?','2'],
        ['Instagram','Beleza Studio','Vocês fazem progressiva?','1'],
        ['Webchat','Visitante','Quanto custa sobrancelha?','0'],
        ['WhatsApp','Camila Costa','Pode ser 15h?','0'],
      ]" :key="i" class="fp-row">
        <span class="fp-ch" :data-ch="row[0]">{{ row[0] }}</span>
        <span class="fp-name">{{ row[1] }}</span>
        <span class="fp-last">{{ row[2] }}</span>
        <span v-if="row[3] !== '0'" class="fp-unread">{{ row[3] }}</span>
      </div>
    </div>
  </div>

  <!-- Stock placeholder -->
  <div v-else-if="featKey === 'stock'" class="fp">
    <div class="fp-head"><b>Estoque inteligente</b><span class="pill pill--warn">2 produtos críticos</span></div>
    <div class="fp-table">
      <div class="fp-table-head">
        <span>Produto</span><span>SKU</span><span>Nível</span><span>Reposição</span>
      </div>
      <div
        v-for="(l, i) in [
          ['Tinta Wella 7.0','WL-7-0','84%','ok'],
          ['Hidratação K-Pro','KP-HD-1','32%','warn'],
          ['Selante Loreal','LR-SL-3','12%','bad'],
          ['Esmalte Risqué','RQ-VR-5','67%','ok'],
          ['Shampoo Truss','TS-SH-2','8%','bad'],
        ]"
        :key="i"
        class="fp-table-row"
      >
        <span>{{ l[0] }}</span>
        <span class="mono t-mute">{{ l[1] }}</span>
        <span class="fp-bar">
          <i :style="{ width: l[2], background: l[3]==='ok'?'var(--ok)':l[3]==='warn'?'var(--warn)':'var(--bad)' }" />
          <b>{{ l[2] }}</b>
        </span>
        <span class="pill" :style="{
          color: l[3]==='ok'?'var(--ok)':l[3]==='warn'?'var(--warn)':'var(--bad)',
          borderColor: (l[3]==='ok'?'var(--ok)':l[3]==='warn'?'var(--warn)':'var(--bad)')+'44',
          background: (l[3]==='ok'?'var(--ok)':l[3]==='warn'?'var(--warn)':'var(--bad)')+'10',
        }">
          {{ l[3]==='ok'?'OK':l[3]==='warn'?'Reabastecer':'Crítico' }}
        </span>
      </div>
    </div>
  </div>

  <!-- Campaign placeholder -->
  <div v-else-if="featKey === 'camp'" class="fp">
    <div class="fp-head"><b>Campanha Re-ativação VIP</b><span class="pill pill--brand">Disparada hoje 14:32</span></div>
    <div class="fp-camp">
      <div class="fp-aud">
        <span class="t-mute mono" style="font-size:10px">AUDIÊNCIA</span>
        <b>412 clientes · VIP + última visita &gt; 45 dias</b>
      </div>
      <div class="fp-msg">
        <p>Olá {'{{nome}}'}, sentimos sua falta no Atelier 💙</p>
        <p>Reserve seu próximo horário e ganhe -15% em qualquer serviço.</p>
      </div>
      <div class="fp-stats">
        <div v-for="s in [['Entregue','412'],['Lido','381'],['Clicado','94'],['Convertido','37']]" :key="s[0]" class="fp-stat">
          <div class="t-mute mono" style="font-size:10px">{{ s[0] }}</div>
          <div class="fp-stat-v mono">{{ s[1] }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- NF placeholder -->
  <div v-else-if="featKey === 'nf'" class="fp">
    <div class="fp-head"><b>NFS-e #2.087</b><span class="pill pill--ok">Emitida</span></div>
    <div class="fp-nf">
      <div v-for="r in [
        ['Destinatário','Marina Silva · 412.***-44'],
        ['Município','Joinville / SC'],
        ['Serviço','Coloração + Corte + Hidratação'],
        ['Valor bruto','R$ 555,00'],
        ['ISS retido','R$ 27,75'],
        ['Status','Emitida · enviada por WhatsApp'],
      ]" :key="r[0]" class="fp-nf-row">
        <span class="t-mute mono" style="font-size:10px;text-transform:uppercase;letter-spacing:.08em">{{ r[0] }}</span>
        <span>{{ r[1] }}</span>
      </div>
    </div>
  </div>
</template>
