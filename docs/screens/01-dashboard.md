# Tela 01 — Dashboard

**Rota:** `/saas`
**Arquivo:** `layers/saas/pages/saas/index.vue`
**Composable principal:** `useAppointments()` — `layers/saas/composables/useAppointments.ts`

## Visão Geral

Painel principal do SaaS. Exibe os agendamentos do dia (ou período selecionado), KPIs de operação e atalhos rápidos para as principais funcionalidades.

## Seções

| Seção | Conteúdo |
|-------|---------|
| Header | Saudação + data atual + botão "Novo Agendamento" |
| Filtro de período | Hoje / 7 dias / 30 dias / Mês atual / Personalizado |
| Lista de agendamentos | ZimaTable com agendamentos do período filtrado e não-cancelados |
| Drawer de detalhes | Slide-in ao clicar em um agendamento — histórico de status, dados do cliente, serviço |

## Componentes-chave

- `ZimaTable` — colunas: horário, cliente, serviço, profissional, status, ações
- `ZimaDrawer` (`DrawerDetalheAgendamento.vue`) — detalhes completos do agendamento
- `ZimaBadge` — status coloridos com `STATUS_STYLE`

## Composable — Tipos Exportados

```typescript
type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientVisits: number
  clientSince: string
  serviceId: string
  serviceName: string
  serviceDuration: number      // minutos
  professionalId: string
  professionalName: string
  professionalRole: string
  date: string                 // 'YYYY-MM-DD'
  startTime: string            // 'HH:MM'
  endTime: string              // 'HH:MM'
  price: number
  status: AppointmentStatus
  notes?: string
  internalNotes?: string
  cancelReason?: string
  statusHistory: AppointmentStatusEvent[]
}

// Mapa de estilos por status (exportado como STATUS_STYLE)
const STATUS_STYLE: Record<AppointmentStatus, { bg, border, label, variant }>
```

## Composable — Funções Exportadas

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega agendamentos mock (setTimeout 400ms), evita double-fetch |
| `updateStatus(id, status)` | Atualiza status + adiciona entrada no statusHistory |
| `reschedule(id, date, startTime)` | Remarca agendamento para nova data/hora |
| `cancel(id, reason)` | Cancela com motivo |
| `appointments` | `ref<Appointment[]>` singleton |

## Mock Data

- ~15 agendamentos distribuídos entre hoje, ontem, próximos 7 dias
- Status variados: PENDING, CONFIRMED, COMPLETED, CANCELLED
- 3 profissionais distintos, 3 clientes distintos
- Função `buildAppointments()` gera datas relativas ao dia atual

## Bridge com Command Palette

O modal de Novo Agendamento é acionado via `useState<boolean>('saas:modal:newAppointment')` — compartilhado com o `ZimaCommandPalette` no layout.

```typescript
// No layout saas.vue
{ id: 'a-novo-agend', action: () => { const s = useState('saas:modal:newAppointment', () => false); s.value = true } }
```
