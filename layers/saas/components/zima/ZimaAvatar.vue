<script setup lang="ts">
/**
 * ZimaAvatar — Avatar do Design System Zima Blue.
 * Fallback com iniciais. Tamanhos: xs(24) sm(32) md(40) lg(64) xl(96).
 * Status dot opcional (online/offline/busy).
 */

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarStatus = 'online' | 'offline' | 'busy' | null

const props = withDefaults(defineProps<{
  src?: string
  name?: string
  size?: AvatarSize
  status?: AvatarStatus
  clickable?: boolean
}>(), {
  size: 'md',
  status: null,
  clickable: false,
})

const emit = defineEmits<{
  click: []
}>()

const sizePx: Record<AvatarSize, number> = {
  xs: 24, sm: 32, md: 40, lg: 64, xl: 96,
}

const fontSizePx: Record<AvatarSize, string> = {
  xs: '9px', sm: '11px', md: '14px', lg: '22px', xl: '32px',
}

const statusSize: Record<AvatarSize, string> = {
  xs: '6px', sm: '8px', md: '10px', lg: '12px', xl: '14px',
}

const statusColors: Record<NonNullable<AvatarStatus>, string> = {
  online:  'var(--zima-success)',
  offline: 'var(--zima-text-disabled)',
  busy:    'var(--zima-warning)',
}

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const px = computed(() => sizePx[props.size])
</script>

<template>
  <div
    class="relative inline-flex shrink-0"
    :style="{ width: `${px}px`, height: `${px}px` }"
    data-testid="zima-avatar"
  >
    <component
      :is="clickable ? 'button' : 'div'"
      class="w-full h-full rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2"
      :style="{ '--tw-ring-color': 'var(--zima-focus-outline)' }"
      :aria-label="clickable ? `Ver perfil de ${name || 'usuário'}` : undefined"
      @click="clickable && emit('click')"
    >
      <!-- Image -->
      <NuxtImg
        v-if="src"
        :src="src"
        :alt="name || 'Avatar'"
        :width="px"
        :height="px"
        class="w-full h-full object-cover"
      />
      <!-- Initials fallback -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center font-semibold"
        :style="{
          background: 'var(--zima-avatar-fallback-bg)',
          color: 'var(--zima-avatar-fallback-color)',
          fontSize: fontSizePx[size],
        }"
        :aria-label="name || 'Avatar'"
      >
        {{ initials }}
      </div>
    </component>

    <!-- Status indicator -->
    <span
      v-if="status"
      class="absolute bottom-0 right-0 rounded-full"
      :style="{
        width: statusSize[size],
        height: statusSize[size],
        background: statusColors[status],
        border: '2px solid var(--zima-bg-surface-2)',
      }"
      :aria-label="`Status: ${status === 'online' ? 'online' : status === 'busy' ? 'ocupado' : 'offline'}`"
    />
  </div>
</template>
