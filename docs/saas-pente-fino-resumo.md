# Pente Fino do `/saas` — Resumo por Tela e Fluxo

> Resultado do trabalho de transformar o `/saas` de "telas de cadastro desconectadas"
> em um **sistema vivo e integrado** (tudo mockado, mas funcionalmente conectado e
> persistente). Use este documento como guia de revisão.

## Como ler os rótulos de verificação

- **logic-tested** — a lógica de negócio tem teste automatizado (Vitest). Pode confiar.
- **spec-confirmed** — auditado contra `docs/screens/*` e confirmado que muta + persiste;
  sem teste dedicado, mas verificado manualmente no código.
- **SSR-only** — renderiza sem erro (HTTP 200) e está ligado, mas o comportamento
  end-to-end não foi exercido em navegador (a extensão Chrome não estava disponível
  nesta sessão). **Comece sua revisão clicando nestes.**

Estado geral: **50 testes passando (8 arquivos)**, **14/14 telas SSR 200**, **typecheck limpo**.

---

## Backbone (Fase 0) — a espinha dorsal

| Item | O que faz | Verificação |
|---|---|---|
| Persistência (`useMockPersistence`) | Todos os dados de domínio persistem no localStorage; hidratação deferida pós-mount (sem mismatch SSR) | **logic-tested** (8 testes: lê/grava/reload/reset) |
| Event bus (`useDomainEvents`) | Desacopla efeitos efêmeros (notificações) das mutações | logic-tested (via testes de integração) |
| Centro de notificações (`useNotifications`) | Sino da topbar alimentado por eventos reais; badge unread no Inbox da sidebar | SSR-only |
| Reset de demonstração | Botão em Configurações restaura o seed | spec-confirmed |

---

## Fluxos cruzados (o que prova que não é CRUD)

| Fluxo | Verificação | Onde clicar para ver |
|---|---|---|
| **Venda no PDV → Financeiro + Estoque + Comissão + Notificação** | **logic-tested** (`useSaleCommit.test.ts` — o handler usa o mesmo código testado) | `/saas/caixa` → finalizar → ver `/saas/financeiro` (receita), `/saas/estoque` (baixa+movimento), aba Comissões |
| **Cupom no PDV → conversão de campanha** | **logic-tested** (`useCampaigns.test.ts`) | PDV → digitar `ABRIL20` → finalizar → ver `metrics.converted` em `/saas/campanhas` |
| **Recebível/Pagável → transação no Financeiro** | **logic-tested** (`useFinancial.test.ts`) | `/saas/financeiro` abas Receber/Pagar → marcar recebido/pago |
| **Agenda "Iniciar atendimento" → PDV pré-preenchido** | SSR-only | `/saas/agenda` → menu de um agendamento CHECKED_IN → "Iniciar atendimento" |
| **Confirmar agendamento → notificação** | logic-tested (emitter) / SSR-only (UI) | `/saas/agenda` ou Inbox → Confirmar |
| **Estorno de venda → reverte transação + estoque + comissão** | **logic-tested** (`useSaleCommit.test.ts` — `reverseSale`, espelho simétrico do `commitSale`) | `/saas/caixa` → Histórico → Estornar |

---

## Telas (Fase 1)

| # | Tela | Principais correções/adições | Verificação |
|---|------|------|---|
| 01 | Dashboard | Período recorta de verdade (não só loading); KPIs derivados dos dados reais; sparklines reais | **logic-tested** (`useDateRange.test.ts`) + SSR |
| 02 | Agenda | Fluxo de status com evento; Agenda→PDV; **cancelar com motivo obrigatório** (modal); filtro por profissional via query | SSR-only |
| 03 | Clientes | Export CSV real; **tag em lote** (modal); status **derivado** por regra (VIP/NEW/INACTIVE/ACTIVE); exclusão via ZimaModal (não `confirm()`) | **logic-tested** (`useCustomers.test.ts`) |
| 04 | Serviços | Já completo (drag-drop, toggle, CRUD) | spec-confirmed |
| 05 | Equipe | Busca + filtro + ordenação; **menu 3-dot** (Editar→detalhe, Ver agenda, Ativar/Desativar) | SSR-only |
| 06 | Inbox | Anexos (file/templates), reagendar, confirmar agendamento; **notas internas e tags persistem por conversa** | SSR-only |
| 07 | IA & Automação | Save do agente persiste (via persistedRef) | spec-confirmed |
| 08 | Campanhas | **Duplicar**; exclusão com confirmação; conversão por cupom | logic-tested (cupom) + SSR |
| 09 | Financeiro | Receber/Pagar criam transação; comissão simétrica; **`monthlyData` derivado das transações (DRE/gráficos vivos)** | **logic-tested** (`useFinancial.test.ts`) |
| 10 | Caixa / PDV | Estorno simétrico; novo cliente inline; produtos vêm do Estoque real; **profissional obrigatório p/ comissão** | **logic-tested** (`useSaleCommit.test.ts`) |
| 11 | Estoque | Upload de foto (preview); aba Alertas derivada de `stock ≤ minStock`; ajuste persiste | spec-confirmed |
| 12 | Notas Fiscais | Upload de certificado (preview); emitir incrementa nº; cancelar exige motivo | spec-confirmed |
| 13 | Relatórios | Export via util compartilhado `useCsvExport` | spec-confirmed (período do mock é ilustrativo) |
| 14 | Configurações | Editar função (modal); planos (modal); **resetar dados**; integrações conectar/desconectar | SSR-only |

## Features de alto valor (Fase 2)

