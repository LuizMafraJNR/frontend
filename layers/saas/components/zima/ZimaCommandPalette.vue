<script setup lang="ts">
/**
 * ZimaCommandPalette — Command Palette do Design System Zima Blue.
 * Atalho ⌘K / Ctrl+K. Busca com grupos: Páginas, Ações, Clientes.
 * Navegação por teclado (↑↓ Enter Esc).
 */

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: string
  group: string
  shortcut?: string
  action?: () => void
  to?: string
}

interface Props {
  items: CommandItem[]
}

const props = defineProps<Props>()

const { commandPaletteOpen, closeCommandPalette } = useSaasLayout()

const query = ref('')
const activeIdx = ref(0)

// Filter + group items
const filteredGroups = computed(() => {
  const q = query.value.toLowerCase().trim()
  const filtered = q
    ? props.items.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q)
      )
    : props.items

  const groups: Record<string, CommandItem[]> = {}
  for (const item of filtered) {
    if (!groups[item.group]) groups[item.group] = []
    groups[item.group].push(item)
  }
  return groups
})

const flatItems = computed(() => Object.values(filteredGroups.value).flat())

// Reset on open
watch(commandPaletteOpen, (open) => {
  if (open) {
    query.value = ''
    activeIdx.value = 0
    nextTick(() => {
      document.getElementById('zima-command-input')?.focus()
    })
  }
})

// Reset active on query change
watch(query, () => { activeIdx.value = 0 })

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIdx.value = Math.min(activeIdx.value + 1, flatItems.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIdx.value = Math.max(activeIdx.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = flatItems.value[activeIdx.value]
    if (item) executeItem(item)
  }
}

const executeItem = (item: CommandItem) => {
  closeCommandPalette()
  if (item.action) item.action()
  else if (item.to) navigateTo(item.to)
}

const getItemGlobalIdx = (item: CommandItem) =>
  flatItems.value.findIndex(i => i.id === item.id)
</script>

