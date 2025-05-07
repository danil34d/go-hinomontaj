// Базовый API клиент для работы с бэкендом

import { API_URL, getAuthHeader } from './api-config'

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = 'ApiError'
    }
}

type RequestOptions = {
    method?: string
    headers?: Record<string, string>
    body?: any
    token?: string
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        method = 'GET',
        headers = {},
        body,
        token,
    } = options

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    }

    if (token) {
        Object.assign(requestHeaders, getAuthHeader(token))
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
        throw new ApiError(
            response.status,
            data.error || 'Произошла ошибка при выполнении запроса'
        )
    }

    return data
}

// Хелперы для типовых запросов
export const api = {
    get: <T>(endpoint: string, token?: string) =>
        apiRequest<T>(endpoint, { token }),

    post: <T>(endpoint: string, data: any, token?: string) =>
        apiRequest<T>(endpoint, {
            method: 'POST',
            body: data,
            token,
        }),

    put: <T>(endpoint: string, data: any, token?: string) =>
        apiRequest<T>(endpoint, {
            method: 'PUT',
            body: data,
            token,
        }),

    delete: <T>(endpoint: string, token?: string) =>
        apiRequest<T>(endpoint, {
            method: 'DELETE',
            token,
        }),
}

// API для работы с заказами
export const ordersApi = {
  // Получить все заказы (для менеджера)
  getAll: async () => {
    const response = await fetchWithAuth("/api/manager")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить заказы")
    }
    return response.json()
  },

  // Получить заказы работника
  getMyOrders: async () => {
    const response = await fetchWithAuth("/api/worker")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить заказы")
    }
    return response.json()
  },

  // Создать заказ (для работника)
  create: async (order) => {
    const response = await fetchWithAuth("/api/worker", {
      method: "POST",
      body: JSON.stringify(order),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось создать заказ")
    }
    return response.json()
  },

  // Обновить заказ (для менеджера)
  update: async (id, order) => {
    const response = await fetchWithAuth(`/api/manager/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить заказ")
    }
    return response.json()
  },

  // Удалить заказ (для менеджера)
  delete: async (id) => {
    const response = await fetchWithAuth(`/api/manager/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось удалить заказ")
    }
    return response.json()
  },
}

// API для работы со статистикой
export const statisticsApi = {
  // Получить статистику (для менеджера)
  get: async () => {
    const response = await fetchWithAuth("/api/manager/statistics")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить статистику")
    }
    return response.json()
  },
}

// API для работы с сотрудниками (для менеджера)
export const workersApi = {
  // Получить всех сотрудников
  getAll: async () => {
    const response = await fetchWithAuth("/api/manager/workers")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить сотрудников")
    }
    return response.json()
  },

  // Получить сотрудника по ID
  getById: async (id) => {
    const response = await fetchWithAuth(`/api/manager/workers/${id}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить сотрудника")
    }
    return response.json()
  },

  // Создать сотрудника
  create: async (worker) => {
    const response = await fetchWithAuth("/api/manager/workers", {
      method: "POST",
      body: JSON.stringify(worker),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось создать сотрудника")
    }
    return response.json()
  },

  // Обновить сотрудника
  update: async (id, worker) => {
    const response = await fetchWithAuth(`/api/manager/workers/${id}`, {
      method: "PUT",
      body: JSON.stringify(worker),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить сотрудника")
    }
    return response.json()
  },

  // Удалить сотрудника
  delete: async (id) => {
    const response = await fetchWithAuth(`/api/manager/workers/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось удалить сотрудника")
    }
    return response.json()
  },
}

// API для работы с услугами (для менеджера)
export const servicesApi = {
  // Получить все услуги
  getAll: async () => {
    const response = await fetchWithAuth("/api/manager/services")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить услуги")
    }
    return response.json()
  },

  // Создать услугу
  create: async (service) => {
    const response = await fetchWithAuth("/api/manager/services", {
      method: "POST",
      body: JSON.stringify(service),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось создать услугу")
    }
    return response.json()
  },

  // Обновить услугу
  update: async (id, service) => {
    const response = await fetchWithAuth(`/api/manager/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(service),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить услугу")
    }
    return response.json()
  },

  // Удалить услугу
  delete: async (id) => {
    const response = await fetchWithAuth(`/api/manager/services/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось удалить услугу")
    }
    return response.json()
  },
}

// API для работы с клиентами
export const clientsApi = {
  // Получить всех клиентов
  getAll: async () => {
    const response = await fetchWithAuth("/api/client")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить клиентов")
    }
    return response.json()
  },

  // Создать клиента
  create: async (client) => {
    const response = await fetchWithAuth("/api/client", {
      method: "POST",
      body: JSON.stringify(client),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось создать клиента")
    }
    return response.json()
  },

  // Обновить клиента
  update: async (id, client) => {
    const response = await fetchWithAuth(`/api/client/${id}`, {
      method: "PUT",
      body: JSON.stringify(client),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить клиента")
    }
    return response.json()
  },

  // Удалить клиента
  delete: async (id) => {
    const response = await fetchWithAuth(`/api/client/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось удалить клиента")
    }
    return response.json()
  },
}
