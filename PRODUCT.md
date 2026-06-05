# Cuidados — Plataforma de Gestão para Negócios de Beleza e Estética

> **Documento de produto para geração de landing page.**
> Use como base de prompt para o Claude Design ou similar.
> Contém: propósito, personas, funcionalidades, diferenciais, comparações de mercado e referências visuais.

---

## 1. O Produto

**Nome:** Cuidados
**Tagline sugerida:** "Tudo que o seu negócio precisa. Em um lugar só."
**Subtítulo alternativo:** "Gestão inteligente para salões, clínicas de estética e petshops — do agendamento ao DRE."

**O que é:**
Cuidados é um SaaS de gestão completo, moderno e integrado para pequenos e médios negócios de beleza, cuidados pessoais e estética. Reúne em uma única plataforma tudo que o proprietário precisa para operar, crescer e profissionalizar o negócio: agenda, clientes, financeiro, estoque, PDV, marketing, atendimento com IA e relatórios gerenciais.

**Filosofia de produto:**
- Simples de usar, poderoso quando você precisa
- Interface dark-mode, visual sofisticado (inspirado em Linear, Vercel, Stripe)
- IA integrada para reduzir trabalho operacional
- Tudo conectado: uma venda no PDV alimenta o financeiro, a comissão da equipe e o estoque automaticamente

---

## 2. Para Quem É

### Público-alvo principal
Proprietários e gestores de:
- Salões de beleza (cabeleireiros, barberías)
- Clínicas de estética e micropigmentação
- Spas, nail designers, sobrancelhas
- Petshops e clínicas veterinárias
- Estúdios de massagem, fisioterapia e bem-estar

### Personas

**Persona 1 — A Empreendedora**
Carol, 34 anos, dona de salão em São Paulo com 4 profissionais. Usa WhatsApp para agendar, caderninho para controle financeiro e planilha para estoque. Perde clientes por falta de confirmação e não sabe quanto realmente lucra. Quer profissionalizar sem complicar.

**Persona 2 — O Gestor Escalador**
Rodrigo, 42 anos, dono de 2 clínicas de estética. Já usou 3 sistemas diferentes, nenhum integrava tudo. Quer visão financeira consolidada, comissões automáticas e conseguir ver o negócio pelo celular à noite.

**Persona 3 — A Profissional Independente**
Lara, 28 anos, nail designer que trabalha sozinha. Precisa organizar agenda, avisar clientes, cobrar online e declarar nota fiscal — tudo sem contratar funcionário de back-office.

---

## 3. O Problema que Resolve

O mercado brasileiro de beleza e estética movimenta mais de **R$ 50 bilhões por ano** e tem mais de **1,5 milhão de estabelecimentos**. Mas a maioria ainda opera de forma fragmentada:

| Dor | Realidade atual |
|-----|----------------|
| Agendamentos por WhatsApp | Sem confirmação automática, esquecimentos, no-shows |
| Financeiro no papel ou planilha | Sem visão de lucro real, DRE, comissões |
| Estoque manual | Produtos em falta, compras sem histórico de fornecedor |
| Marketing artesanal | Posts no Instagram sem segmentação, sem métrica |
| Atendimento lento | Responder mensagem do WhatsApp às 22h manualmente |
| Nota fiscal complicada | Medo do fisco, não emitem NFS-e, perdem crédito |
| 3+ sistemas diferentes | Agenda em um, financeiro em outro, sem integração |

**Cuidados resolve tudo isso em uma única plataforma.**

---

## 4. Funcionalidades — Os 14 Módulos

### Dashboard Executivo
Visão rápida do dia: agendamentos confirmados, faturamento do período, taxa de ocupação da equipe. KPIs com variação vs. período anterior. Filtro de data. Acesso direto aos agendamentos com histórico de status.

### Agenda Inteligente
Três visualizações: **Dia** (timeline com colunas por profissional), **Semana** (grid compacto), **Lista** (tabela ordenável). Criar, reagendar e cancelar agendamentos. Filtro por profissional. Status atualizados em tempo real: Pendente → Confirmado → Check-in → Em Atendimento → Concluído. Histórico com timestamps.

