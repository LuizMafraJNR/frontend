/**
 * useMockPersistence — persistência SSR-safe para os dados mock do SaaS.
 *
 * Por que um helper próprio em vez do `useStorage` do VueUse:
 * `useStorage` lê o localStorage de forma **síncrona na criação**, inclusive na
 * primeira renderização do cliente. Como o SaaS é SSR, o servidor renderiza com
 * o seed e o cliente hidrataria já com o valor do localStorage → mismatch de
 * hidratação visível. Aqui o `ref` nasce **sempre** com o seed (servidor e
 * cliente idênticos) e a reidratação acontece de forma controlada **após** a
 * primeira chamada no cliente, fora do ciclo de hidratação.
 *
 * Versionamento de schema (`SCHEMA_VERSION`): ao adicionar/alterar campos dos
 * dados mock, basta subir a versão — dados antigos no localStorage com shape
 * incompatível são automaticamente descartados e re-seedados. Isso evita crash
 * de hidratação por dados velhos durante o próprio desenvolvimento iterativo,
 * não só na demo do usuário.
 */
import type { Ref } from 'vue'

/** Suba este número sempre que o shape de qualquer dado persistido mudar. */
export const SCHEMA_VERSION = 2

const STORAGE_PREFIX = 'cuidados:saas'
const VERSION_KEY = `${STORAGE_PREFIX}:__v`

/** Refs registrados, para o reset de demonstração reidratar tudo de uma vez. */
interface Registered<T = unknown> {
  key: string
  ref: Ref<T>
  seed: () => T
}
const registry: Registered[] = []

/** Lê e valida a versão de schema guardada; limpa tudo se incompatível. */
function ensureSchemaVersion(): void {
  if (!import.meta.client) return
  try {
    const stored = window.localStorage.getItem(VERSION_KEY)
    if (stored !== String(SCHEMA_VERSION)) {
      // Schema mudou (ou primeira execução): descarta chaves antigas do SaaS.
      const toRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k)
      }
      toRemove.forEach(k => window.localStorage.removeItem(k))
      window.localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION))
    }
  } catch {
    /* localStorage indisponível (modo privado / quota) — segue com seed em memória */
  }
}

/**
 * Cria um ref singleton que persiste no localStorage de forma SSR-safe.
 *
 * @param key   sufixo único da chave (ex.: 'financial:transactions')
 * @param seed  factory do valor inicial (mock). Deve retornar dados novos a cada chamada.
 */
export function persistedRef<T>(key: string, seed: () => T): Ref<T> {
  const fullKey = `${STORAGE_PREFIX}:${key}`
  // O ref nasce SEMPRE com o seed — no servidor E no cliente. A leitura do
  // localStorage NÃO acontece aqui: ela é deferida para hydrateAll(), chamado
  // por um plugin .client após a hidratação (onNuxtReady). Isso garante que a
  // primeira render do cliente é idêntica ao HTML do servidor (seed = seed),
  // eliminando hydration mismatch no cenário mutação→reload.
  const r = ref(seed()) as Ref<T>

  registry.push({ key: fullKey, ref: r as Ref<unknown>, seed: seed as () => unknown })

  if (import.meta.client) {
    // A ESCRITA pode ser instalada já: ela só dispara em mutações, que ocorrem
    // depois da hidratação. Não afeta a primeira render.
    watch(
      r,
      val => {
        try {
          window.localStorage.setItem(fullKey, JSON.stringify(val))
        } catch {
          /* quota / indisponível — ignora */
        }
      },
      { deep: true },
    )
  }

  return r
}

let hydrated = false

/**
 * Lê o localStorage e reidrata todos os refs registrados. DEVE ser chamado
 * apenas no cliente, APÓS a hidratação (via plugin .client em onNuxtReady) —
 * nunca no escopo do módulo, ou reintroduz o mismatch que esta arquitetura evita.
 */
export function hydrateAll(): void {
  if (!import.meta.client || hydrated) return
  hydrated = true
  ensureSchemaVersion()
  registry.forEach(({ key, ref: r }) => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        r.value = JSON.parse(raw)
      } else {
        // Primeira vez: grava o seed atual como baseline persistido.
        window.localStorage.setItem(key, JSON.stringify(r.value))
      }
    } catch {
      /* parse inválido / storage indisponível — mantém o seed */
    }
  })
}

/** Apenas para testes: permite simular um novo "boot" reidratando de novo. */
export function __resetHydrationFlagForTests(): void {
  hydrated = false
}

/**
 * Limpa todos os dados persistidos do SaaS e re-seeda os refs registrados.
 * Usado pelo botão "Resetar dados de demonstração" em Configurações.
 */
export function resetMockData(): void {
  if (import.meta.client) {
    try {
      const toRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k)
      }
      toRemove.forEach(k => window.localStorage.removeItem(k))
      window.localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION))
    } catch {
      /* ignora */
    }
  }
  // Re-seeda em memória (o watch regrava o baseline no localStorage).
  registry.forEach(({ ref: r, seed }) => {
    r.value = seed()
  })
}
