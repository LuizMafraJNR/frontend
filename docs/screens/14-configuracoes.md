# Tela 14 — Configurações

**Rota:** `/saas/configuracoes`
**Arquivo:** `layers/saas/pages/saas/configuracoes.vue`
**Composables:** `useZimaToast()`

## Visão Geral

Painel de configurações do estabelecimento. Edição in-place com botão "Salvar" por seção. Sem modais — toda edição acontece diretamente na página.

## Seções

| Seção | Campos |
|-------|--------|
| **Negócio** | Nome fantasia, Razão Social, CNPJ, Tipo (MEI/ME/EPP), Telefone, Email, Site, Endereço completo, Upload de logo |
| **Horário de Funcionamento** | Grade semanal: dia ativo (toggle) + hora abertura + hora fechamento |
| **Permissões e Usuários** | Lista de usuários do sistema com perfis (Proprietário / Gerente / Atendente) |
| **Notificações** | Toggles: confirmação de agendamento, lembrete 24h, lembrete 2h, avaliação pós-serviço, estoque baixo |
| **Integrações** | Cards de integração: WhatsApp Business API, Google Calendar, Sistema de pagamento, Marketplace |
| **Plano e Assinatura** | Plano atual, próximo vencimento, histórico de faturas, botão "Fazer upgrade" |

## Dados Reativos

```typescript
// Estado local da tela (não usa composable próprio)
const business = reactive({
  name: 'Studio Beleza Cuidados',
  razaoSocial: 'Studio Beleza Cuidados LTDA ME',
  cnpj: '12.345.678/0001-90',
  type: 'MEI',
  phone: '(11) 99999-0000',
  email: 'contato@studiocuidados.com.br',
  website: '',
  address: {
    street: 'Rua das Flores, 123',
    complement: 'Sala 4',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  },
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
})

const schedule = reactive({ /* dias 0-6 com active, startTime, endTime */ })

const notifications = reactive({
  appointmentConfirmation: true,
  reminder24h: true,
  reminder2h: true,
  postServiceReview: true,
  lowStockAlert: true,
})
```

## Subrota de Perfil

`/saas/configuracoes/perfil` — perfil do usuário logado (nome, email, senha, avatar). Acessível via menu de usuário no `ZimaTopBar`.

## Padrão de Salvar

Cada seção tem botão "Salvar" independente com loading state:

```typescript
async function saveSection(section: string) {
  saving[section] = true
  await new Promise(r => setTimeout(r, 600))  // mock
  saving[section] = false
  toast.success('Configurações salvas')
}
```
