import type { ZimaToastItem } from '../components/zima/ZimaToast.vue'

let _counter = 0

/**
 * Composable de toasts para o Design System Zima Blue.
 *
 * @example
 * const toast = useZimaToast()
 * toast.success('Salvo com sucesso!')
 * toast.error('Algo deu errado', 'Tente novamente')
 */
export const useZimaToast = () => {
  const toasts = useState<ZimaToastItem[]>('zima:toasts', () => [])

  const add = (item: Omit<ZimaToastItem, 'id'>) => {
    const id = `toast-${++_counter}`
    const duration = item.duration ?? (item.type === 'danger' ? 0 : 4000)

    toasts.value.push({ ...item, id, duration })

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }

    return id
  }

  const dismiss = (id: string) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const success = (title: string, description?: string) =>
    add({ type: 'success', title, description })

  const error = (title: string, description?: string) =>
    add({ type: 'danger', title, description, duration: 0 })

  const warning = (title: string, description?: string) =>
    add({ type: 'warning', title, description })

  const info = (title: string, description?: string) =>
    add({ type: 'info', title, description })

  return { toasts, add, dismiss, success, error, warning, info }
}