### CRM de Clientes
Cadastro completo com histórico de visitas, gasto total, tags, pontos de fidelidade. Busca com autocomplete. Filtros por status (VIP, Ativo, Inativo, Novo). Paginação e seleção em lote. Ações diretas: agendar, enviar campanha, editar.

### Catálogo de Serviços
Organizado por categorias customizáveis com cores. Cards colapsáveis. Duração, preço e taxa de comissão por serviço. Ativar/desativar sem deletar. Integração automática com Agenda e PDV.

### Gestão de Equipe
Grid de profissionais com avatar, status (online/ocupado/offline), agendamentos e receita do mês. Horários semanais editáveis por dia. Bloqueios de agenda (férias, treinamentos). Desempenho individual e comissões calculadas automaticamente.

### Inbox Multi-canal
Central de mensagens unificada: **WhatsApp**, **Instagram** e **Webchat** em uma só tela. Painel de conversas com busca e filtro por status. Histórico de mensagens com suporte a texto, imagem, áudio e documentos. Transferência entre IA e atendente humano. Criar agendamento diretamente do chat.

### IA & Automação
Agente de IA configurável para atendimento 24/7. Configure o nome, tom de voz, mensagens de boas-vindas e pós-horário. Base de conhecimento própria (FAQ, procedimentos, promoções). Fluxos de conversa visuais. Automações por evento (lembrete pré-atendimento, pós-serviço, aniversário). Dashboard com heatmap de atividade e taxa de resolução automática.

### Campanhas de Marketing
Criador de campanhas para WhatsApp, Instagram e Email. Segmentação de audiência por regras visuais (ex: clientes VIP + última visita > 30 dias). Editor de mensagem com variáveis dinâmicas (`{{nome}}`, `{{data}}`). Preview em celular em tempo real. Agendamento ou disparo imediato. Métricas: entregue, lido, respondido, convertido.

### Financeiro Completo (7 abas)
Overview com KPIs e gráficos. Receitas e despesas detalhadas. Contas a receber e a pagar com alertas de vencimento. Comissões da equipe calculadas por período. **DRE completo** (Demonstrativo do Resultado do Exercício) com Receita Bruta, Deduções, EBITDA e Lucro Líquido. Seletor de período: mês, trimestre, ano, personalizado.

### Caixa / PDV
Ponto de Venda integrado com catálogo de serviços e produtos. Desconto em R$ ou %. Seleção de cliente, profissional e forma de pagamento (PIX, dinheiro, cartão). Totalização automática. Registra venda no financeiro, comissão na equipe e baixa no estoque — tudo de uma vez. Histórico de vendas com filtros.

### Gestão de Estoque
Produtos com SKU, variações, custo e preço de venda. Barra visual de nível de estoque (verde/amarelo/vermelho). Movimentações rastreadas (entrada, saída, ajuste, perda). Gestão de fornecedores com CNPJ e termos de pagamento. Alertas de reposição. Entrada de mercadoria com NF vinculada.

### Notas Fiscais (NFS-e e NF-e)
Emissão de notas de serviço e produto diretamente na plataforma. Configuração de certificado digital, regime tributário, municípios e CFOPs. Preview antes de emitir. Envio automático por email ou WhatsApp. Cancelamento com justificativa. Controle de status: emitida, cancelada, com erro.

### Relatórios Gerenciais
Quatro painéis: **Vendas** (por serviço e profissional), **Financeiro** (DRE mensal evolutivo), **Operacional** (taxa de ocupação, no-shows, horário de pico), **Clientes** (segmentação, LTV, ticket médio). Exportação CSV com um clique.

### Configurações
Dados do estabelecimento, horários de funcionamento, usuários e permissões (Proprietário/Gerente/Atendente), notificações automáticas, integrações externas (WhatsApp Business API, Google Calendar, pagamento) e gerenciamento de plano/assinatura.

