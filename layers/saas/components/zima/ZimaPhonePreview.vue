<script setup lang="ts">
export interface PhoneMessage {
  sender: 'client' | 'agent'
  text: string
}

const props = withDefaults(defineProps<{
  agentName?: string
  messages?: PhoneMessage[]
}>(), {
  agentName: 'Assistente',
  messages: () => [],
})
</script>

<template>
  <div style="display:flex; justify-content:center;">
    <div style="width:300px; border-radius:36px; background:#111520; border:8px solid #1E2535; overflow:hidden; box-shadow:0 24px 48px rgba(0,0,0,0.5);">
      <!-- Phone header -->
      <div style="background:#1A2035; padding:10px 16px 8px; border-bottom:1px solid rgba(148,163,184,0.08);">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:32px;height:32px;border-radius:50%;background:rgba(59,130,246,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <Icon name="i-lucide-bot" style="width:16px;height:16px;color:#3B82F6;" />
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#F1F5F9;">{{ props.agentName }}</div>
            <div style="font-size:11px;color:#10B981;display:flex;align-items:center;gap:4px;">
              <div style="width:6px;height:6px;border-radius:50%;background:#10B981;"></div>
              Online
            </div>
          </div>
        </div>
      </div>

      <!-- Messages area -->
      <div style="background:#07090E;padding:12px;min-height:240px;display:flex;flex-direction:column;gap:8px;">
        <template v-for="(msg, i) in props.messages" :key="i">
          <!-- Client message -->
          <div v-if="msg.sender === 'client'" style="display:flex;justify-content:flex-start;">
            <div style="max-width:80%;padding:8px 12px;background:#161B28;border-radius:12px 12px 12px 4px;font-size:12px;color:#CBD5E1;line-height:1.4;">
              {{ msg.text }}
            </div>
          </div>
          <!-- Agent message -->
          <div v-else style="display:flex;justify-content:flex-end;">
            <div style="max-width:80%;padding:8px 12px;background:rgba(59,130,246,0.12);border-radius:12px 12px 4px 12px;font-size:12px;color:#E2E8F0;line-height:1.4;border:1px solid rgba(59,130,246,0.15);">
              {{ msg.text }}
            </div>
          </div>
        </template>

        <!-- Empty state -->
        <div v-if="!props.messages.length" style="flex:1;display:flex;align-items:center;justify-content:center;color:#475569;font-size:12px;">
          Preview das mensagens
        </div>
      </div>

      <!-- Fake input -->
      <div style="background:#111520;padding:8px;border-top:1px solid rgba(148,163,184,0.06);display:flex;align-items:center;gap:6px;">
        <div style="flex:1;height:32px;background:#1A2035;border-radius:16px;border:1px solid rgba(148,163,184,0.08);display:flex;align-items:center;padding:0 12px;">
          <span style="font-size:11px;color:#475569;">Mensagem...</span>
        </div>
        <div style="width:28px;height:28px;border-radius:50%;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <Icon name="i-lucide-send" style="width:12px;height:12px;color:#3B82F6;" />
        </div>
      </div>
    </div>
  </div>
</template>
