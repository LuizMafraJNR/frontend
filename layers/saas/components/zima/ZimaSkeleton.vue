<script setup lang="ts">
/**
 * ZimaSkeleton — Loading skeleton do Design System Zima Blue.
 * Animação shimmer com cores da paleta Zima.
 * Preset: 'text' | 'title' | 'avatar' | 'card' | 'table-row'
 */

type SkeletonPreset = 'text' | 'title' | 'avatar' | 'block' | 'custom'

withDefaults(defineProps<{
  preset?: SkeletonPreset
  width?: string
  height?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  lines?: number
  avatarSize?: number
}>(), {
  preset: 'custom',
  rounded: 'md',
  lines: 1,
  avatarSize: 40,
})

const shimmerStyle: Record<string, string> = {
  background: 'var(--zima-skeleton-base)',
  backgroundImage: 'linear-gradient(90deg, var(--zima-skeleton-base) 25%, var(--zima-skeleton-shine) 50%, var(--zima-skeleton-base) 75%)',
  backgroundSize: '800px 100%',
  animation: 'zima-shimmer 1.5s infinite linear',
}

const radiusClass: Record<string, string> = {
  sm: 'var(--zima-radius-xs)',
  md: 'var(--zima-radius-sm)',
  lg: 'var(--zima-radius-md)',
  full: 'var(--zima-radius-full)',
}
</script>

<template>
  <div data-testid="zima-skeleton" aria-hidden="true" aria-busy="true">
    <!-- Preset: card -->
    <template v-if="preset === 'card'">
      <div
        :style="{
          ...shimmerStyle,
          height: height || '120px',
          width: width || '100%',
          borderRadius: 'var(--zima-radius-md)',
        }"
      />
    </template>

    <!-- Preset: avatar + text -->
    <template v-else-if="preset === 'avatar'">
      <div class="flex items-center gap-3">
        <div
          :style="{
            ...shimmerStyle,
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            borderRadius: 'var(--zima-radius-full)',
            flexShrink: '0',
          }"
        />
        <div class="flex-1 flex flex-col gap-2">
          <div :style="{ ...shimmerStyle, height: '14px', width: '60%', borderRadius: 'var(--zima-radius-sm)' }" />
          <div :style="{ ...shimmerStyle, height: '12px', width: '40%', borderRadius: 'var(--zima-radius-sm)' }" />
        </div>
      </div>
    </template>

    <!-- Preset: title (wider line) -->
    <template v-else-if="preset === 'title'">
      <div :style="{ ...shimmerStyle, height: '24px', width: width || '50%', borderRadius: 'var(--zima-radius-sm)' }" />
    </template>

    <!-- Preset: text lines -->
    <template v-else-if="preset === 'text'">
      <div class="flex flex-col gap-2">
        <div
          v-for="i in lines"
          :key="i"
          :style="{
            ...shimmerStyle,
            height: '14px',
            width: i === lines && lines > 1 ? '70%' : '100%',
            borderRadius: 'var(--zima-radius-sm)',
          }"
        />
      </div>
    </template>

    <!-- Custom -->
    <template v-else>
      <div
        :style="{
          ...shimmerStyle,
          width: width || '100%',
          height: height || '16px',
          borderRadius: radiusClass[rounded],
        }"
      />
    </template>
  </div>
</template>
