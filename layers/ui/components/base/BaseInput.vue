<script setup lang="ts">
interface Props {
  /** Rótulo visível */
  label?: string
  /** Placeholder */
  placeholder?: string
  /** Tipo HTML do input */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search'
  /** Mensagem de erro */
  error?: string
  /** Texto de ajuda abaixo do campo */
  hint?: string
  /** Desabilitar o campo */
  disabled?: boolean
  /** Campo obrigatório */
  required?: boolean
}

const {
  label = undefined,
  placeholder = undefined,
  type = 'text',
  error = undefined,
  hint = undefined,
  disabled = false,
  required = false,
} = defineProps<Props>()

const model = defineModel<string>({ default: '' })

const id = useId()

const inputClasses = computed(() => [
  'block w-full rounded-md border px-3 py-2 text-neutral-900',
  'placeholder:text-neutral-400',
  'focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors',
  error
    ? 'border-danger-500 focus:ring-danger-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500',
  disabled ? 'bg-neutral-100 cursor-not-allowed opacity-60' : 'bg-white',
])
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      v-if="label"
      :for="id"
      class="text-sm font-medium text-neutral-700"
    >
      {{ label }}
      <span v-if="required" class="ml-0.5 text-danger-500" aria-hidden="true">*</span>
    </label>

    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      :aria-invalid="!!error"
      :class="inputClasses"
    >

    <p
      v-if="error"
      :id="`${id}-error`"
      class="text-sm text-danger-500"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="`${id}-hint`"
      class="text-sm text-neutral-500"
    >
      {{ hint }}
    </p>
  </div>
</template>
