# Tela 12 — Notas Fiscais

**Rota:** `/saas/notas`
**Arquivo:** `layers/saas/pages/saas/notas.vue`
**Composables:** `useFiscal()`, `useCustomers()`, `useInventory()`

## Visão Geral

Emissão e gestão de documentos fiscais eletrônicos: NFS-e (Nota Fiscal de Serviços) e NF-e (Nota Fiscal de Produtos/Mercadorias). Inclui configuração completa do ambiente fiscal do estabelecimento.

## Tabs

| Tab | Conteúdo |
|-----|---------|
| `todas` | Lista unificada de NFS-e e NF-e com filtro de tipo |
| `nfse` | Lista filtrada — apenas Notas de Serviço |
| `nfe` | Lista filtrada — apenas Notas de Produto |
| `configuracoes` | Configurações fiscais in-place (6 seções) |

## Tipos

```typescript
type FiscalDocType = 'NFSE' | 'NFE'
type FiscalDocStatus = 'ISSUED' | 'CANCELLED' | 'ERROR' | 'PENDING' | 'PROCESSING'

interface FiscalServiceItem {
  description: string
  serviceCode: string      // ex: '9602-5/01'
  serviceLabel: string     // ex: 'Cabeleireiros, manicures e pedicures'
  value: number
  issAliquota: number      // percentual, ex: 5
  issValue: number         // calculado: value × issAliquota / 100
  deduction: number
  calcBase: number         // value - deduction
}

interface FiscalProductItem {
  productId: string
  productName: string
  ncm: string
  cfop: string
  qty: number
  unitValue: number
  subtotal: number         // qty × unitValue
  icmsAliquota: number
  icmsValue: number        // subtotal × icmsAliquota / 100
}

interface FiscalDocument {
  id: string
  number: string           // ex: '1234'
  serie: string            // ex: '1'
  type: FiscalDocType
  status: FiscalDocStatus
  issuedAt: string         // 'YYYY-MM-DD HH:MM'
  clientId?: string
  clientName: string
  clientDocument: string   // CPF (11 dígitos) ou CNPJ (14 dígitos)
  clientEmail?: string
  description: string
  totalValue: number
  issValue?: number
  xmlKey?: string          // chave de acesso de 44 dígitos
  cancelledAt?: string
  cancelReason?: string
  errorMessage?: string
  saleId?: string
  transactionId?: string
  items?: FiscalServiceItem[] | FiscalProductItem[]
}

interface FiscalConfig {
  // Emitente
  cnpj: string
  inscricaoMunicipal: string
  inscricaoEstadual: string
  razaoSocial: string
  nomeFantasia: string
  endereco: string
  municipioIbge: string
  // Regime tributário
  regimeTributario: 'MEI' | 'SN' | 'LP' | 'LR'
  snAnexo: string          // 'I' a 'V'
  snAliquotaEfetiva: number
  snRbt12: number          // receita bruta 12 meses
  lpPisAliquota: number
  lpCofinsAliquota: number
  // Certificado digital
  certStatus: 'valid' | 'expiring' | 'expired' | 'none'
  certExpiry?: string
  certCnpj?: string
  // NFS-e
  nfseWebserviceUrl: string
  nfseUsuario: string
  nfseSenha: string
  nfseSerie: string
  nfseProximoNumero: number
  // NF-e
  nfeAmbiente: 'homologacao' | 'producao'
  nfeSerie: string
  nfeProximoNumero: number
  nfeCsc: string
  nfeCscId: string
  // Padrões de emissão
  issAliquotaPadrao: number
  servicoCodigoPadrao: string
  cfopPadrao: string
  enviarEmailAuto: boolean
  enviarWhatsappAuto: boolean
}
```

## Funções do Composable

| Função | Descrição |
|--------|-----------|
| `fetchAll()` | Carrega documentos fiscais e configuração |
| `issueNfse(form)` | Emite NFS-e — mock setTimeout 1500ms, 15% chance de erro |
| `issueNfe(form)` | Emite NF-e — mock setTimeout 1500ms, 10% chance de erro |
| `cancelDocument(id, reason)` | Cancela documento ISSUED |
| `saveFiscalConfig(config)` | Salva configurações fiscais |
| `documents` | `ref<FiscalDocument[]>` singleton |
| `config` | `ref<FiscalConfig>` singleton |

## Constantes Exportadas

