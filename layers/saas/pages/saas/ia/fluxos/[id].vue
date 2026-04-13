<script setup lang="ts">
import { useAI } from '../../../../composables/useAI'

definePageMeta({ layout: false })

const route = useRoute()
const { convFlows } = useAI()

const flowId = computed(() => route.params.id as string)
const currentFlow = computed(() => convFlows.value.find(f => f.id === flowId.value))

const flowName = ref(currentFlow.value?.name ?? 'Novo Fluxo')
const flowActive = ref(currentFlow.value?.active ?? false)
const zoom = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const testOpen = ref(false)
const selectedNodeId = ref<string | null>(null)
const connectingFrom = ref<string | null>(null)
const testInput = ref('')
const testMessages = ref<{ sender: 'user' | 'bot'; text: string }[]>([])
const testActiveNode = ref<string | null>(null)

// ── Node types ─────────────────────────────────────────────────────────────
type NodeType = 'trigger' | 'send_message' | 'ask_question' | 'send_media' | 'condition' | 'delay' | 'loop' | 'create_appointment' | 'register_client' | 'apply_tag' | 'notify_team' | 'call_api' | 'ai_free' | 'transfer_human' | 'end'

const nodeTypeMeta: Record<NodeType, { label: string; icon: string; color: string }> = {
  trigger:             { label: 'Início',            icon: 'i-lucide-play',           color: '#10B981' },
  send_message:        { label: 'Enviar mensagem',   icon: 'i-lucide-message-square',  color: '#3B82F6' },
  ask_question:        { label: 'Fazer pergunta',    icon: 'i-lucide-help-circle',     color: '#3B82F6' },
  send_media:          { label: 'Enviar mídia',      icon: 'i-lucide-image',           color: '#3B82F6' },
  condition:           { label: 'Condição',          icon: 'i-lucide-git-branch',      color: '#8B5CF6' },
  delay:               { label: 'Aguardar',          icon: 'i-lucide-timer',           color: '#8B5CF6' },
  loop:                { label: 'Loop',              icon: 'i-lucide-repeat',          color: '#8B5CF6' },
  create_appointment:  { label: 'Criar agendamento', icon: 'i-lucide-calendar-plus',   color: '#F59E0B' },
  register_client:     { label: 'Cadastrar cliente', icon: 'i-lucide-user-plus',       color: '#F59E0B' },
  apply_tag:           { label: 'Aplicar tag',       icon: 'i-lucide-tag',             color: '#F59E0B' },
  notify_team:         { label: 'Notificar equipe',  icon: 'i-lucide-bell',            color: '#F59E0B' },
  call_api:            { label: 'Chamar API',        icon: 'i-lucide-webhook',         color: '#F59E0B' },
  ai_free:             { label: 'IA livre',          icon: 'i-lucide-bot',             color: '#6366F1' },
  transfer_human:      { label: 'Transferir humano', icon: 'i-lucide-user-check',      color: '#6366F1' },
  end:                 { label: 'Finalizar',         icon: 'i-lucide-check-circle',    color: '#64748B' },
}

const nodePalette: { category: string; types: NodeType[] }[] = [
  { category: 'GATILHOS',   types: ['trigger'] },
  { category: 'MENSAGENS',  types: ['send_message', 'ask_question', 'send_media'] },
  { category: 'LÓGICA',     types: ['condition', 'delay', 'loop'] },
  { category: 'AÇÕES',      types: ['create_appointment', 'register_client', 'apply_tag', 'notify_team', 'call_api'] },
  { category: 'ATENDIMENTO', types: ['ai_free', 'transfer_human', 'end'] },
]

// ── Nodes state ───────────────────────────────────────────────────────────
interface FlowNode {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
  properties: Record<string, unknown>
}

interface FlowEdge {
  id: string
  fromId: string
  toId: string
  label?: string
}