---

## 5. Impacto no Mercado

### O mercado
- Mais de **1,5 milhão de estabelecimentos** de beleza no Brasil (ABIHPEC/SEBRAE)
- Setor cresce **8% ao ano** em média
- Penetração de software de gestão ainda abaixo de **20%** — enorme mercado endereçável
- Digitalização acelerada pós-pandemia: clientes exigem agendamento online e confirmação automática

### O que o cliente ganha com Cuidados
- **Redução de no-shows em até 40%** com confirmações e lembretes automáticos
- **Recuperação de clientes inativos** via campanhas de reativação segmentadas
- **Fim das horas extras de atendimento manual** com IA respondendo 24/7
- **Visibilidade financeira real** — saber o lucro líquido do mês em segundos
- **Equipe mais motivada** com comissões transparentes e calculadas automaticamente
- **Nota fiscal sem estresse** — emissão integrada sem precisar de contador para operação diária

---

## 6. Diferenciais Competitivos

| Diferencial | O que significa |
|-------------|----------------|
| **IA nativa para atendimento** | Agente configurável sem código, base de conhecimento própria, transferência inteligente para humano |
| **Multi-canal integrado** | WhatsApp + Instagram + Webchat em uma única caixa de entrada |
| **PDV + Estoque + Financeiro integrados** | Uma venda no caixa alimenta os três módulos sem configuração extra |
| **Nota fiscal na plataforma** | NFS-e e NF-e sem precisar de sistema externo |
| **DRE em tempo real** | Relatório de resultado do exercício sempre atualizado, não só no final do mês |
| **Campanhas com segmentação visual** | Marketing profissional sem precisar de ferramenta externa |
| **Design enterprise moderno** | Interface dark-mode sofisticada — o profissional se sente orgulhoso de usar |
| **Totalmente responsivo** | Funciona no celular, tablet e desktop sem perda de funcionalidade |
| **Comando rápido (Ctrl+K)** | Power users navegam o sistema sem tirar as mãos do teclado |

---

## 7. Comparação com Concorrentes

| | **Cuidados** | Booksy | Mindbody | Trinks | Bling | iGestão |
|--|--|--|--|--|--|--|
| Agenda online | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| PDV integrado | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| IA para atendimento | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Inbox multi-canal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Campanhas de marketing | ✅ | Básico | Básico | ❌ | ❌ | ❌ |
| Gestão de estoque | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Nota fiscal integrada | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| DRE completo | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Comissões automáticas | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Design moderno | ✅✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Público-alvo BR | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |

**Síntese:** Booksy é forte em agendamento online mas sem gestão financeira. Bling é forte em fiscal/financeiro mas sem agenda ou atendimento. Mindbody é robusto mas caro, americano e complexo. **Cuidados é o único produto que unifica tudo — para o mercado brasileiro, com IA nativa e design moderno.**

---

## 8. Identidade Visual e Design System (Zima Blue)

> Estas informações são referência para o design da landing page.

### Personalidade visual
Interface **dark-mode enterprise** — sofisticada, moderna, profissional. Inspirado visualmente em: **Linear** (UI/UX de produto SaaS), **Vercel** (dark elegante), **Stripe Dashboard** (data-heavy, organizado). O produto deve transmitir confiança, modernidade e poder — não infantilidade ou excesso de cores.

### Paleta de cores
- **Fundo base:** `#07090E` — quase preto, com leve toque azul-noite
- **Superfícies:** `#0C1017` → `#111827` → `#161B28` (camadas de profundidade)
- **Accent principal — Zima Blue:** `#3B82F6` — azul elétrico, limpo, moderno
- **Sucesso:** `#10B981` — verde esmeralda
- **Alerta:** `#F59E0B` — âmbar
- **Perigo:** `#EF4444` — vermelho
- **Info:** `#6366F1` — índigo
- **Texto primário:** `#F1F5F9` — quase branco, alta legibilidade
- **Texto secundário:** `#94A3B8` — cinza frio
- **Texto muted:** `#64748B` — para placeholders e labels menos importantes

