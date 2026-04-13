# Tela 06 — Inbox

**Rota:** `/saas/inbox`
**Arquivo:** `layers/saas/pages/saas/inbox.vue`
**Composables:** `useInbox()`, `useAppointments()`, `useZimaToast()`

## Visão Geral

Central de mensagens multi-canal (WhatsApp, Instagram, Webchat) com IA integrada. Conversas fluem entre o agente de IA e atendimento humano. Permite assumir conversas, responder, resolver e criar agendamentos diretamente do inbox.

## Layout

Layout de 2 painéis fixos:
- **Esquerda (320px):** Lista de conversas com busca e filtro por status
- **Direita:** Área de chat com histórico de mensagens, input de resposta, perfil do cliente (colapsável)

## Tabs de filtro (esquerda)

| Status | Significado |
|--------|-------------|
| `AI` | Sendo atendida pelo agente de IA |
| `WAITING` | Aguardando atendimento humano (transferida da IA) |
| `HUMAN` | Assumida por atendente humano |
| `RESOLVED` | Encerrada |

## Canais suportados

`whatsapp` · `instagram` · `webchat` — com ícone e cor distintos.

## Tipos

```typescript
type ConversationStatus = 'AI' | 'HUMAN' | 'WAITING' | 'RESOLVED'
type MessageChannel = 'whatsapp' | 'instagram' | 'webchat'
type MessageSender = 'client' | 'human' | 'ai' | 'system'

interface InboxMessage {
  id: string
  conversationId: string
  sender: MessageSender
  senderName?: string
  type: 'text' | 'image' | 'audio' | 'document' | 'system' | 'internal_note'
  text?: string
  mediaUrl?: string
  mediaName?: string
  mediaSize?: string
  timestamp: string
  read: boolean
  deliveryStatus?: 'sent' | 'delivered' | 'read'
  replyTo?: string   // id da mensagem citada
}

interface Conversation {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientSince: string
  clientVisits: number
  clientTotalSpent: number
  clientTags: string[]
  channel: MessageChannel
  status: ConversationStatus
  unreadCount: number
  lastMessage: string
  lastMessageType: string
  lastMessageAt: string
  attendantId?: string
  attendantName?: string
  messages: InboxMessage[]
}
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega conversas e mensagens mock |
| `sendMessage(conversationId, text)` | Envia mensagem como humano |
| `assumeConversation(id)` | Muda status de WAITING → HUMAN |
| `returnToAI(id)` | Muda status de HUMAN → AI |
| `resolveConversation(id)` | Muda status para RESOLVED |
| `markAsRead(id)` | Zera `unreadCount` |
| `totalUnread` | `computed` — soma de unreadCount de todas as conversas |
| `waitingCount` | `computed` — conversas com status WAITING |

## Modais

| Modal | Gatilho | Conteúdo |
|-------|---------|---------|
| `ModalNovaConversa.vue` | Botão "+ Nova Conversa" | Seleciona cliente + canal para iniciar conversa |
| `ModalNovoAgendamento.vue` | Botão "Agendar" no painel do cliente | Cria agendamento vinculado ao cliente da conversa |

## Mock Data

- 3 conversas completas com histórico de mensagens:
  1. Maria Silva via WhatsApp — agendamento via IA (12 mensagens, fluxo AI → Human)
  2. João Mendes via WhatsApp — consulta de preços (4 mensagens, em WAITING)
  3. Beatriz Souza via Instagram — consulta de serviços (6+ mensagens, RESOLVED)

## Helpers de Formatação

A tela define funções locais de formatação de tempo:
```typescript
function relativeTime(timestamp: string): string   // 'há 5 min', 'há 2h', 'Ontem'
function formatTime(timestamp: string): string      // 'HH:MM'
function isSameDay(a: string, b: string): boolean
function formatDayLabel(timestamp: string): string  // 'Hoje', 'Ontem', 'DD/MM'
```