```typescript
SERVICE_CODES   // 10 códigos LC116/CNAE: [{ value, label }]
CFOP_OPTIONS    // 6 CFOPs comuns: [{ value, label }]
MUNICIPIOS_NFSE // 10 municípios com URLs de webservice NFS-e
```

## Modais

### Modal: Emitir NFS-e (size="xl")

Layout 2 colunas (60% formulário + 40% preview):

**Formulário — 4 seções:**
1. **Tomador:** select de cliente (auto-preenche CPF/CNPJ, nome, email), endereço (cidade, UF, CEP)
2. **Serviço:** descrição, código do serviço, valor, alíquota ISS%, valor ISS (calculado), dedução, base de cálculo
3. **Impostos** (colapsável): campos dinâmicos por regime (SN: toggle ISS retido; LP: PIS/COFINS read-only)
4. **Observações:** textarea pré-preenchida conforme regime

**Preview:** Card HTML estilizado com dados reativos aos inputs via `computed`. Simula layout visual de nota fiscal.

**Fluxo de emissão:**
1. Click "Emitir Nota Fiscal" → `issuingNfse = true` (botão com loading)
2. `await issueNfse(form)` — aguarda 1500ms
3. Sucesso → fecha modal → abre Modal Sucesso com número da nota
4. Erro → `toast.error()` persistente, documento fica com status `ERROR`

### Modal: Emitir NF-e (size="xl")

Layout 2 colunas (60% formulário + 40% preview simplificado):

**Tabela de produtos editável:**

| Coluna | Input |
|--------|-------|
| Produto | select do `useInventory().products` |
| NCM | input text (auto do cadastro, editável) |
| CFOP | select `CFOP_OPTIONS` |
| Qtd | input number |
| Valor Unit. | input R$ |
| Subtotal | read-only calculado |
| ICMS % | input (default 12%) |
| ICMS R$ | read-only calculado |
| × | botão remover linha |

Totais calculados: subtotal produtos, total ICMS, valor total da nota.
Campos adicionais: natureza da operação, frete (com valor condicional), informações adicionais.

### Modal: Cancelar Nota (size="sm", danger)

- Select de motivo de cancelamento
- Textarea de justificativa
- Confirmar → `cancelDocument(id, reason)` → toast "Nota cancelada"

### Modal: Sucesso pós-emissão (size="sm")

- Ícone check verde
- "NFS-e #XXXX emitida!"
- Botões: Ver PDF / Enviar para cliente / Fechar

## Tab: Configurações Fiscais (6 seções in-place)

| Seção | Campos |
|-------|--------|
| 1. Dados do Emitente | CNPJ (máscara), Inscrição Municipal, Inscrição Estadual, Razão Social, Nome Fantasia, Endereço completo |
| 2. Regime Tributário | Select regime + sub-campos dinâmicos (MEI: banner DAS; SN: anexo+alíquota+RBT12; LP: PIS%+COFINS%; LR: informativo) |
| 3. Certificado Digital | Banner de status colorido (valid=verde/expiring=amarelo/expired+none=vermelho), upload mock, senha, botão "Validar" |
| 4. Configurações NFS-e | Select município (auto-preenche URL), usuário, senha, botão "Testar conexão", série, próximo número |
| 5. Configurações NF-e | Radio homologação/produção (banner laranja se homologação), série, próximo número, CSC |
| 6. Padrões | Alíquota ISS padrão, código de serviço padrão, CFOP padrão, toggles de envio automático |

Footer fixo: botão "Salvar Configurações" com loading state.

## Status das Notas — Badges

| Status | Badge | Comportamento |
|--------|-------|--------------|
| `ISSUED` | `success` "Emitida" | Permite cancelar e baixar XML/PDF |
| `CANCELLED` | `danger` "Cancelada" | Read-only, permite reemitir |
| `ERROR` | `warning` "Com erro" | Exibe mensagem de erro abaixo, permite reemitir |
| `PENDING` | `neutral` "Pendente" | Aguardando processamento |
| `PROCESSING` | span `animate-pulse` azul | Em emissão |

## Mock Data

- 8 documentos fiscais: 5 ISSUED, 1 CANCELLED, 1 ERROR, 1 PENDING; mix de NFSE/NFE
- Config padrão: regime SN, certStatus 'valid' (expira 2027-09-15), série 1, próximo número 1235
- Ambiente NF-e: homologação
