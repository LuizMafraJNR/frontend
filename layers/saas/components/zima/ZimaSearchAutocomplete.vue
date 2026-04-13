<script setup lang="ts">
/**
 * ZimaSearchAutocomplete — Input com dropdown de resultados.
 * Debounce 300ms, Teleport, VueUse onClickOutside.
 */

export interface ZimaSearchItem {
  id: string | number
  label: string
  sublabel?: string
  avatar?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  items: ZimaSearchItem[]
  loading?: boolean
  placeholder?: string
  label?: string
  hint?: string
  minChars?: number
}>(), {
  modelValue: '',
  loading: false,
  minChars: 2,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [item: ZimaSearchItem]
  'search': [query: string]
}>()

const inputId = useId()
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isFocused = ref(false)
const isOpen = ref(false)
const dropdownStyle = ref<Record<string, string>>({})

// Debounce
const debouncedSearch = useDebounce(
  computed(() => props.modelValue),
  300,
)

watch(debouncedSearch, (q) => {
  if (q.length >= props.minChars) {
    emit('search', q)
    isOpen.value = true
    nextTick(positionDropdown)
  } else {
    isOpen.value = false
  }
})

const positionDropdown = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
    width: `${rect.width}px`,
    zIndex: 'var(--zima-z-dropdown)',
  }
}

const selectItem = (item: ZimaSearchItem) => {
  emit('update:modelValue', item.label)
  emit('select', item)
  isOpen.value = false
}

const clearInput = () => {
  emit('update:modelValue', '')
  isOpen.value = false
}

onClickOutside(dropdownRef, (event) => {
  if (triggerRef.value?.contains(event.target as Node)) return
  isOpen.value = false
})

const showDropdown = computed(() =>
  isOpen.value && props.modelValue.length >= props.minChars
)
</script>

<template>
  <div class="flex flex-col gap-1.5" data-testid="zima-search-autocomplete">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="text-xs font-medium"
      :style="{ color: 'var(--zima-text-secondary)' }"
    >
      {{ label }}
    </label>

    <!-- Input wrapper -->
    <div
      ref="triggerRef"
      class="flex items-center gap-2 px-3"
      :style="{
        height: '36px',
        background: 'var(--zima-bg-surface-2)',
        border: `1px solid ${isFocused ? 'rgba(59,130,246,0.5)' : 'rgba(148,163,184,0.12)'}`,
        borderRadius: 'var(--zima-radius-sm)',
        boxShadow: isFocused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
      }"
    >
      <Icon
        name="i-lucide-search"
        style="width: 14px; height: 14px; shrink: 0;"
        :style="{ color: 'var(--zima-text-muted)' }"
        aria-hidden="true"
      />

      <input
        :id="inputId"
        type="search"
        :value="modelValue"
        :placeholder="placeholder ?? 'Buscar...'"
        autocomplete="off"
        class="flex-1 bg-transparent text-sm outline-none min-w-0"
        :style="{
          color: 'var(--zima-text-primary)',
          caretColor: 'var(--zima-blue-core)',
        }"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <!-- Loading spinner -->
      <span
        v-if="loading"
        class="shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
        :style="{ width: '14px', height: '14px', color: 'var(--zima-text-muted)' }"
        aria-hidden="true"
      />

      <!-- Clear button -->
      <button
        v-else-if="modelValue"
        class="shrink-0 rounded-sm transition-colors"
        :style="{ color: 'var(--zima-text-muted)' }"
        tabindex="-1"
        aria-label="Limpar busca"
        @click="clearInput"
        @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'"
        @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'"
      >
        <Icon name="i-lucide-x" style="width: 14px; height: 14px;" aria-hidden="true" />
      </button>
    </div>

    <!-- Dropdown via Teleport -->
    <Teleport to="body">
      <Transition name="zima-autocomplete-dropdown">
        <div
          v-if="showDropdown"
          ref="dropdownRef"
          :style="{
            ...dropdownStyle,
            background: 'var(--zima-bg-surface-3)',
            border: '1px solid var(--zima-border-modal)',
            borderRadius: 'var(--zima-radius-md)',
            boxShadow: 'var(--zima-shadow-dropdown)',
            overflow: 'hidden',
            overflowY: 'auto',
            maxHeight: '300px',
            padding: '4px',
          }"
          role="listbox"
        >
          <!-- Loading state -->
          <div
            v-if="loading"
            class="flex items-center gap-2 px-3"
            :style="{ height: '40px', color: 'var(--zima-text-muted)', fontSize: '13px' }"
          >
            <span
              class="rounded-full border-2 border-current border-t-transparent animate-spin"
              :style="{ width: '14px', height: '14px' }"
              aria-hidden="true"
            />
            Buscando...
          </div>

          <!-- Results -->
          <template v-else-if="items.length > 0">
            <button
              v-for="item in items"
              :key="item.id"
              class="flex items-center gap-3 w-full px-3 rounded-md transition-colors"
              :style="{
                height: '44px',
                color: 'var(--zima-text-primary)',
                background: 'transparent',
                cursor: 'pointer',
              }"
              role="option"
              :aria-selected="false"
              @click="selectItem(item)"
              @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
              @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
            >
              <ZimaAvatar
                v-if="item.avatar !== undefined"
                :src="item.avatar || undefined"
                :name="item.label"
                size="xs"
              />
              <div class="flex-1 text-left min-w-0">
                <p class="text-sm font-medium truncate" :style="{ color: 'var(--zima-text-primary)' }">
                  {{ item.label }}
                </p>
                <p v-if="item.sublabel" class="text-xs truncate" :style="{ color: 'var(--zima-text-muted)' }">
                  {{ item.sublabel }}
                </p>
              </div>
            </button>
          </template>

          <!-- Empty state -->
          <div
            v-else
            class="flex items-center justify-center px-3"
            :style="{ height: '48px', color: 'var(--zima-text-muted)', fontSize: '13px' }"
          >
            Nenhum resultado encontrado
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Hint -->
    <p
      v-if="hint"
      class="text-xs"
      :style="{ color: 'var(--zima-text-muted)' }"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.zima-autocomplete-dropdown-enter-active {
  animation: zima-fade-in 120ms ease forwards;
}
.zima-autocomplete-dropdown-leave-active {
  transition: opacity 80ms ease;
}
.zima-autocomplete-dropdown-leave-to {
  opacity: 0;
}
</style>