<template>
  <Teleport to="body">
    <Transition name="zima-modal">
      <div
        v-if="commandPaletteOpen"
        class="fixed inset-0 flex items-start justify-center pt-24 px-4"
        :style="{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 'var(--zima-z-command)',
        }"
        data-testid="zima-command-palette"
        @click.self="closeCommandPalette"
      >
        <div
          class="w-full overflow-hidden"
          :style="{
            maxWidth: '560px',
            background: 'var(--zima-bg-surface-3)',
            border: '1px solid var(--zima-border-modal)',
            borderRadius: 'var(--zima-radius-lg)',
            boxShadow: 'var(--zima-shadow-modal)',
          }"
          role="dialog"
          aria-label="Command Palette — Busca global"
          aria-modal="true"
          @keydown="handleKeydown"
        >
          <!-- Search input -->
          <div
            class="flex items-center gap-3 px-4"
            :style="{
              height: '52px',
              borderBottom: '1px solid var(--zima-border-divider)',
            }"
          >
            <Icon
              name="i-lucide-search"
              :style="{ width: '16px', height: '16px', color: 'var(--zima-text-muted)', flexShrink: '0' }"
              aria-hidden="true"
            />
            <input
              id="zima-command-input"
              v-model="query"
              class="flex-1 bg-transparent text-sm outline-none"
              :style="{
                color: 'var(--zima-text-primary)',
                caretColor: 'var(--zima-blue-core)',
              }"
              placeholder="Buscar páginas, clientes, ações..."
              aria-label="Buscar"
              role="combobox"
              :aria-expanded="true"
              :aria-activedescendant="flatItems[activeIdx] ? `cmd-item-${flatItems[activeIdx].id}` : undefined"
            >
            <kbd
              class="shrink-0 flex items-center justify-center rounded px-1.5"
              :style="{
                fontSize: '10px',
                fontFamily: 'var(--zima-font-mono)',
                background: 'var(--zima-bg-surface-hover)',
                color: 'var(--zima-text-disabled)',
                border: '1px solid var(--zima-border-default)',
                height: '20px',
              }"
              aria-hidden="true"
            >
              ESC
            </kbd>
          </div>

          <!-- Results -->
          <div
            class="overflow-y-auto"
            :style="{ maxHeight: '400px' }"
            role="listbox"
          >
            <template v-if="Object.keys(filteredGroups).length > 0">
              <template v-for="(groupItems, groupName) in filteredGroups" :key="groupName">
                <!-- Group header -->
                <div
                  class="px-4 py-2"
                  :style="{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--zima-text-muted)',
                    borderTop: '1px solid var(--zima-border-divider)',
                  }"
                  aria-hidden="true"
                >
                  {{ groupName }}
                </div>

                <!-- Items -->
                <button
                  v-for="item in groupItems"
                  :id="`cmd-item-${item.id}`"
                  :key="item.id"
                  class="w-full flex items-center gap-3 px-4 text-left transition-colors duration-[100ms] focus-visible:outline-none"
                  :style="{
                    height: '44px',
                    background: getItemGlobalIdx(item) === activeIdx
                      ? 'var(--zima-blue-subtle)'
                      : '',
                  }"
                  role="option"
                  :aria-selected="getItemGlobalIdx(item) === activeIdx"
                  @click="executeItem(item)"
                  @mouseenter="activeIdx = getItemGlobalIdx(item)"
                >
                  <!-- Icon -->
                  <div
                    class="flex items-center justify-center rounded-md shrink-0"
                    :style="{
                      width: '28px',
                      height: '28px',
                      background: getItemGlobalIdx(item) === activeIdx
                        ? 'rgba(59,130,246,0.2)'
                        : 'var(--zima-bg-surface-hover)',
                    }"
                  >
                    <Icon
                      :name="item.icon || 'i-lucide-file'"
                      :style="{
                        width: '14px',
                        height: '14px',
                        color: getItemGlobalIdx(item) === activeIdx
                          ? 'var(--zima-blue-light)'
                          : 'var(--zima-text-secondary)',
                      }"
                      aria-hidden="true"
                    />
                  </div>

                  <!-- Label + description -->
                  <div class="flex-1 min-w-0">
                    <p
                      class="text-sm font-medium truncate"
                      :style="{
                        color: getItemGlobalIdx(item) === activeIdx
                          ? 'var(--zima-text-primary)'
                          : 'var(--zima-text-secondary)',
                      }"
                    >
                      {{ item.label }}
                    </p>
                    <p
                      v-if="item.description"
                      class="text-xs truncate"
                      :style="{ color: 'var(--zima-text-muted)' }"
                    >
                      {{ item.description }}
                    </p>
                  </div>

                  <!-- Shortcut -->
                  <kbd
                    v-if="item.shortcut"
                    class="shrink-0 flex items-center gap-0.5 rounded px-1.5"
                    :style="{
                      fontSize: '10px',
                      fontFamily: 'var(--zima-font-mono)',
                      background: 'var(--zima-bg-surface-hover)',
                      color: 'var(--zima-text-muted)',
                      border: '1px solid var(--zima-border-default)',
                      height: '20px',
                    }"
                    aria-hidden="true"
                  >
                    {{ item.shortcut }}
                  </kbd>
                </button>
              </template>
            </template>

            <!-- Empty -->
            <div
              v-else
              class="flex flex-col items-center justify-center py-10 gap-2"
            >
              <Icon
                name="i-lucide-search-x"
                :style="{ width: '32px', height: '32px', color: 'var(--zima-text-muted)' }"
                aria-hidden="true"
              />
              <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">
                Nenhum resultado para "{{ query }}"
              </p>
            </div>
          </div>

          <!-- Footer hints -->
          <div
            class="flex items-center gap-4 px-4"
            :style="{
              height: '36px',
              borderTop: '1px solid var(--zima-border-divider)',
            }"
          >
            <span
              v-for="hint in [
                { keys: ['↑', '↓'], label: 'navegar' },
                { keys: ['↵'], label: 'selecionar' },
                { keys: ['Esc'], label: 'fechar' },
              ]"
              :key="hint.label"
              class="flex items-center gap-1.5"
              aria-hidden="true"
            >
              <kbd
                v-for="k in hint.keys"
                :key="k"
                class="flex items-center justify-center rounded px-1"
                :style="{
                  fontSize: '10px',
                  fontFamily: 'var(--zima-font-mono)',
                  background: 'var(--zima-bg-surface-hover)',
                  color: 'var(--zima-text-disabled)',
                  border: '1px solid var(--zima-border-default)',
                  height: '18px',
                  minWidth: '18px',
                }"
              >{{ k }}</kbd>
              <span style="font-size: 11px; color: var(--zima-text-muted);">{{ hint.label }}</span>
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.zima-modal-enter-active {
  animation: zima-fade-in 150ms ease forwards;
}
.zima-modal-leave-active {
  transition: opacity 100ms ease;
}
.zima-modal-leave-to {
  opacity: 0;
}
</style>
