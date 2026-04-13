<script setup lang="ts">
/**
 * ZimaSelect — Select dropdown estilizado do Design System Zima Blue.
 * Visual idêntico ao ZimaInput. Teleport + onClickOutside do VueUse.
 */

export interface ZimaSelectOption {
  label: string
  value: string | number
  disabled?: boolean
  group?: string
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: ZimaSelectOption[]
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  modelValue: null,
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const inputId = useId()
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const isFocused = ref(false)

const hasError = computed(() => !!props.error)

const selectedOption = computed(() =>
  props.options.find(o => o.value === props.modelValue) ?? null
)

// Agrupa as opções por `group`
const groupedOptions = computed(() => {
  const groups: Array<{ group: string | null; options: ZimaSelectOption[] }> = []
  for (const opt of props.options) {
    const g = opt.group ?? null
    const existing = groups.find(x => x.group === g)
    if (existing) existing.options.push(opt)
    else groups.push({ group: g, options: [opt] })
  }
  return groups
})

const openDropdown = () => {
  if (props.disabled) return
  isOpen.value = true
  isFocused.value = true
  nextTick(positionDropdown)
}

const closeDropdown = () => {
  isOpen.value = false
  isFocused.value = false
}

const positionDropdown = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropdownH = Math.min(props.options.length * 36 + 16, 280)
  const showAbove = spaceBelow < dropdownH && rect.top > dropdownH

  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 'var(--zima-z-dropdown)',
    ...(showAbove
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }
    ),
  }
}

const selectOption = (opt: ZimaSelectOption) => {
  if (opt.disabled) return
  emit('update:modelValue', opt.value)
  closeDropdown()
}

const clearValue = (e: MouseEvent) => {
  e.stopPropagation()
  emit('update:modelValue', null)
}

// Fechar ao clicar fora usando VueUse
onClickOutside(dropdownRef, (event) => {
  if (triggerRef.value?.contains(event.target as Node)) return
  closeDropdown()
})

// Navegação por teclado
const focusedIndex = ref(-1)
const flatOptions = computed(() => props.options.filter(o => !o.disabled))

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdown()
    }
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    closeDropdown()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, flatOptions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && focusedIndex.value >= 0) {
    e.preventDefault()
    selectOption(flatOptions.value[focusedIndex.value])
  }
}

watch(isOpen, (open) => {
  if (open) {
    focusedIndex.value = props.options.findIndex(o => o.value === props.modelValue)
  } else {
    focusedIndex.value = -1
  }
})

const containerStyle = computed((): Record<string, string> => ({
  height: '36px',
  background: props.disabled ? 'var(--zima-bg-surface-3)' : 'var(--zima-bg-surface-2)',
  border: `1px solid ${
    hasError.value
      ? 'var(--zima-danger)'
      : isFocused.value || isOpen.value
        ? 'rgba(59, 130, 246, 0.5)'
        : 'rgba(148, 163, 184, 0.12)'
  }`,
  borderRadius: 'var(--zima-radius-sm)',
  boxShadow: hasError.value && (isFocused.value || isOpen.value)
    ? '0 0 0 3px rgba(239,68,68,0.1)'
    : (isFocused.value || isOpen.value)
      ? '0 0 0 3px rgba(59,130,246,0.1)'
      : 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  opacity: props.disabled ? '0.5' : '1',
  cursor: props.disabled ? 'not-allowed' : 'pointer',
}))
</script>

