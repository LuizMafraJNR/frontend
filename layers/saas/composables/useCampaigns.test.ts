// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { useCampaigns } from './useCampaigns'
import { resetMockData } from './useMockPersistence'

describe('useCampaigns — conversão por cupom', () => {
  beforeEach(() => resetMockData())

  it('applyCoupon incrementa converted da campanha enviada com o cupom', () => {
    const { campaigns, applyCoupon } = useCampaigns()
    // ABRIL20 é o cupom de uma campanha "sent" no seed.
    const camp = campaigns.value.find(c => c.couponCode === 'ABRIL20')
    expect(camp).toBeDefined()
    const before = camp!.metrics.converted
    const result = applyCoupon('abril20') // case-insensitive
    expect(result).not.toBeNull()
    expect(result!.id).toBe(camp!.id)
    expect(camp!.metrics.converted).toBe(before + 1)
  })

  it('applyCoupon retorna null para cupom inexistente', () => {
    const { applyCoupon } = useCampaigns()
    expect(applyCoupon('NAOEXISTE')).toBeNull()
  })

  it('applyCoupon ignora cupom vazio', () => {
    const { applyCoupon } = useCampaigns()
    expect(applyCoupon('   ')).toBeNull()
  })

  it('duplicateCampaign via addCampaign cria nova entrada draft', () => {
    const { campaigns, addCampaign } = useCampaigns()
    const before = campaigns.value.length
    addCampaign({
      name: 'Teste (cópia)', type: 'promotional', channel: 'whatsapp', status: 'draft',
      audienceSize: 10, scheduledAt: null, sentAt: null, message: 'oi',
      couponCode: null, segmentRules: [], allClients: true,
    })
    expect(campaigns.value.length).toBe(before + 1)
    expect(campaigns.value[0]!.status).toBe('draft')
  })
})
