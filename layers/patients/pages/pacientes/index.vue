<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
useHead({ title: t('nav.patients') })
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-semibold text-neutral-900">
      {{ t('nav.patients') }}
    </h1>
    <!-- Lista de pacientes — implementar com usePatients() -->
  </div>
</template>