<template>
  <div class="flex flex-col gap-1.5" data-testid="zima-select">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="text-xs font-medium"
      :style="{ color: 'var(--zima-text-secondary)' }"
    >
      {{ label }}
    </label>

    <!-- Trigger -->
    <div
      :id="inputId"
      ref="triggerRef"
      class="flex items-center gap-2 px-3 select-none"
      :style="containerStyle"
      :tabindex="disabled ? -1 : 0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-label="label"
      :aria-invalid="hasError"
      @click="isOpen ? closeDropdown() : openDropdown()"
      @keydown="handleKeydown"
      @focus="isFocused = true"
      @blur="!isOpen && (isFocused = false)"
    >
      <!-- Selected value or placeholder -->
      <span
        class="flex-1 text-sm truncate"
        :style="{
          color: selectedOption
            ? 'var(--zima-text-primary)'
            : 'var(--zima-text-muted)',
        }"
      >
        {{ selectedOption?.label ?? placeholder ?? 'Selecionar...' }}
      </span>

      <!-- Clear button -->
      <button
        v-if="clearable && modelValue !== null"
        class="shrink-0 rounded-sm transition-colors"
        :style="{ color: 'var(--zima-text-muted)' }"
        tabindex="-1"
        aria-label="Limpar seleção"
        @click="clearValue"
        @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'"
        @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'"
      >
        <Icon name="i-lucide-x" style="width: 14px; height: 14px;" aria-hidden="true" />
      </button>

      <!-- Chevron -->
      <Icon
        name="i-lucide-chevron-down"
        style="width: 14px; height: 14px; shrink: 0; transition: transform 150ms ease;"
        :style="{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--zima-text-muted)' }"
        aria-hidden="true"
      />
    </div>

    <!-- Dropdown via Teleport -->
    <Teleport to="body">
      <Transition name="zima-select-dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :style="{
            ...dropdownStyle,
            background: 'var(--zima-bg-surface-3)',
            border: '1px solid var(--zima-border-modal)',
            borderRadius: 'var(--zima-radius-md)',
            boxShadow: 'var(--zima-shadow-dropdown)',
            overflow: 'hidden',
            overflowY: 'auto',
            maxHeight: '280px',
            padding: '4px',
          }"
          role="listbox"
          :aria-label="label"
        >
          <template v-for="(group, gi) in groupedOptions" :key="gi">
            <!-- Group header -->
            <div
              v-if="group.group"
              class="px-3 py-1.5"
              :style="{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--zima-text-muted)',
              }"
              aria-hidden="true"
            >
              {{ group.group }}
            </div>

            <!-- Options -->
            <button
              v-for="(opt, oi) in group.options"
              :key="oi"
              class="flex items-center w-full px-3 rounded-md text-sm transition-colors text-left"
              :style="{
                height: '36px',
                color: opt.disabled
                  ? 'var(--zima-text-disabled)'
                  : opt.value === modelValue
                    ? 'var(--zima-blue-light)'
                    : 'var(--zima-text-primary)',
                background: opt.value === modelValue
                  ? 'var(--zima-blue-subtle)'
                  : 'transparent',
                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                opacity: opt.disabled ? '0.5' : '1',
              }"
              role="option"
              :aria-selected="opt.value === modelValue"
              :disabled="opt.disabled"
              @click="selectOption(opt)"
              @mouseenter="(e: MouseEvent) => {
                if (!opt.disabled && opt.value !== modelValue)
                  (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'
              }"
              @mouseleave="(e: MouseEvent) => {
                if (opt.value !== modelValue)
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
              }"
            >
              {{ opt.label }}
              <Icon
                v-if="opt.value === modelValue"
                name="i-lucide-check"
                style="width: 14px; height: 14px; margin-left: auto;"
                :style="{ color: 'var(--zima-blue-core)' }"
                aria-hidden="true"
              />
            </button>
          </template>
        </div>
      </Transition>
    </Teleport>

    <!-- Error -->
    <p
      v-if="hasError"
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
      class="text-xs"
      :style="{ color: 'var(--zima-text-muted)' }"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.zima-select-dropdown-enter-active {
  animation: zima-fade-in 120ms ease forwards;
}
.zima-select-dropdown-leave-active {
  transition: opacity 80ms ease;
}
.zima-select-dropdown-leave-to {
  opacity: 0;
}
</style>
