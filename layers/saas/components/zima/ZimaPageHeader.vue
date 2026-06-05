<script setup lang="ts">
/**
 * ZimaPageHeader — Cabeçalho padronizado de página do Design System Zima Blue.
 * Título + descrição + slot de ações (direita) + slot de tabs (abaixo).
 * Usado em TODAS as telas SaaS para garantir consistência visual.
 */

withDefaults(defineProps<{
  title: string
  description?: string
  /** Badge opcional ao lado do título (passar conteúdo como string) */
  badge?: string
}>(), {})
</script>

<template>
  <div class="zima-page-header" data-testid="zima-page-header">
    <!-- Linha superior: título + ações -->
    <div
      class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
      :style="{ marginBottom: $slots.tabs ? '0' : 'var(--zima-page-gap)' }"
    >
      <!-- Esquerda: título + descrição -->
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h1
            :style="{
              fontSize: '24px',
              fontWeight: '700',
              lineHeight: '1.2',
              letterSpacing: '-0.01em',
              color: 'var(--zima-text-primary)',
              fontFamily: 'var(--zima-font-display)',
              margin: '0',
            }"
          >
            {{ title }}
          </h1>
          <slot name="badge">
            <span
              v-if="badge"
              class="inline-flex items-center rounded-full px-2"
              :style="{
                height: '20px',
                fontSize: '11px',
                fontWeight: '600',
                background: 'var(--zima-blue-subtle)',
                color: 'var(--zima-blue-light)',
                border: '1px solid var(--zima-border-active)',
              }"
            >
              {{ badge }}
            </span>
          </slot>
        </div>
        <p
          v-if="description"
          :style="{
            fontSize: '13px',
            color: 'var(--zima-text-muted)',
            marginTop: '4px',
            marginBottom: '0',
          }"
        >
          {{ description }}
        </p>
      </div>

      <!-- Direita: botões de ação -->
      <div
        v-if="$slots.actions"
        class="flex items-center gap-2 flex-wrap flex-shrink-0"
      >
        <slot name="actions" />
      </div>
    </div>

    <!-- Tabs (abaixo do header, sem gap extra) -->
    <div
      v-if="$slots.tabs"
      :style="{ marginTop: '20px', marginBottom: 'var(--zima-page-gap)' }"
    >
      <slot name="tabs" />
    </div>
  </div>
</template>
