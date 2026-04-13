/**
 * useServices — Composable de domínio para Serviços e Categorias.
 * Mock com latência simulada de 400ms. Interface idêntica à futura API.
 */

export interface ServiceCategory {
  id: string
  name: string
  color: string
  order: number
  servicesCount: number
}

export interface Service {
  id: string
  categoryId: string
  name: string
  duration: number   // em minutos
  price: number      // em reais
  commissionRate: number  // percentual (ex: 30 para 30%)
  active: boolean
  order: number
}

const MOCK_CATEGORIES: ServiceCategory[] = [
  { id: 'cat-1', name: 'Cabelo', color: '#3B82F6', order: 1, servicesCount: 4 },
  { id: 'cat-2', name: 'Barba', color: '#6366F1', order: 2, servicesCount: 2 },
  { id: 'cat-3', name: 'Estética', color: '#10B981', order: 3, servicesCount: 2 },
]

const MOCK_SERVICES: Service[] = [
  { id: 'svc-1', categoryId: 'cat-1', name: 'Corte Masculino', duration: 30, price: 45, commissionRate: 30, active: true, order: 1 },
  { id: 'svc-2', categoryId: 'cat-1', name: 'Corte Feminino', duration: 60, price: 80, commissionRate: 30, active: true, order: 2 },
  { id: 'svc-3', categoryId: 'cat-1', name: 'Escova Progressiva', duration: 120, price: 180, commissionRate: 35, active: true, order: 3 },
  { id: 'svc-4', categoryId: 'cat-1', name: 'Coloração', duration: 90, price: 150, commissionRate: 35, active: false, order: 4 },
  { id: 'svc-5', categoryId: 'cat-2', name: 'Barba Completa', duration: 30, price: 35, commissionRate: 30, active: true, order: 1 },
  { id: 'svc-6', categoryId: 'cat-2', name: 'Barba + Bigode', duration: 45, price: 50, commissionRate: 30, active: true, order: 2 },
  { id: 'svc-7', categoryId: 'cat-3', name: 'Limpeza de Pele', duration: 60, price: 120, commissionRate: 40, active: true, order: 1 },
  { id: 'svc-8', categoryId: 'cat-3', name: 'Hidratação Facial', duration: 45, price: 90, commissionRate: 40, active: true, order: 2 },
]

export const useServices = () => {
  const categories = ref<ServiceCategory[]>([])
  const services = ref<Service[]>([])
  const loading = ref(false)

  const fetchAll = async () => {
    loading.value = true
    await new Promise(r => setTimeout(r, 400))
    categories.value = [...MOCK_CATEGORIES]
    services.value = [...MOCK_SERVICES]
    loading.value = false
  }

  const servicesByCategory = computed(() => {
    return categories.value.map(cat => ({
      category: cat,
      services: services.value
        .filter(s => s.categoryId === cat.id)
        .sort((a, b) => a.order - b.order),
    }))
  })

  const toggleServiceActive = async (id: string) => {
    const svc = services.value.find(s => s.id === id)
    if (!svc) return
    await new Promise(r => setTimeout(r, 400))
    svc.active = !svc.active
  }

  const createService = async (data: Omit<Service, 'id' | 'order'>) => {
    await new Promise(r => setTimeout(r, 400))
    const catServices = services.value.filter(s => s.categoryId === data.categoryId)
    const newSvc: Service = {
      ...data,
      id: `svc-${Date.now()}`,
      order: catServices.length + 1,
    }
    services.value.push(newSvc)
    const cat = categories.value.find(c => c.id === data.categoryId)
    if (cat) cat.servicesCount++
    return newSvc
  }

  const updateService = async (id: string, data: Partial<Service>) => {
    await new Promise(r => setTimeout(r, 400))
    const idx = services.value.findIndex(s => s.id === id)
    if (idx >= 0) services.value[idx] = { ...services.value[idx], ...data }
  }

  const deleteService = async (id: string) => {
    await new Promise(r => setTimeout(r, 400))
    const svc = services.value.find(s => s.id === id)
    services.value = services.value.filter(s => s.id !== id)
    if (svc) {
      const cat = categories.value.find(c => c.id === svc.categoryId)
      if (cat && cat.servicesCount > 0) cat.servicesCount--
    }
  }

  const createCategory = async (data: Pick<ServiceCategory, 'name' | 'color'>) => {
    await new Promise(r => setTimeout(r, 400))
    const newCat: ServiceCategory = {
      ...data,
      id: `cat-${Date.now()}`,
      order: categories.value.length + 1,
      servicesCount: 0,
    }
    categories.value.push(newCat)
    return newCat
  }

  const updateCategory = async (id: string, data: Partial<ServiceCategory>) => {
    await new Promise(r => setTimeout(r, 400))
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx >= 0) categories.value[idx] = { ...categories.value[idx], ...data }
  }

  const deleteCategory = async (id: string) => {
    await new Promise(r => setTimeout(r, 400))
    categories.value = categories.value.filter(c => c.id !== id)
    services.value = services.value.filter(s => s.categoryId !== id)
  }

  const reorderServices = (categoryId: string, newOrder: Service[]) => {
    const others = services.value.filter(s => s.categoryId !== categoryId)
    const reordered = newOrder.map((s, i) => ({ ...s, order: i + 1 }))
    services.value = [...others, ...reordered]
  }

  const reorderCategories = (newOrder: ServiceCategory[]) => {
    categories.value = newOrder.map((c, i) => ({ ...c, order: i + 1 }))
  }

  return {
    categories,
    services,
    loading,
    servicesByCategory,
    fetchAll,
    toggleServiceActive,
    createService,
    updateService,
    deleteService,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderServices,
    reorderCategories,
  }
}
