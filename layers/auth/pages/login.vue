<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false,
})

const { t } = useI18n()
useHead({ title: t('auth.login') })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-neutral-50">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-card">
      <h1 class="mb-6 font-heading text-2xl font-semibold text-neutral-900">
        {{ t('auth.login') }}
      </h1>
      <!-- AuthForm será implementado em layers/auth/components/ -->
      <p class="text-neutral-500">{{ t('auth.loginDescription') }}</p>
    </div>
  </div>
</template>
