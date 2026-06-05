<script setup lang="ts">
/**
 * ZimaTextarea — Área de texto estilizada do Design System Zima Blue.
 * Visual idêntico ao ZimaInput: borda sutil, fundo surface-2, foco com ring azul.
 * Props compatíveis com ZimaInput para consistência de API.
 */

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  /** Permite redimensionamento: 'none' | 'vertical' | 'horizontal' | 'both' */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  /** Altura máxima antes de scroll (em px) */
  maxHeight?: number
}>(), {
  rows: 3,
  resize: 'vertical',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const textareaId = useId()
const isFocused = ref(false)
const hasError = computed(() => !!props.error)

const wrapperStyle = computed((): Record<string, string> => ({
  background: props.disabled ? 'var(--zima-bg-surface-3)' : 'var(--zima-bg-surface-2)',
  border: `1px solid ${
    hasError.value
      ? 'var(--zima-danger)'
      : isFocused.value
        ? 'rgba(59, 130, 246, 0.5)'
        : 'rgba(148, 163, 184, 0.12)'
  }`,
  borderRadius: 'var(--zima-radius-sm)',
  boxShadow: hasError.value && isFocused.value
    ? '0 0 0 3px rgba(239,68,68,0.1)'
    : isFocused.value
      ? '0 0 0 3px rgba(59,130,246,0.1)'
      : 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  opacity: props.disabled ? '0.5' : '1',
}))

const textareaStyle = computed((): Record<string, string> => ({
  resize: props.resize,
  maxHeight: props.maxHeight ? `${props.maxHeight}px` : 'none',
  minHeight: `${props.rows * 24}px`,
}))
</script>

<template>
  <div class="flex flex-col gap-1.5" data-testid="zima-textarea">
    <!-- Label -->
    <label
      v-if="label"
      :for="textareaId"
      class="text-xs font-medium"
      :style="{ color: 'var(--zima-text-secondary)' }"
    >
      {{ label }}
      <span
        v-if="required"
        :style="{ color: 'var(--zima-danger)' }"
        aria-hidden="true"
      > *</span>
    </label>

    <!-- Textarea wrapper -->
    <div :style="wrapperStyle">
      <textarea
        :id="textareaId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        :aria-invalid="hasError"
        :aria-describedby="
          hasError ? `${textareaId}-error` :
          hint ? `${textareaId}-hint` : undefined
        "
        class="w-full bg-transparent text-sm outline-none px-3 py-2 font-inherit"
        :style="{
          color: 'var(--zima-text-primary)',
          caretColor: 'var(--zima-blue-core)',
          cursor: disabled ? 'not-allowed' : 'text',
          display: 'block',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          ...textareaStyle,
        }"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @focus="isFocused = true; emit('focus', $event)"
        @blur="isFocused = false; emit('blur', $event)"
      />
    </div>

    <!-- Error message -->
    <p
      v-if="hasError"
      :id="`${textareaId}-error`"
      class="flex items-center gap-1 text-xs"
      :style="{ color: 'var(--zima-danger)' }"
      role="alert"
    >
      <Icon name="i-lucide-circle-alert" style="width: 12px; height: 12px;" aria-hidden="true" />
      {{ error }}
    </p>

    <!-- Hint -->
    <p
      v-else-if="hint"
      :id="`${textareaId}-hint`"
      class="text-xs"
      :style="{ color: 'var(--zima-text-muted)' }"
    >
      {{ hint }}
    </p>
  </div>
</template>
