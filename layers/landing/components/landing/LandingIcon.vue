<script setup lang="ts">
const props = defineProps<{ name: string; size?: number; stroke?: number }>()
const size = computed(() => props.size ?? 16)
const stroke = computed(() => props.stroke ?? 1.6)
</script>

<template>
  <!-- logo -->
  <img v-if="name === 'logo'" :width="size" :height="size" src="/logo-capa-sem-fundo.png" alt="Zima" style="object-fit:contain;display:block;flex-shrink:0" />
  <!-- icons -->
  <svg v-else :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round">
    <path v-if="name==='calendar'" d="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18"/>
    <template v-else-if="name==='users'"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></template>
    <template v-else-if="name==='wallet'"><path d="M21 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16v-4"/><path d="M21 12h-4a2 2 0 0 0 0 4h4"/><path d="M3 7V6a2 2 0 0 1 2-2h14v3"/></template>
    <path v-else-if="name==='box'" d="M21 8 12 3 3 8v8l9 5 9-5V8zM3.3 7 12 12l8.7-5M12 22V12"/>
    <template v-else-if="name==='bot'"><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 4h8"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/></template>
    <path v-else-if="name==='send'" d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>
    <path v-else-if="name==='chat'" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path v-else-if="name==='chart'" d="M3 3v18h18M7 14l4-4 4 4 5-7"/>
    <path v-else-if="name==='receipt'" d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 7h8M8 11h8M8 15h5"/>
    <path v-else-if="name==='megaphone'" d="M3 11v2a4 4 0 0 0 4 4h1l4 4V5L8 9H7a4 4 0 0 0-4 2M19 5v14M22 7v10"/>
    <path v-else-if="name==='check'" d="M20 6 9 17l-5-5"/>
    <path v-else-if="name==='x'" d="M18 6 6 18M6 6l12 12"/>
    <path v-else-if="name==='arrow'" d="M5 12h14M13 5l7 7-7 7"/>
    <path v-else-if="name==='spark'" d="m12 3 2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z"/>
    <path v-else-if="name==='bolt'" d="M13 2 3 14h7l-1 8 10-12h-7z"/>
    <path v-else-if="name==='shield'" d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5z"/>
    <template v-else-if="name==='search'"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></template>
    <path v-else-if="name==='command'" d="M18 3a3 3 0 1 0 0 6h-3V6a3 3 0 1 0-3 3h3v6h-3a3 3 0 1 0 3 3v-3h3a3 3 0 1 0 0-6h-3v3"/>
    <template v-else-if="name==='globe'"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></template>
    <path v-else-if="name==='menu'" d="M3 6h18M3 12h18M3 18h18"/>
    <path v-else-if="name==='trend'" d="m22 7-9 9-4-4-7 7M16 7h6v6"/>
    <path v-else-if="name==='minus'" d="M5 12h14"/>
    <path v-else-if="name==='plus'" d="M12 5v14M5 12h14"/>
    <path v-else-if="name==='chevron'" d="m9 18 6-6-6-6"/>
    <path v-else-if="name==='chevd'" d="m6 9 6 6 6-6"/>
    <path v-else-if="name==='filter'" d="M3 4h18l-7 9v6l-4 2v-8z"/>
    <template v-else-if="name==='bell'"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></template>
    <path v-else-if="name==='sun'" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"><circle cx="12" cy="12" r="4"/></path>
    <template v-else-if="name==='sun'"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></template>
    <path v-else-if="name==='moon'" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    <template v-else-if="name==='whatsapp'"><path d="M3 21l1.65-4.5a8 8 0 1 1 3.34 3.21L3 21z"/></template>
    <template v-else-if="name==='instagram'"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></template>
    <path v-else-if="name==='pix'" d="m12 2 4.5 4.5L12 11 7.5 6.5zM12 13l4.5 4.5L12 22l-4.5-4.5zM2 12l4.5-4.5L11 12l-4.5 4.5zM13 12l4.5-4.5L22 12l-4.5 4.5z"/>
    <rect v-else-if="name==='card'" x="2" y="5" width="20" height="14" rx="2"><path d="M2 10h20"/></rect>
  </svg>
</template>