| Feature | Onde | O que faz | Verificação |
|---|---|---|---|
| **CRM: LTV + churn + win-back** | Clientes | Painel com LTV médio, base ativa e clientes em risco. Botão **"Reativar"** cria uma campanha de reativação pré-segmentada (rascunho real em Campanhas) — fecha o loop: insight → campanha → cupom → conversão | Math **logic-tested** (`useCustomerInsights.test.ts`); ação `createWinbackCampaign` é SSR-only (chama `addCampaign`, que é testado) |
| **Automações executáveis** | IA & Automação | Cada automação ativa tem **"Executar agora"** — dispara o efeito uma vez (notificação real na topbar). Honesto: não finge cron, prova a fiação | SSR-only |
| **Fluxo de caixa previsional** | Financeiro (Overview) | Projeção de saldo 30/60/90 dias a partir das contas a receber/pagar pendentes. Reage quando contas são marcadas recebido/pago | **logic-tested** (`useFinancial.test.ts`) |

> Heatmap operacional e enriquecimento do Ctrl+K foram deliberadamente movidos para a Fase 3 (polish visual), por serem majoritariamente visuais.

## Polish visual & UX (Fase 3 — skill frontend-design)

> Aplicado **dentro** do design system Zima (não uma nova estética) — o Zima já é a
> direção bold/intencional (dark-enterprise, Linear/Stripe). **Esta fase precisa de
> revisão visual humana** (não auto-verificável sem navegador).

| Melhoria | O que | Verificação |
|---|---|---|
| `prefers-reduced-motion` | Desativa animações para quem configurou o SO (WCAG) | SSR-only — **revisar no navegador** |
| Atmosfera de fundo | Gradiente radial Zima Blue sutil no `.saas-layout` (profundidade) | SSR-only — **revisar no navegador** |
| Command Palette (Ctrl+K) enriquecido | Mais páginas + ações rápidas que **navegam de verdade** (eram `toast.info` stubs); Meu Perfil, Emitir NF, Reativar | SSR-only |
| **Perfil do usuário** (`/saas/configuracoes/perfil`) | Página nova: editar nome/email/telefone/avatar (persiste), trocar senha; topbar lê do mesmo `useProfile`; **logout funcional** | SSR-only |
| Novo lançamento financeiro | Botões "+ Novo Lançamento"/"Nova Conta" abrem modal real (`addReceivable`/`addPayable`) — eram `toast.info` stubs | SSR-only |
| Transições de página/layout + breadcrumbs clicáveis | Já existiam e funcionam (confirmado) | spec-confirmed |

> Heatmap operacional foi descopado (o dashboard/IA já têm visualizações de dados;
> não era essencial). O eixo de design priorizou refinamento aditivo sobre redesenho.

### Limitações conhecidas (escopo)
- **Cupom no PDV** atribui conversão mas **não aplica desconto** ao total (apenas rastreia).
- **DRE detalhado** (EBITDA, deduções) permanece ilustrativo; `monthlyData` (receita/despesa/mês) é que é derivado das transações reais.
- **Relatórios** usa mock determinístico (`useReports`); o seletor de período não recorta os dados desta tela.
- **Exportar PDF/XML de nota fiscal, baixar XML, batch "desativar produtos", exportar movimentações** dão feedback (toast) mas representam ações que num sistema real seriam geração de arquivo/operação de backend — não foram implementadas como download nesta demo. As exportações **de relatórios e de clientes** (CSV) são reais.
- **Logout** encerra a sessão simbolicamente (toast + volta ao dashboard); não há tela de login no escopo deste SaaS.

---

## ⚠️ Se o `/saas` aparecer SEM estilo (CSS não aplicado)

Sintoma: telas `/saas/*` empilhadas/sem estilização, navbar com títulos soltos (a landing funciona). Causa quase
sempre = **estado de servidor de dev zombie/stale** — múltiplos `npm run dev` em portas diferentes e/ou `.nuxt`
limpo com servidor rodando corrompem a injeção de CSS via HMR do Vite (que em dev entrega o CSS via módulo JS, não
`<link>`). O Styles panel do DevTools mostra a classe presente mas sem regra aplicada.

**Correção (não mexe em código):**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .nuxt, .output -ErrorAction SilentlyContinue
npm run dev   # UM único servidor
```
Teste decisivo (confirma que NÃO é bug de config): `npm run build` e `node .output/server/index.mjs` — o build de
produção emite um `<link>` CSS estático real (`/_nuxt/entry.*.css`, ~41KB) com todas as utilities. Se o preview de
produção está estilizado, o CSS/config sempre esteve correto e o problema era só o estado do dev.

> Importante: **HTTP 200 e curl do CSS em dev NÃO provam que o estilo é aplicado** — em dev o `main.css` servido é um
> módulo JS de HMR. Verifique sempre visualmente no navegador ou via `build && preview`.

## Como verificar o fluxo principal (faça isto primeiro)

```powershell
Remove-Item -Recurse -Force .nuxt -ErrorAction SilentlyContinue
npm run dev   # http://localhost:3001
```
1. `/saas/caixa`: adicione 1 serviço (escolha o profissional) + 1 produto, cliente, pagamento → Finalizar.
2. `/saas/financeiro`: a receita aparece (Overview/Receitas) e a comissão na aba Comissões.
3. `/saas/estoque`: o produto teve o estoque decrementado + movimento EXIT na aba Movimentações.
4. Recarregue (F5): os dados persistem.
5. Sino da topbar: notificação "Venda registrada".

Regressão: `npm run typecheck` · `npm run test` · `npm run lint`.
