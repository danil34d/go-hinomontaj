// Базовый URL для API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Базовый API клиент для работы с бэкендом
function getToken() {
  const token = localStorage.getItem("token")
  if (!token) {
    console.error("Токен не найден в localStorage")
    throw new Error("Требуется авторизация")
  }
  return token
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    })

    // Если получили 401, значит токен истек или недействителен
    if (response.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
      throw new Error("Сессия истекла. Пожалуйста, войдите снова.")
    }

    return response
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error)
    throw new Error("Не удалось подключиться к серверу. Проверьте, что сервер запущен.")
  }
}

// API для работы с заказами
export const ordersApi = {
  // Получить все заказы (для менеджера)
  getAll: async () => {
    const response = await fetchWithAuth("/api/manager")
    if (!response.ok) {
      throw new Error("Не удалось загрузить заказы")
    }
    return response.json()
  },

  // Получить заказы работника
  getMyOrders: async () => {
    const response = await fetchWithAuth("/api/worker")
    if (!response.ok) {
      throw new Error("Не удалось загрузить заказы")
    }
    return response.json()
  },

  // Создать заказ (для работника)
  create: async (data: Omit<Order, "id" | "created_at" | "updated_at">) => {
    console.log("Отправка запроса на создание заказа:", data)
    const response = await fetchWithAuth("/api/worker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: data.client_id,
        vehicle_number: data.vehicle_number,
        payment_method: data.payment_method,
        description: data.description,
        service_ids: data.service_ids,
        total_amount: data.total_amount,
      }),
    })

    console.log("Получен ответ:", response.status, response.statusText)
    if (!response.ok) {
      const errorData = await response.json()
      console.error("Ошибка при создании заказа:", errorData)
      throw new Error(errorData.error || "Не удалось создать заказ")
    }

    return response.json()
  },

  // Обновить заказ (для менеджера)
  update: async (id, data) => {
    const response = await fetch(`/api/manager/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error("Не удалось обновить заказ")
    }
    return response.json()
  },

  // Удалить заказ (для менеджера)
  delete: async (id) => {
    const response = await fetch(`/api/manager/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) {
      throw new Error("Не удалось удалить заказ")
    }
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
      throw new Error(error.error || "Не удалось загрузить список сотрудников")
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
  create: async (data) => {
    const response = await fetchWithAuth("/api/manager/workers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось создать сотрудника")
    }
    return response.json()
  },

  // Обновить сотрудника
  update: async (id, data) => {
    const response = await fetchWithAuth(`/api/manager/workers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
