<script setup lang="ts">
/**
 * ZimaInput — Campo de entrada do Design System Zima Blue.
 * Altura 36px, dark mode, focus ring azul, máscara opcional.
 */

type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url' | 'date'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  type?: InputType
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  required?: boolean
  prefix?: string
  suffix?: string
}>(), {
  type: 'text',
  disabled: false,
  loading: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputId = useId()
const hasError = computed(() => !!props.error)
const isFocused = ref(false)

const containerStyle = computed((): Record<string, string> => ({
  height: '36px',
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
  cursor: props.disabled ? 'not-allowed' : 'text',
}))
</script>

<template>
  <div class="flex flex-col gap-1.5" data-testid="zima-input">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
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

    <!-- Input wrapper -->
    <div
      class="flex items-center gap-2 px-3"
      :style="containerStyle"
    >
      <!-- Prefix text/icon -->
      <span
        v-if="prefix || $slots.prefix"
        class="text-sm shrink-0"
        :style="{ color: 'var(--zima-text-muted)' }"
        aria-hidden="true"
      >
        <slot name="prefix">{{ prefix }}</slot>
      </span>

      <!-- Input element -->
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        :required="required"
        :aria-invalid="hasError"
        :aria-describedby="
          hasError ? `${inputId}-error` :
          hint ? `${inputId}-hint` : undefined
        "
        class="flex-1 bg-transparent text-sm outline-none min-w-0"
        :style="{
          color: 'var(--zima-text-primary)',
          caretColor: 'var(--zima-blue-core)',
          cursor: disabled ? 'not-allowed' : 'text',
        }"
        :placeholder-style="{ color: 'var(--zima-text-disabled)' }"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="isFocused = true; emit('focus', $event)"
        @blur="isFocused = false; emit('blur', $event)"
      >

      <!-- Loading spinner -->
      <span
        v-if="loading"
        class="shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
        :style="{
          width: '14px',
          height: '14px',
          color: 'var(--zima-text-muted)',
        }"
        aria-hidden="true"
      />

      <!-- Suffix text/icon -->
      <span
        v-if="(suffix || $slots.suffix) && !loading"
        class="text-sm shrink-0"
        :style="{ color: 'var(--zima-text-muted)' }"
        aria-hidden="true"
      >
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </div>

    <!-- Error message -->
    <p
      v-if="hasError"
      :id="`${inputId}-error`"
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
      :id="`${inputId}-hint`"
      class="text-xs"
      :style="{ color: 'var(--zima-text-muted)' }"
    >
      {{ hint }}
    </p>
  </div>
</template>