const nodes = ref<FlowNode[]>([
  { id: 'n-1', type: 'trigger',        label: 'Cliente envia mensagem contendo "agendar"', x: 280, y: 60, properties: {} },
  { id: 'n-2', type: 'send_message',   label: 'Olá! Gostaria de agendar um horário?',      x: 280, y: 200, properties: {} },
  { id: 'n-3', type: 'ask_question',   label: 'Qual serviço você deseja?',                 x: 280, y: 340, properties: {} },
  { id: 'n-4', type: 'create_appointment', label: 'Criar agendamento',                     x: 280, y: 480, properties: {} },
  { id: 'n-5', type: 'end',            label: 'Agendamento confirmado!',                   x: 280, y: 600, properties: {} },
])

const edges = ref<FlowEdge[]>([
  { id: 'e-1', fromId: 'n-1', toId: 'n-2' },
  { id: 'e-2', fromId: 'n-2', toId: 'n-3' },
  { id: 'e-3', fromId: 'n-3', toId: 'n-4' },
  { id: 'e-4', fromId: 'n-4', toId: 'n-5' },
])

const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value) ?? null)

// ── Drag nodes ────────────────────────────────────────────────────────────
const draggingNodeId = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

const startDrag = (nodeId: string, e: MouseEvent) => {
  e.preventDefault()
  draggingNodeId.value = nodeId
  const node = nodes.value.find(n => n.id === nodeId)!
  dragOffset.value = { x: e.clientX / zoom.value - node.x, y: e.clientY / zoom.value - node.y }
  selectedNodeId.value = nodeId
}

const onMouseMove = (e: MouseEvent) => {
  if (draggingNodeId.value) {
    const node = nodes.value.find(n => n.id === draggingNodeId.value)!
    node.x = e.clientX / zoom.value - dragOffset.value.x
    node.y = e.clientY / zoom.value - dragOffset.value.y
  }
  if (isPanning.value) {
    panOffset.value.x += e.clientX - panStart.value.x
    panOffset.value.y += e.clientY - panStart.value.y
    panStart.value = { x: e.clientX, y: e.clientY }
  }
}

const onMouseUp = () => {
  draggingNodeId.value = null
  isPanning.value = false
}

const startPan = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('canvas-bg')) {
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    selectedNodeId.value = null
  }
}

const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoom.value = Math.max(0.3, Math.min(2, zoom.value + delta))
}

const fitToScreen = () => {
  zoom.value = 1
  panOffset.value = { x: 0, y: 0 }
}

// ── Add node from palette ─────────────────────────────────────────────────
const addNode = (type: NodeType) => {
  const meta = nodeTypeMeta[type]
  nodes.value.push({
    id: `n-${Date.now()}`,
    type,
    label: meta.label,
    x: 280 + (Math.random() - 0.5) * 100,
    y: 100 + nodes.value.length * 60,
    properties: {},
  })
}

const deleteSelectedNode = () => {
  if (!selectedNodeId.value) return
  nodes.value = nodes.value.filter(n => n.id !== selectedNodeId.value)
  edges.value = edges.value.filter(e => e.fromId !== selectedNodeId.value && e.toId !== selectedNodeId.value)
  selectedNodeId.value = null
}

// ── Connecting edges ──────────────────────────────────────────────────────
const startConnect = (nodeId: string) => {
  connectingFrom.value = nodeId
}

const finishConnect = (nodeId: string) => {
  if (connectingFrom.value && connectingFrom.value !== nodeId) {
    const exists = edges.value.find(e => e.fromId === connectingFrom.value && e.toId === nodeId)
    if (!exists) {
      edges.value.push({ id: `e-${Date.now()}`, fromId: connectingFrom.value, toId: nodeId })
    }
  }
  connectingFrom.value = null
}

// ── Edge bezier path ───────────────────────────────────────────────────────
const NODE_W = 200
const NODE_H = 72

