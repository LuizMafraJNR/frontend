# Tela 05 — Equipe

**Rota:** `/saas/equipe` (lista) · `/saas/equipe/[id]` (detalhe)
**Arquivos:** `layers/saas/pages/saas/equipe/index.vue`, `[id].vue`
**Composables:** `useProfessionals()`, `useServices()`, `useZimaToast()`

## Visão Geral

Gerenciador de equipe/profissionais. Exibe cards com estatísticas de cada profissional (agendamentos, receita do mês). Permite criar, editar e gerenciar horários e bloqueios.

## Layout

Card grid (3 colunas) — cada card exibe:
- Avatar com status (online/offline)
- Nome e função
- Agendamentos do mês
- Receita do mês (formatada em BRL)
- Serviços habilitados (chips)
- Menu de ações (editar, ver agenda, desativar)

## Componentes-chave

- Grid de cards customizados (não ZimaTable)
- `ZimaModal` `ModalProfissional.vue` — criar/editar profissional
- `ZimaAvatar` com status dot
- `ZimaBadge` — status (ativo/inativo/férias)

## Tipos

```typescript
interface Professional {
  id: string
  name: string
  avatar?: string
  role: string                // ex: 'Cabeleireira Sênior'
  services: string[]          // IDs dos serviços que executa
  commissionRate: number      // percentual ex: 40
  status: 'active' | 'inactive' | 'vacation'
  phone: string
  email: string
  joinedAt: string            // ISO date
  appointmentsThisMonth: number
  revenueThisMonth: number
}

interface WorkSchedule {
  professionalId: string
  days: Array<{
    day: number               // 0=Dom, 1=Seg, ..., 6=Sáb
    active: boolean
    startTime: string         // 'HH:MM'
    endTime: string           // 'HH:MM'
  }>
}

interface Blockout {
  id: string
  professionalId: string
  startDate: string
  endDate: string
  reason: string
}
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega profissionais, schedules e blockouts mock |
| `createProfessional(data)` | Adiciona profissional |
| `updateProfessional(id, data)` | Atualiza dados |
| `updateSchedule(schedule)` | Salva horários de trabalho |
| `addBlockout(blockout)` | Adiciona bloqueio de período |
| `professionals` | `ref<Professional[]>` singleton |

## Mock Data

- 4 profissionais: Ana Costa (Cabeleireira Sênior), Carlos Lima (Barbeiro), Julia Rocha (Esteticista), + 1 adicional
- Cada um com schedule semanal e estatísticas do mês atual

## Tela de Detalhe (`[id].vue`)

Exibe perfil completo: dados pessoais, horário de trabalho editável (grade de dias/horas), histórico de agendamentos e comissões do mês.
