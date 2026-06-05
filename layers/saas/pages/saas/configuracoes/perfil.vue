<script setup lang="ts">
definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const { profile, updateProfile } = useProfile()

// Formulário local (aplica no salvar).
const form = reactive({
  name: profile.value.name,
  email: profile.value.email,
  phone: profile.value.phone,
  role: profile.value.role,
})

const avatarPreview = ref<string | null>(profile.value.avatarUrl)
const avatarInput = ref<HTMLInputElement | null>(null)
const triggerAvatar = () => avatarInput.value?.click()
const onAvatarSelected = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return }
  const reader = new FileReader()
  reader.onload = () => { avatarPreview.value = reader.result as string }
  reader.readAsDataURL(file)
}

const saving = ref(false)
const saveProfile = async () => {
  if (!form.name.trim()) { toast.warning('Informe seu nome'); return }
  saving.value = true
  await new Promise(r => setTimeout(r, 500))
  updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), avatarUrl: avatarPreview.value })
  saving.value = false
  toast.success('Perfil atualizado')
}

// Troca de senha (mock — valida coincidência).
const pwd = reactive({ current: '', next: '', confirm: '' })
const changingPwd = ref(false)
const changePassword = async () => {
  if (!pwd.current || !pwd.next) { toast.warning('Preencha as senhas'); return }
  if (pwd.next !== pwd.confirm) { toast.error('As senhas não coincidem'); return }
  if (pwd.next.length < 6) { toast.warning('A nova senha deve ter ao menos 6 caracteres'); return }
  changingPwd.value = true
  await new Promise(r => setTimeout(r, 500))
  changingPwd.value = false
  pwd.current = ''; pwd.next = ''; pwd.confirm = ''
  toast.success('Senha alterada')
}

const initials = computed(() =>
  form.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join(''),
)
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="page-perfil">
    <ZimaPageHeader title="Meu Perfil" description="Gerencie seus dados de acesso e preferências">
      <template #actions>
        <ZimaButton variant="ghost" @click="navigateTo('/saas/configuracoes')">
          <template #icon-left><Icon name="i-lucide-settings-2" style="width: 14px; height: 14px;" /></template>
          Configurações do negócio
        </ZimaButton>
      </template>
    </ZimaPageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-4">
      <!-- Dados pessoais -->
      <ZimaCard padding="lg">
        <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">
          Dados Pessoais
        </div>
        <div class="flex items-center gap-4" style="margin-bottom: 20px;">
          <button
            type="button"
            style="width: 72px; height: 72px; border-radius: 9999px; border: 1px solid var(--zima-border-default); background: var(--zima-blue-subtle); display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; flex-shrink: 0;"
            @click="triggerAvatar"
          >
            <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;" >
            <span v-else style="font-size: 26px; font-weight: 700; color: var(--zima-blue-core);">{{ initials }}</span>
          </button>
          <div>
            <ZimaButton size="sm" variant="secondary" @click="triggerAvatar">Trocar foto</ZimaButton>
            <p style="font-size: 12px; color: var(--zima-text-muted); margin-top: 6px;">JPG ou PNG, até 2 MB.</p>
          </div>
          <input ref="avatarInput" type="file" accept="image/*" hidden @change="onAvatarSelected" >
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ZimaInput v-model="form.name" label="Nome completo" />
          <ZimaInput v-model="form.role" label="Função" disabled hint="Definida pelo administrador" />
          <ZimaInput v-model="form.email" label="Email" type="email" />
          <ZimaInput v-model="form.phone" label="Telefone" />
        </div>
        <div class="flex justify-end" style="margin-top: 16px;">
          <ZimaButton :loading="saving" @click="saveProfile">Salvar alterações</ZimaButton>
        </div>
      </ZimaCard>

      <!-- Segurança -->
      <ZimaCard padding="lg">
        <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">
          Segurança
        </div>
        <div class="flex flex-col gap-3">
          <ZimaInput v-model="pwd.current" label="Senha atual" type="password" />
          <ZimaInput v-model="pwd.next" label="Nova senha" type="password" hint="Mínimo 6 caracteres" />
          <ZimaInput v-model="pwd.confirm" label="Confirmar nova senha" type="password" />
        </div>
        <div class="flex justify-end" style="margin-top: 16px;">
          <ZimaButton variant="secondary" :loading="changingPwd" @click="changePassword">Alterar senha</ZimaButton>
        </div>

        <div style="height: 1px; background: var(--zima-border-divider); margin: 20px 0;" />
        <div class="flex items-center justify-between">
          <div>
            <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary);">Autenticação em duas etapas</div>
            <div style="font-size: 12px; color: var(--zima-text-muted);">Camada extra de segurança no login.</div>
          </div>
          <ZimaButton size="sm" variant="ghost" @click="toast.info('Configuração de 2FA', 'Disponível no plano Enterprise.')">Configurar</ZimaButton>
        </div>
      </ZimaCard>
    </div>
  </div>
</template>