const getEdgePath = (edge: FlowEdge): string => {
  const from = nodes.value.find(n => n.id === edge.fromId)
  const to = nodes.value.find(n => n.id === edge.toId)
  if (!from || !to) return ''
  const x1 = from.x + NODE_W / 2
  const y1 = from.y + NODE_H
  const x2 = to.x + NODE_W / 2
  const y2 = to.y
  const cy = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${cy} ${x2} ${cy} ${x2} ${y2}`
}

// ── Save ───────────────────────────────────────────────────────────────────
const toast = useZimaToast()
const saveFlow = () => {
  toast.success(`Fluxo "${flowName.value}" salvo!`)
}

// ── Test simulator ─────────────────────────────────────────────────────────
const runTest = () => {
  if (!testInput.value.trim()) return
  testMessages.value.push({ sender: 'user', text: testInput.value })
  testActiveNode.value = 'n-2'
  setTimeout(() => {
    testMessages.value.push({ sender: 'bot', text: 'Olá! Gostaria de agendar um horário? 😊' })
    testActiveNode.value = 'n-3'
  }, 800)
  testInput.value = ''
}

const resetTest = () => {
  testMessages.value = []
  testActiveNode.value = null
  testInput.value = ''
}

// ── Keyboard ───────────────────────────────────────────────────────────────
const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Delete' && selectedNodeId.value) deleteSelectedNode()
}

onMounted(() => { window.addEventListener('keydown', onKeyDown) })
onUnmounted(() => { window.removeEventListener('keydown', onKeyDown) })
</script>

<template>
  <div
    style="display:flex; flex-direction:column; height:100vh; background:#07090E; overflow:hidden; user-select:none;"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
  >
    <!-- Toolbar -->
    <div style="height:48px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 16px; border-bottom:1px solid rgba(148,163,184,0.08); background:#0C1017; z-index:10;">
      <div style="display:flex; align-items:center; gap:12px;">
        <button
          style="display:flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; color:var(--zima-text-muted); font-size:13px; padding:4px 8px; border-radius:6px; transition:all 150ms;"
          @click="navigateTo('/saas/ia?tab=fluxos')"
          @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.08)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
        >
          <Icon name="i-lucide-arrow-left" style="width:14px;height:14px;" />
          Voltar
        </button>
        <div style="width:1px; height:20px; background:rgba(148,163,184,0.12);" />
        <input
          v-model="flowName"
          style="background:none; border:none; outline:none; color:var(--zima-text-primary); font-size:14px; font-weight:600; min-width:160px;"
        />
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="display:flex; align-items:center; gap:4px; background:rgba(148,163,184,0.06); border-radius:6px; padding:3px;">
          <button style="padding:3px 8px; background:none; border:none; cursor:pointer; color:var(--zima-text-muted); font-size:14px; border-radius:4px;" @click="zoom = Math.max(0.3, zoom - 0.1)">−</button>
          <span style="font-size:12px; color:var(--zima-text-muted); min-width:40px; text-align:center;">{{ Math.round(zoom * 100) }}%</span>
          <button style="padding:3px 8px; background:none; border:none; cursor:pointer; color:var(--zima-text-muted); font-size:14px; border-radius:4px;" @click="zoom = Math.min(2, zoom + 0.1)">+</button>
        </div>
        <button style="padding:4px 8px; background:none; border:none; cursor:pointer; color:var(--zima-text-muted); font-size:12px; border-radius:4px;" @click="fitToScreen">
          <Icon name="i-lucide-maximize-2" style="width:13px;height:13px;" />
        </button>
        <ZimaButton variant="ghost" size="sm" @click="testOpen = true">Testar fluxo</ZimaButton>
        <ZimaButton size="sm" @click="saveFlow">Salvar</ZimaButton>
        <ZimaToggle v-model="flowActive" size="sm" label="Ativo" />
      </div>
    </div>

    <!-- Main area -->
    <div style="display:flex; flex:1; overflow:hidden;">
      <!-- Node palette -->
      <div style="width:180px; flex-shrink:0; background:#0C1017; border-right:1px solid rgba(148,163,184,0.08); overflow-y:auto; padding:12px 8px;">
        <div v-for="cat in nodePalette" :key="cat.category" style="margin-bottom:16px;">
          <div style="font-size:9px; font-weight:700; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.1em; padding:0 6px; margin-bottom:6px;">{{ cat.category }}</div>
          <div
            v-for="type in cat.types"
            :key="type"
            style="display:flex; align-items:center; gap:8px; padding:7px 8px; border-radius:6px; cursor:pointer; margin-bottom:2px; border:1px solid transparent; transition:all 150ms;"
            @click="addNode(type)"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.06)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
          >
            <div style="width:24px; height:24px; border-radius:5px; display:flex; align-items:center; justify-content:center; flex-shrink:0;" :style="{ background: `${nodeTypeMeta[type].color}20` }">
              <Icon :name="nodeTypeMeta[type].icon" style="width:12px;height:12px;" :style="{ color: nodeTypeMeta[type].color }" />
            </div>
            <span style="font-size:11px; color:var(--zima-text-secondary); line-height:1.3;">{{ nodeTypeMeta[type].label }}</span>
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <div
        style="flex:1; overflow:hidden; position:relative; cursor:grab;"
        @mousedown="startPan"
        @wheel.prevent="onWheel"
      >
        <!-- Dot grid background -->
        <div
          class="canvas-bg"
          style="position:absolute; inset:0; background-image:radial-gradient(circle, rgba(148,163,184,0.08) 1px, transparent 1px); background-size:24px 24px; pointer-events:none;"
        />

        <!-- Canvas content (transformed) -->
        <div
          style="position:absolute; transform-origin: 0 0;"
          :style="{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }"
        >
          <!-- SVG for edges -->
          <svg style="position:absolute; left:0; top:0; pointer-events:none; overflow:visible; width:1px; height:1px;">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(148,163,184,0.4)" />
              </marker>
            </defs>
            <path
              v-for="edge in edges"
              :key="edge.id"
              :d="getEdgePath(edge)"
              fill="none"
              stroke="rgba(148,163,184,0.25)"
              stroke-width="1.5"
              marker-end="url(#arrowhead)"
            />
          </svg>

          <!-- Nodes -->
          <div
            v-for="node in nodes"
            :key="node.id"
            style="position:absolute; width:200px; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.3); cursor:pointer; transition:box-shadow 100ms;"
            :style="{
              left: `${node.x}px`,
              top: `${node.y}px`,
              border: selectedNodeId === node.id ? `2px solid ${nodeTypeMeta[node.type].color}` : '1px solid rgba(148,163,184,0.12)',
              boxShadow: testActiveNode === node.id ? `0 0 16px ${nodeTypeMeta[node.type].color}60` : undefined,
            }"
            @mousedown.stop="startDrag(node.id, $event)"
            @click.stop="selectedNodeId = node.id"
          >
            <!-- Node header -->
            <div style="padding:6px 10px; display:flex; align-items:center; gap:6px;" :style="{ background: `${nodeTypeMeta[node.type].color}20` }">
              <Icon :name="nodeTypeMeta[node.type].icon" style="width:13px;height:13px;flex-shrink:0;" :style="{ color: nodeTypeMeta[node.type].color }" />
              <span style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;" :style="{ color: nodeTypeMeta[node.type].color }">{{ nodeTypeMeta[node.type].label }}</span>
            </div>
            <!-- Node body -->
            <div style="padding:8px 10px; background:#161B28; min-height:36px;">
              <span style="font-size:12px; color:var(--zima-text-secondary); line-height:1.4;">{{ node.label || 'Configurar...' }}</span>
            </div>
            <!-- Input handle (top center) -->
            <div
              style="position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:12px; height:12px; border-radius:50%; background:#1E2535; border:2px solid rgba(148,163,184,0.3); cursor:crosshair;"
              @mousedown.stop="finishConnect(node.id)"
            />
            <!-- Output handle (bottom center) -->
            <div
              style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); width:12px; height:12px; border-radius:50%; background:#1E2535; border:2px solid rgba(148,163,184,0.3); cursor:crosshair; transition:border-color 150ms;"
              @mousedown.stop="startConnect(node.id)"
              @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = nodeTypeMeta[node.type].color"
              @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'rgba(148,163,184,0.3)'"
            />
          </div>
        </div>
      </div>

      <!-- Properties panel -->
      <div v-if="selectedNode" style="width:300px; flex-shrink:0; background:#0C1017; border-left:1px solid rgba(148,163,184,0.08); overflow-y:auto; padding:16px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <div style="font-size:13px; font-weight:600; color:var(--zima-text-primary);">Propriedades</div>
          <button style="background:none;border:none;cursor:pointer;color:var(--zima-text-muted);" @click="selectedNodeId = null">
            <Icon name="i-lucide-x" style="width:14px;height:14px;" />
          </button>
        </div>
        <div class="flex flex-col gap-4">
          <div>
            <div style="font-size:12px; font-weight:500; color:var(--zima-text-muted); margin-bottom:6px;">Tipo</div>
            <div style="display:flex; align-items:center; gap:6px;">
              <div style="width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;" :style="{ background: `${nodeTypeMeta[selectedNode.type].color}20` }">
                <Icon :name="nodeTypeMeta[selectedNode.type].icon" style="width:11px;height:11px;" :style="{ color: nodeTypeMeta[selectedNode.type].color }" />
              </div>
              <span style="font-size:13px; color:var(--zima-text-secondary);">{{ nodeTypeMeta[selectedNode.type].label }}</span>
            </div>
          </div>
          <div>
            <div style="font-size:12px; font-weight:500; color:var(--zima-text-muted); margin-bottom:6px;">Conteúdo</div>
            <textarea
              v-model="selectedNode.label"
              rows="4"
              style="width:100%;padding:8px 10px;background:#111520;border:1px solid rgba(148,163,184,0.12);border-radius:6px;color:var(--zima-text-primary);font-size:12px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;"
            />
          </div>
          <div style="display:flex; gap:6px;">
            <ZimaButton variant="ghost" size="sm" style="flex:1;" @click="deleteSelectedNode">
              <template #icon-left><Icon name="i-lucide-trash-2" style="width:13px;height:13px;color:var(--zima-danger);" /></template>
              Remover
            </ZimaButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Modal -->
    <ZimaModal v-model="testOpen" title="Testar Fluxo" size="lg">
      <div style="display:flex; gap:16px; min-height:400px;">
        <!-- Chat -->
        <div style="flex:1; display:flex; flex-direction:column;">
          <div style="flex:1; overflow-y:auto; padding:12px; background:#07090E; border-radius:8px; margin-bottom:12px; min-height:300px; display:flex; flex-direction:column; gap:8px;">
            <div v-if="!testMessages.length" style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--zima-text-muted); font-size:13px;">
              Digite uma mensagem para iniciar o teste
            </div>
            <template v-for="(msg, i) in testMessages" :key="i">
              <div style="display:flex;" :style="{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }">
                <div style="max-width:75%; padding:8px 12px; font-size:13px; line-height:1.4;" :style="{
                  background: msg.sender === 'user' ? 'rgba(59,130,246,0.12)' : '#161B28',
                  borderRadius: msg.sender === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  color: 'var(--zima-text-secondary)',
                }">
                  {{ msg.text }}
                </div>
              </div>
            </template>
          </div>
          <div style="display:flex; gap:8px;">
            <input
              v-model="testInput"
              placeholder="Digite como se fosse o cliente..."
              style="flex:1;padding:8px 12px;background:#111520;border:1px solid rgba(148,163,184,0.12);border-radius:6px;color:var(--zima-text-primary);font-size:13px;outline:none;"
              @keydown.enter="runTest"
            />
            <ZimaButton size="sm" @click="runTest">Enviar</ZimaButton>
            <ZimaButton size="sm" variant="ghost" @click="resetTest">Reset</ZimaButton>
          </div>
        </div>

        <!-- Active node indicator -->
        <div style="width:160px; flex-shrink:0;">
          <div style="font-size:12px; font-weight:600; color:var(--zima-text-muted); margin-bottom:8px;">Node ativo</div>
          <div v-if="testActiveNode" style="padding:10px; background:rgba(59,130,246,0.08); border-radius:6px; border:1px solid rgba(59,130,246,0.2);">
            <div v-for="node in nodes" :key="node.id">
              <div v-if="node.id === testActiveNode" style="font-size:12px; color:#3B82F6;">{{ nodeTypeMeta[node.type].label }}</div>
            </div>
          </div>
          <div v-else style="font-size:12px; color:var(--zima-text-muted);">Aguardando...</div>
        </div>
      </div>
      <template #footer="{ close }">
        <ZimaButton variant="ghost" @click="close">Fechar</ZimaButton>
      </template>
    </ZimaModal>
  </div>
</template>
