<script setup lang="ts">
/**
 * ZimaTabs — Tabs do Design System Zima Blue.
 * Border-bottom ativo com linha azul, contadores opcionais.
 */

export interface ZimaTab {
  key: string
  label: string
  icon?: string
  count?: number
  disabled?: boolean
}

withDefaults(defineProps<{
  tabs: ZimaTab[]
  modelValue: string
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [key: string]
}>()

const select = (tab: ZimaTab) => {
  if (tab.disabled) return
  emit('update:modelValue', tab.key)
}
</script>

<template>
  <div data-testid="zima-tabs">
    <!-- Tab list (scroll horizontal em telas estreitas) -->
    <div
      class="overflow-x-auto hide-scrollbar"
      :style="{ borderBottom: '1px solid var(--zima-border-default)' }"
    >
    <div
      class="flex items-center"
      role="tablist"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex items-center gap-2 px-4 py-2.5 relative text-sm transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2 whitespace-nowrap"
        :style="{
          color: modelValue === tab.key
            ? 'var(--zima-text-primary)'
            : tab.disabled
              ? 'var(--zima-text-disabled)'
              : 'var(--zima-text-muted)',
          fontWeight: modelValue === tab.key ? '500' : '400',
          cursor: tab.disabled ? 'not-allowed' : 'pointer',
          '--tw-ring-color': 'var(--zima-focus-outline)',
          borderBottom: modelValue === tab.key
            ? '2px solid var(--zima-blue-core)'
            : '2px solid transparent',
          marginBottom: '-1px',
        }"
        role="tab"
        :aria-selected="modelValue === tab.key"
        :aria-disabled="tab.disabled"
        :tabindex="modelValue === tab.key ? 0 : -1"
        @click="select(tab)"
        @mouseenter="(e: MouseEvent) => {
          if (modelValue !== tab.key && !tab.disabled) {
            (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-secondary)'
          }
        }"
        @mouseleave="(e: MouseEvent) => {
          if (modelValue !== tab.key && !tab.disabled) {
            (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'
          }
        }"
      >
        <Icon
          v-if="tab.icon"
          :name="tab.icon"
          style="width: 16px; height: 16px; stroke-width: 1.5px;"
          aria-hidden="true"
        />
        {{ tab.label }}
        <!-- Count badge -->
        <span
          v-if="tab.count !== undefined"
          class="flex items-center justify-center rounded-full text-xs font-semibold"
          :style="{
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            background: modelValue === tab.key
              ? 'var(--zima-blue-subtle)'
              : 'var(--zima-bg-surface-hover)',
            color: modelValue === tab.key
              ? 'var(--zima-blue-light)'
              : 'var(--zima-text-muted)',
            fontSize: '11px',
          }"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
    </div>

    <!-- Tab panels -->
    <div role="tabpanel" :aria-label="tabs.find(t => t.key === modelValue)?.label">
      <slot :active="modelValue" />
      <template v-for="tab in tabs" :key="tab.key">
        <slot v-if="modelValue === tab.key" :name="tab.key" />
      </template>
    </div>
  </div>
</template>
