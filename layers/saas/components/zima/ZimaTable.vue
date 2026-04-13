<script setup lang="ts">
/**
 * ZimaTable — Tabela de dados enterprise do Design System Zima Blue.
 * Alta densidade (row height 48px), sorting, seleção múltipla,
 * paginação, estados loading/empty/error, ações em batch.
 */

export interface ZimaTableColumn<T = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T, idx: number) => unknown
}

type SortDirection = 'asc' | 'desc' | null

const props = withDefaults(defineProps<{
  columns: ZimaTableColumn[]
  rows: Record<string, unknown>[]
  loading?: boolean
  error?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
  selectable?: boolean
  rowClickable?: boolean
  // Pagination
  total?: number
  page?: number
  pageSize?: number
  pageSizeOptions?: number[]
}>(), {
  loading: false,
  selectable: false,
  rowClickable: false,
  emptyTitle: 'Nenhum resultado',
  emptyDescription: 'Tente ajustar os filtros ou criar um novo item.',
  emptyIcon: 'i-lucide-inbox',
  total: 0,
  page: 1,
  pageSize: 20,
  pageSizeOptions: () => [10, 20, 50, 100],
})

const emit = defineEmits<{
  'sort': [key: string, dir: SortDirection]
  'row-click': [row: Record<string, unknown>, idx: number]
  'selection-change': [selectedRows: Record<string, unknown>[]]
  'page-change': [page: number]
  'page-size-change': [size: number]
  'retry': []
}>()

// Sorting
const sortKey = ref<string | null>(null)
const sortDir = ref<SortDirection>(null)

const handleSort = (col: ZimaTableColumn) => {
  if (!col.sortable) return
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : sortDir.value === 'desc' ? null : 'asc'
    if (sortDir.value === null) sortKey.value = null
  } else {
    sortKey.value = col.key
    sortDir.value = 'asc'
  }
  emit('sort', sortKey.value ?? col.key, sortDir.value)
}

// Selection
const selectedIds = ref<Set<number>>(new Set())

const allSelected = computed(() =>
  props.rows.length > 0 && selectedIds.value.size === props.rows.length
)
const someSelected = computed(() =>
  selectedIds.value.size > 0 && selectedIds.value.size < props.rows.length
)

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    props.rows.forEach((_, i) => selectedIds.value.add(i))
  }
  selectedIds.value = new Set(selectedIds.value) // trigger reactivity
  emit('selection-change', props.rows.filter((_, i) => selectedIds.value.has(i)))
}

const toggleRow = (idx: number) => {
  if (selectedIds.value.has(idx)) {
    selectedIds.value.delete(idx)
  } else {
    selectedIds.value.add(idx)
  }
  selectedIds.value = new Set(selectedIds.value)
  emit('selection-change', props.rows.filter((_, i) => selectedIds.value.has(i)))
}

const selectedRows = computed(() =>
  props.rows.filter((_, i) => selectedIds.value.has(i))
)

// Pagination
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
const from = computed(() => (props.page - 1) * props.pageSize + 1)
const to = computed(() => Math.min(props.page * props.pageSize, props.total))

// Row hover state
const hoveredRow = ref<number | null>(null)

// Cell value helper
const getCellValue = (row: Record<string, unknown>, key: string): unknown => {
  return key.split('.').reduce((obj, part) =>
    obj !== null && obj !== undefined ? (obj as Record<string, unknown>)[part] : undefined,
    row as unknown
  )
}
</script>

