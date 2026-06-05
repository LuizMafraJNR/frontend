/**
 * useDomainEvents — barramento de eventos de domínio do SaaS.
 *
 * Desacopla os módulos: quem dispara uma ação (ex.: PDV finaliza venda) emite
 * um evento; quem reage (ex.: centro de notificações, estoque) escuta — sem que
 * os composables precisem se importar mutuamente. Construído sobre o
 * `useEventBus` do VueUse (auto-importado), que já é SSR-safe.
 *
 * Uso:
 *   const events = useDomainEvents()
 *   events.emit('sale:completed', payload)        // disparar
 *   events.on('sale:completed', p => { ... })     // escutar (lembre de off no unmount)
 */
import { useEventBus } from '@vueuse/core'
import type { EventBusListener } from '@vueuse/core'

// ── Payloads tipados ────────────────────────────────────────────────────────────

export interface SaleCompletedPayload {
  saleId: string
  total: number
  customerId?: string
  customerName?: string
  professionalId?: string
  professionalName?: string
  paymentLabel: string
  items: { name: string; qty: number; price: number; type: 'service' | 'product'; productId?: string; serviceId?: string }[]
  couponCode?: string
}

export interface AppointmentStatusPayload {
  appointmentId: string
  clientName: string
  serviceName: string
  professionalName?: string
  from: string
  to: string
}

export interface AppointmentCompletedPayload {
  appointmentId: string
  clientId?: string
  clientName: string
  serviceName: string
  professionalId?: string
  professionalName?: string
  price: number
}

export interface StockLowPayload {
  productId: string
  productName: string
  stock: number
  minStock: number
  outOfStock: boolean
}

export interface CampaignConvertedPayload {
  campaignId: string
  campaignName: string
  saleId: string
  amount: number
}

/** Mapa nome-do-evento → payload. Mantém emit/on type-safe. */
export interface DomainEventMap {
  'sale:completed': SaleCompletedPayload
  'appointment:statusChanged': AppointmentStatusPayload
  'appointment:completed': AppointmentCompletedPayload
  'stock:low': StockLowPayload
  'campaign:converted': CampaignConvertedPayload
}

export type DomainEventName = keyof DomainEventMap

// ── Composable ──────────────────────────────────────────────────────────────────

export const useDomainEvents = () => {
  function emit<K extends DomainEventName>(event: K, payload: DomainEventMap[K]): void {
    useEventBus<DomainEventMap[K]>(event).emit(payload)
  }

  /**
   * Registra um listener. Retorna a função de cleanup (off) — chame no onUnmounted
   * se registrar dentro de um componente. Listeners registrados no escopo de
   * módulo (singletons como useNotifications) vivem pela sessão e dispensam off.
   */
  function on<K extends DomainEventName>(
    event: K,
    handler: EventBusListener<DomainEventMap[K]>,
  ): () => void {
    return useEventBus<DomainEventMap[K]>(event).on(handler)
  }

  return { emit, on }
}
