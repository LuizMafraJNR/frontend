/**
 * useNotifications — centro de notificações do SaaS (sino da topbar).
 *
 * Singleton persistido que escuta o barramento de eventos de domínio
 * (useDomainEvents) e materializa notificações reais: venda registrada, estoque
 * baixo, conta vencendo, campanha concluída, agendamento criado.
 *
 * Registro do listener: feito UMA vez, em escopo de módulo, guardado por
 * `import.meta.client` + flag booleana — o mesmo idioma de `resizeListenerAttached`
 * em useSaasLayout.ts. Não registrar em onMounted (duplicaria por componente,
 * morreria no unmount e perderia eventos quando nenhuma tela ouvinte estivesse
 * montada). O guard de cliente também evita registro no servidor, onde o
 * useEventBus é um mapa global e vazaria listeners entre requisições SSR.
 */

export interface AppNotification {
  id: string
  title: string
  description?: string
  createdAt: string // ISO — `time` (relativo) é derivado disto
  read: boolean
  type: 'info' | 'success' | 'warning' | 'danger'
  to?: string
}

const MAX_NOTIFICATIONS = 50

// Seed de demonstração — algumas notificações iniciais para a topbar não nascer vazia.
const seedNotifications = (): AppNotification[] => {
  const now = Date.now()
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString()
  return [
    { id: 'seed-1', title: 'Novo agendamento confirmado', description: 'Maria Silva — Corte + Escova hoje às 15h', createdAt: iso(5), read: false, type: 'success', to: '/saas/agenda' },
    { id: 'seed-2', title: 'Estoque baixo', description: 'Máscara Kerastase: 3 unidades (mínimo 5)', createdAt: iso(23), read: false, type: 'warning', to: '/saas/estoque?tab=alertas' },
    { id: 'seed-3', title: 'Pagamento recebido via Pix', description: 'R$ 245,00 — Ana Costa', createdAt: iso(120), read: true, type: 'success', to: '/saas/financeiro' },
  ]
}

const notifications = persistedRef<AppNotification[]>('notifications:list', seedNotifications)

// "Tick" para recalcular tempos relativos (há X min) sem recarregar.
const nowTick = ref(Date.now())

let listenersAttached = false

/** Converte um ISO em rótulo relativo pt-BR ("agora", "há 5 min", "há 2 h", "ontem"). */
function relativeTime(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ontem'
  return `há ${d} dias`
}

export const useNotifications = () => {
  const events = useDomainEvents()

  function push(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string }): void {
    notifications.value.unshift({
      id: n.id ?? `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false,
      title: n.title,
      description: n.description,
      type: n.type,
      to: n.to,
    })
    if (notifications.value.length > MAX_NOTIFICATIONS) {
      notifications.value.splice(MAX_NOTIFICATIONS)
    }
  }

  // Notificações com `time` (relativo) já derivado — formato que a ZimaTopBar consome.
  const items = computed(() =>
    notifications.value.map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      time: relativeTime(n.createdAt, nowTick.value),
      read: n.read,
      type: n.type,
      to: n.to,
    })),
  )

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  function markRead(id: string): void {
    const n = notifications.value.find(x => x.id === id)
    if (n) n.read = true
  }

  function markAllRead(): void {
    notifications.value.forEach(n => { n.read = true })
  }

  function clearAll(): void {
    notifications.value = []
  }

  // ── Registro único dos listeners de domínio (client-only) ──────────────────
  if (import.meta.client && !listenersAttached) {
    listenersAttached = true

    events.on('sale:completed', p => {
      push({
        title: 'Venda registrada',
        description: `${p.paymentLabel} — ${p.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${p.customerName ? ` · ${p.customerName}` : ''}`,
        type: 'success',
        to: '/saas/caixa?view=historico',
      })
    })

    events.on('stock:low', p => {
      push({
        title: p.outOfStock ? 'Produto sem estoque' : 'Estoque baixo',
        description: p.outOfStock
          ? `${p.productName} zerou o estoque`
          : `${p.productName}: ${p.stock} ${p.stock === 1 ? 'unidade' : 'unidades'} (mínimo ${p.minStock})`,
        type: p.outOfStock ? 'danger' : 'warning',
        to: '/saas/estoque?tab=alertas',
      })
    })

    events.on('appointment:statusChanged', p => {
      if (p.to === 'CONFIRMED') {
        push({
          title: 'Agendamento confirmado',
          description: `${p.clientName} — ${p.serviceName}`,
          type: 'success',
          to: '/saas/agenda',
        })
      }
    })

    events.on('campaign:converted', p => {
      push({
        title: 'Conversão de campanha',
        description: `"${p.campaignName}" gerou ${p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        type: 'success',
        to: '/saas/campanhas',
      })
    })

    // Atualiza os tempos relativos a cada 60s.
    setInterval(() => { nowTick.value = Date.now() }, 60_000)
  }

  return { notifications, items, unreadCount, push, markRead, markAllRead, clearAll }
}
