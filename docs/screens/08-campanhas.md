# Tela 08 — Campanhas

**Rota:** `/saas/campanhas` · `/saas/campanhas/[id]` (detalhe/editor)
**Arquivos:** `layers/saas/pages/saas/campanhas.vue`, `campanhas/[id].vue`
**Composable principal:** `useCampaigns()` — `layers/saas/composables/useCampaigns.ts`

## Visão Geral

Gerenciador de campanhas de marketing multi-canal (WhatsApp, Instagram, Email). Permite criar campanhas com segmentação de audiência, agendar disparos e monitorar métricas de entrega e conversão.

## Tabs (sincronizadas com query param `?tab=`)

| Tab | Status das campanhas exibidas |
|-----|------------------------------|
| `ativas` | `sending` (em andamento) |
| `rascunhos` | `draft` |
| `enviadas` | `sent` |
| `agendadas` | `scheduled` |

## Tipos

```typescript
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
type CampaignChannel = 'whatsapp' | 'instagram' | 'email'
type CampaignType = 'promotional' | 'reactivation' | 'birthday' | 'launch' | 'informational'

interface SegmentRule {
  field: string           // ex: 'last_visit', 'total_spent', 'status'
  operator: string        // 'gt', 'lt', 'eq', 'contains'
  value: string | number
}

interface Campaign {
  id: string
  name: string
  type: CampaignType
  channel: CampaignChannel
  status: CampaignStatus
  audienceSize: number
  scheduledAt?: string
  sentAt?: string
  message: string         // corpo da mensagem (template)
  subject?: string        // assunto (email)
  imageUrl?: string
  couponCode?: string
  segmentRules: SegmentRule[]
  allClients: boolean     // dispara para toda a base
  metrics: {
    sent: number
    delivered: number
    read: number
    replied: number
    converted: number
  }
  createdAt: string
}
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega campanhas mock |
| `createCampaign(data)` | Cria nova campanha como rascunho |
| `updateCampaign(id, data)` | Atualiza dados da campanha |
| `duplicateCampaign(id)` | Clona campanha como novo rascunho |
| `cancelCampaign(id)` | Cancela campanha agendada/enviando |
| `sendNow(id)` | Dispara campanha imediatamente (mock com setTimeout) |

## Componentes-chave

- `ZimaTable` — colunas: nome, canal (ícone), audiência, status, agendado/enviado, métricas resumidas, ações
- `ZimaPhonePreview` — preview da mensagem em tempo real no editor
- Cards de métricas na tela de detalhe (enviadas, entregues, lidas, convertidas)

## Mock Data

- 3+ campanhas:
  1. "Promoção de Abril — Coloração" (WhatsApp, 47 destinatários, sent)
  2. "Reativação — Clientes inativos" (WhatsApp, 23 destinatários, draft)
  3. "Aniversariantes de Abril" (WhatsApp, scheduled)

## Tela de Detalhe/Editor (`[id].vue`)

Editor completo da campanha com:
- Campo de mensagem com variáveis dinâmicas (`{{nome}}`, `{{data}}`)
- Seletor de canal e tipo
- Construtor de segmentação (regras visuais)
- Preview ao vivo via `ZimaPhonePreview`
- Seletor de data/hora para agendamento
