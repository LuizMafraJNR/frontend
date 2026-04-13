// Types globais compartilhados por todas as layers

export interface ApiError {
  message: string
  statusCode: number
  data?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
}

export type ID = string | number

export interface Timestamps {
  createdAt: string
  updatedAt: string
}

export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
}
