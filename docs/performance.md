# Performance e Otimização

## Code Splitting

O Nuxt divide automaticamente o bundle por rota. Para componentes pesados não críticos:

```vue
<!-- Prefixo Lazy — carrega só quando necessário -->
<LazyPatientModal v-if="isOpen" />
<LazyScheduleCalendar />
```

Para components programáticos:

```typescript
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
```

## Imagens

**Sempre usar `<NuxtImg>` ou `<NuxtPicture>` em vez de `<img>`.**

```vue
<!-- Correto -->
<NuxtImg
  src="/images/photo.jpg"
  alt="Descrição"
  width="800"
  height="600"
  loading="lazy"
  format="webp"
/>

<!-- Para múltiplos formatos (avif + webp + fallback) -->
<NuxtPicture src="/images/photo.jpg" alt="Descrição" width="800" height="600" />
```

- Sempre fornecer `width` e `height` para evitar CLS (Cumulative Layout Shift)
- `loading="lazy"` para imagens abaixo do fold
- `loading="eager"` (padrão) para imagens above-the-fold (LCP)

## Busca de Dados

| Hook | Quando usar |
|---|---|
| `useFetch` | Dados críticos que bloqueiam a navegação (above-fold) |
| `useLazyFetch` | Dados secundários — navega imediatamente, dados chegam depois |
| `useAsyncData` | Quando precisa de chave customizada ou lógica complexa |

```typescript
// Bloqueia até dados chegarem — bom para SEO
const { data: patient } = await useFetch(`/api/patients/${id}`)

// Não bloqueia — mostra skeleton enquanto carrega
const { data: stats, pending } = useLazyFetch('/api/stats')
```

## Route Rules

Configurado em `nuxt.config.ts`:

- `/` → `prerender: true` — página estática, melhor TTFB
- Páginas autenticadas → `ssr: true` — renderiza no servidor com dados
- API routes → limitadas por `nuxt-api-shield`

## Análise de Bundle

```bash
NUXT_ANALYZE=true npm run build
```

Abrirá visualização do bundle no browser.

## Pinia — Limpeza de Stores

Para stores com grandes datasets, limpar na saída da rota:

```typescript
onUnmounted(() => {
  const store = usePatientsStore()
  store.$dispose()
})
```

## Listas Longas (> 100 itens)

Para tabelas ou listas com muitos itens, usar virtual scrolling:

```bash
npm install @tanstack/vue-virtual
```

## Métricas Core Web Vitals

- **LCP** < 2.5s — imagem principal com `loading="eager"`, sem lazy no hero
- **FID/INP** < 100ms — evitar computações síncronas pesadas no thread principal
- **CLS** < 0.1 — sempre definir `width`/`height` em imagens e reservar espaço para conteúdo dinâmico