### Tipografia
- **Display/títulos:** Geist, Instrument Sans ou Manrope — peso bold, moderno, geométrico
- **Corpo:** Geist Sans ou DM Sans — leitura confortável, sem serifa
- **Monospace:** Geist Mono ou IBM Plex Mono — para dados, números, código

### Elementos de interface característicos
- Sidebar colapsável à esquerda (240px → 64px)
- Top bar fixa com breadcrumbs e notificações
- Command palette (Ctrl+K) para navegação rápida
- Cards com bordas sutis e sombras suaves
- Badges coloridos por status (verde sucesso, âmbar alerta, vermelho perigo)
- Tabelas com hover e seleção múltipla
- Skeletons de loading com shimmer
- Toast notifications no canto inferior direito
- Scrollbars finas (4px), discretas

### Ícones
Lucide Icons — linha fina, consistente, moderna. Sem ícones preenchidos ou "gorduchos".

---

## 9. Arquitetura Técnica (para página de tecnologia)

- **Frontend:** Nuxt 4 (Vue 3) + TypeScript + Tailwind CSS v4
- **Renderização:** SSR (Server-Side Rendering) — SEO-friendly, carregamento rápido
- **Design System:** Zima Blue — 21 componentes proprietários
- **Internacionalização:** Português (BR) como padrão, inglês disponível
- **Performance:** imagens otimizadas AVIF/WebP, lazy loading, cache inteligente
- **Acessibilidade:** foco via teclado, contraste WCAG AA, navegação semântica
- **Deploy:** Docker multi-stage, cloud-ready, escalável

---

## 10. Proposta de Valor Resumida (para hero da landing page)

**Headline principal:**
> "Gerencie seu salão como os maiores negócios do mundo gerenciam as suas empresas."

**Subheadline:**
> Agenda, clientes, financeiro, estoque, nota fiscal, IA para atendimento e campanhas de marketing — tudo em uma plataforma feita para o Brasil.

**Call to action primário:**
> "Começar grátis por 14 dias" — sem cartão de crédito

**Call to action secundário:**
> "Ver demonstração ao vivo"

**Prova social sugerida:**
> "Usado por mais de X mil profissionais de beleza e estética no Brasil"

---

## 11. Seções Sugeridas para a Landing Page

1. **Hero** — Headline forte + subheadline + CTA + screenshot/mockup da interface
2. **Problema** — "Você ainda gerencia seu salão assim?" (listagem das dores com ícones)
3. **Solução** — Visão geral do produto com animação ou preview interativo
4. **Funcionalidades** — 6 a 8 cards das features mais impactantes (Agenda, IA, Financeiro, PDV, Campanhas, Estoque)
5. **Diferenciais** — Por que Cuidados vs. outros sistemas
6. **Comparação** — Tabela comparativa com concorrentes
7. **Depoimentos** — Casos reais de proprietários (placeholder para quando houver)
8. **Planos e preços** — Tiers (Ex: Starter, Profissional, Enterprise)
9. **Integrações** — WhatsApp, Google Calendar, pagamentos, fiscal
10. **FAQ** — Perguntas frequentes de objeção
11. **CTA final** — "Seu negócio merece mais. Comece hoje." + botão destacado

---

## 12. Tom de Voz e Personalidade da Marca

- **Moderno mas acessível** — não é techie, mas também não é básico
- **Empoderador** — o proprietário se sente capaz e profissional
- **Direto ao ponto** — sem floreios, sem promessas vazias
- **Brasileiro** — linguagem natural, próxima, sem traduções literais do inglês
- **Confiante** — o produto resolve o problema, não tenta resolver
- **Palavras que combinam:** inteligente, integrado, completo, profissional, seu negócio, mais tempo, menos trabalho, crescimento

---

*Documento gerado em 2026-05-21 para uso como prompt de design de landing page.*
