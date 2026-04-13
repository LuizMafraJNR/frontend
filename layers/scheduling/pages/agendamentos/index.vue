<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
useHead({ title: t('nav.scheduling') })
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-semibold text-neutral-900">
      {{ t('nav.scheduling') }}
    </h1>
    <!-- Calendário de agendamentos — implementar com useScheduling() -->
  </div>
</template>
