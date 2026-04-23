# Tela 02 — Agenda

**Rota:** `/saas/agenda`
**Arquivo:** `layers/saas/pages/saas/agenda.vue`
**Composables:** `useAppointments()`, `useProfessionals()`, `useZimaToast()`

## Visão Geral

Gerenciador completo de agendamentos com múltiplas visualizações (dia, semana, lista). Permite criar, reagendar, atualizar status e cancelar agendamentos. Suporta filtragem por profissional.

## Modos de Visualização

| Modo | Conteúdo |
|------|---------|
| `day` | Timeline hora a hora do dia selecionado, uma coluna por profissional |
| `week` | Grade semanal compacta com agendamentos por dia |
| `list` | ZimaTable com todos os agendamentos ordenados por data/hora |

## Componentes-chave

- `ZimaTable` (modo list) — colunas: data, hora, cliente, serviço, profissional, duração, valor, status, ações
- `ZimaDrawer` — detalhes do agendamento, histórico de status, ações (confirmar, iniciar, concluir, cancelar)
- `ZimaModal` `ModalNovoAgendamento.vue` — criação de novo agendamento (cliente + serviço + profissional + data/hora)
- `ZimaBadge` — status com cores do `STATUS_STYLE`

## Filtros

- Seletor de profissional (chips, múltipla seleção)
- Navegação de data (anterior / hoje / próximo, ou calendário)
- Busca por nome de cliente (modo list)

## Modais e Drawers

| Componente | Gatilho | Conteúdo |
|-----------|---------|---------|
| `DrawerDetalheAgendamento.vue` | Click na linha da tabela ou no evento da timeline | Todos os dados do agendamento + histórico de status + botões de ação |
| `ModalNovoAgendamento.vue` | Botão "+ Novo Agendamento" ou Command Palette | Formulário: cliente (autocomplete), serviço, profissional, data, hora |

## Bridge com Command Palette

```typescript
// O modal é acionado de qualquer lugar via useState global
const modalOpen = useState<boolean>('saas:modal:newAppointment', () => false)
watch(modalOpen, v => { if (v) { novoAgendamentoOpen.value = true; modalOpen.value = false } })
```

## Fluxo de Status

```
PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
                                ↘ CANCELLED (qualquer estado)
```

Cada transição adiciona entrada no `statusHistory` com timestamp e label.

## Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| `< sm` (640px) | Filtros do modo Lista empilham verticalmente; larguras fixas removidas, campos ficam full-width |
| `< sm` (640px) | Tabela (modo List) oculta coluna `Profissional` — `listColumns` é `computed` filtrado por `isMobile` |
| `< sm` (640px) | Paginação empilha verticalmente (contagem acima, controles abaixo) |

As colunas visíveis em mobile são: **Horário · Cliente · Serviço · Valor · Status**.