<template>
  <div data-testid="zima-table">
    <!-- Batch action bar -->
    <Transition name="zima-fade">
      <div
        v-if="selectable && selectedIds.size > 0"
        class="flex items-center justify-between rounded-lg px-4 mb-3"
        :style="{
          height: '44px',
          background: 'var(--zima-blue-subtle)',
          border: '1px solid var(--zima-border-active)',
        }"
      >
        <span class="text-sm font-medium" :style="{ color: 'var(--zima-blue-light)' }">
          {{ selectedIds.size }} {{ selectedIds.size === 1 ? 'selecionado' : 'selecionados' }}
        </span>
        <div class="flex items-center gap-2">
          <slot name="batch-actions" :selected="selectedRows" />
          <button
            class="text-xs transition-colors duration-[150ms]"
            :style="{ color: 'var(--zima-text-muted)' }"
            @click="selectedIds = new Set()"
          >
            Limpar seleção
          </button>
        </div>
      </div>
    </Transition>

    <!-- Table container -->
    <div
      class="w-full overflow-x-auto rounded-lg"
      :style="{
        border: '1px solid var(--zima-border-default)',
        background: 'var(--zima-bg-surface-2)',
      }"
    >
      <table class="w-full border-collapse" role="grid">
        <!-- Header -->
        <thead>
          <tr :style="{ background: 'var(--zima-table-header-bg)' }">
            <!-- Checkbox column -->
            <th
              v-if="selectable"
              class="text-left"
              :style="{
                width: '44px',
                height: 'var(--zima-table-header-height)',
                padding: '0 16px',
                borderBottom: '1px solid var(--zima-table-border)',
              }"
            >
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                class="rounded cursor-pointer"
                :style="{
                  accentColor: 'var(--zima-blue-core)',
                  width: '14px',
                  height: '14px',
                }"
                :aria-label="allSelected ? 'Desselecionar todos' : 'Selecionar todos'"
                @change="toggleSelectAll"
              />
            </th>

            <th
              v-for="col in columns"
              :key="col.key"
              :style="{
                width: col.width,
                height: 'var(--zima-table-header-height)',
                padding: '0 16px',
                textAlign: col.align || 'left',
                borderBottom: '1px solid var(--zima-table-border)',
                cursor: col.sortable ? 'pointer' : 'default',
                userSelect: col.sortable ? 'none' : 'auto',
              }"
              :aria-sort="sortKey === col.key
                ? (sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none')
                : undefined"
              @click="handleSort(col)"
            >
              <div
                class="flex items-center gap-1.5"
                :style="{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }"
              >
                <span
                  :style="{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--zima-text-muted)',
                  }"
                >
                  {{ col.label }}
                </span>
                <!-- Sort icon -->
                <span
                  v-if="col.sortable"
                  class="flex flex-col gap-0.5"
                  aria-hidden="true"
                >
                  <Icon
                    v-if="sortKey === col.key && sortDir === 'asc'"
                    name="i-lucide-chevron-up"
                    :style="{ width: '12px', height: '12px', color: 'var(--zima-blue-light)' }"
                  />
                  <Icon
                    v-else-if="sortKey === col.key && sortDir === 'desc'"
                    name="i-lucide-chevron-down"
                    :style="{ width: '12px', height: '12px', color: 'var(--zima-blue-light)' }"
                  />
                  <Icon
                    v-else
                    name="i-lucide-chevrons-up-down"
                    :style="{ width: '12px', height: '12px', color: 'var(--zima-text-disabled)' }"
                  />
                </span>
              </div>
            </th>

            <!-- Actions column slot -->
            <th
              v-if="$slots.actions"
              :style="{
                width: '80px',
                height: 'var(--zima-table-header-height)',
                padding: '0 16px',
                borderBottom: '1px solid var(--zima-table-border)',
              }"
            />
          </tr>
        </thead>

        <!-- Body -->
        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr
              v-for="i in pageSize"
              :key="`skeleton-${i}`"
              :style="{ borderBottom: '1px solid var(--zima-table-border)', height: 'var(--zima-table-row-height)' }"
            >
              <td v-if="selectable" :style="{ padding: '0 16px', width: '44px' }">
                <div class="rounded" :style="{ width: '14px', height: '14px', background: 'var(--zima-skeleton-base)', animation: 'zima-shimmer 1.5s infinite linear', backgroundSize: '800px 100%', backgroundImage: 'linear-gradient(90deg, var(--zima-skeleton-base) 25%, var(--zima-skeleton-shine) 50%, var(--zima-skeleton-base) 75%)' }" />
              </td>
              <td
                v-for="col in columns"
                :key="col.key"
                :style="{ padding: '0 16px' }"
              >
                <div
                  class="rounded"
                  :style="{
                    height: '14px',
                    width: `${Math.random() * 30 + 50}%`,
                    background: 'var(--zima-skeleton-base)',
                    animation: 'zima-shimmer 1.5s infinite linear',
                    backgroundSize: '800px 100%',
                    backgroundImage: 'linear-gradient(90deg, var(--zima-skeleton-base) 25%, var(--zima-skeleton-shine) 50%, var(--zima-skeleton-base) 75%)',
                  }"
                />
              </td>
            </tr>
          </template>

          <!-- Error state -->
          <tr v-else-if="error">
            <td :colspan="columns.length + (selectable ? 1 : 0) + ($slots.actions ? 1 : 0)">
              <div class="flex flex-col items-center justify-center py-12 gap-3">
                <Icon
                  name="i-lucide-server-crash"
                  :style="{ width: '48px', height: '48px', color: 'var(--zima-danger)', opacity: '0.5' }"
                  aria-hidden="true"
                />
                <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-secondary)' }">
                  {{ error }}
                </p>
                <button
                  class="text-sm transition-colors duration-[150ms]"
                  :style="{ color: 'var(--zima-blue-light)' }"
                  @click="emit('retry')"
                >
                  Tentar novamente
                </button>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length + (selectable ? 1 : 0) + ($slots.actions ? 1 : 0)">
              <div class="flex flex-col items-center justify-center py-12 gap-3">
                <div
                  class="flex items-center justify-center rounded-xl"
                  :style="{
                    width: '56px',
                    height: '56px',
                    background: 'var(--zima-bg-surface-hover)',
                  }"
                >
                  <Icon
                    :name="emptyIcon"
                    :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)' }"
                    aria-hidden="true"
                  />
                </div>
                <div class="text-center">
                  <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
                    {{ emptyTitle }}
                  </p>
                  <p class="text-xs mt-1" :style="{ color: 'var(--zima-text-muted)' }">
                    {{ emptyDescription }}
                  </p>
                </div>
                <slot name="empty-action" />
              </div>
            </td>
          </tr>

          <!-- Data rows -->
          <template v-else>
            <tr
              v-for="(row, idx) in rows"
              :key="idx"
              :style="{
                height: 'var(--zima-table-row-height)',
                background: selectedIds.has(idx)
                  ? 'var(--zima-table-row-selected)'
                  : hoveredRow === idx
                    ? 'var(--zima-table-row-hover)'
                    : '',
                borderBottom: '1px solid var(--zima-table-border)',
                cursor: rowClickable ? 'pointer' : 'default',
                transition: 'background 100ms ease',
              }"
              :aria-selected="selectable ? selectedIds.has(idx) : undefined"
              @mouseenter="hoveredRow = idx"
              @mouseleave="hoveredRow = null"
              @click="rowClickable && emit('row-click', row, idx)"
            >
              <!-- Checkbox -->
              <td
                v-if="selectable"
                :style="{ padding: '0 16px', width: '44px' }"
                @click.stop="toggleRow(idx)"
              >
                <input
                  type="checkbox"
                  :checked="selectedIds.has(idx)"
                  class="rounded cursor-pointer"
                  :style="{
                    accentColor: 'var(--zima-blue-core)',
                    width: '14px',
                    height: '14px',
                  }"
                  :aria-label="`Selecionar linha ${idx + 1}`"
                  @change="toggleRow(idx)"
                />
              </td>

              <!-- Data cells -->
              <td
                v-for="col in columns"
                :key="col.key"
                :style="{
                  padding: '0 16px',
                  fontSize: '14px',
                  color: 'var(--zima-text-primary)',
                  textAlign: col.align || 'left',
                }"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="getCellValue(row, col.key)" :idx="idx">
                  {{ getCellValue(row, col.key) }}
                </slot>
              </td>

              <!-- Actions cell -->
              <td
                v-if="$slots.actions"
                :style="{
                  padding: '0 16px',
                  opacity: hoveredRow === idx ? '1' : '0',
                  transition: 'opacity 100ms ease',
                  textAlign: 'right',
                }"
                @click.stop
              >
                <slot name="actions" :row="row" :idx="idx" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="total > 0 && !loading"
      class="flex items-center justify-between mt-4"
    >
      <!-- Info -->
      <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
        Mostrando {{ from }}–{{ to }} de {{ total.toLocaleString('pt-BR') }}
      </span>

      <!-- Page size selector + Nav -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Por página:</span>
          <select
            :value="pageSize"
            class="text-xs rounded-md px-2 py-1 outline-none cursor-pointer transition-all duration-[150ms]"
            :style="{
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              color: 'var(--zima-text-secondary)',
              height: '28px',
            }"
            :aria-label="'Itens por página'"
            @change="emit('page-size-change', Number(($event.target as HTMLSelectElement).value))"
          >
            <option
              v-for="opt in pageSizeOptions"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>
        </div>

        <!-- Prev / Next -->
        <div class="flex items-center gap-1">
          <button
            :disabled="page <= 1"
            class="flex items-center justify-center rounded-md transition-all duration-[150ms] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            :style="{
              width: '28px',
              height: '28px',
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              color: 'var(--zima-text-secondary)',
            }"
            aria-label="Página anterior"
            @click="emit('page-change', page - 1)"
          >
            <Icon name="i-lucide-chevron-left" style="width: 14px; height: 14px;" aria-hidden="true" />
          </button>

          <span
            class="flex items-center justify-center rounded-md text-xs"
            :style="{
              width: '28px',
              height: '28px',
              background: 'var(--zima-blue-subtle)',
              color: 'var(--zima-blue-light)',
              fontWeight: '600',
            }"
          >
            {{ page }}
          </span>

          <button
            :disabled="page >= totalPages"
            class="flex items-center justify-center rounded-md transition-all duration-[150ms] focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            :style="{
              width: '28px',
              height: '28px',
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              color: 'var(--zima-text-secondary)',
            }"
            aria-label="Próxima página"
            @click="emit('page-change', page + 1)"
          >
            <Icon name="i-lucide-chevron-right" style="width: 14px; height: 14px;" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.zima-fade-enter-active, .zima-fade-leave-active {
  transition: opacity 150ms ease;
}
.zima-fade-enter-from, .zima-fade-leave-to {
  opacity: 0;
}
</style>
