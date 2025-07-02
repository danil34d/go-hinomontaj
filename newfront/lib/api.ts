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

  // Базовые заголовки
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // Добавляем Content-Type только если это не FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  // Добавляем пользовательские заголовки
  if (options.headers) {
    Object.assign(headers, options.headers)
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
    const response = await fetchWithAuth("/api/manager/orders")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось загрузить заказы")
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
        worker_id: data.worker_id,
        vehicle_number: data.vehicle_number,
        payment_method: data.payment_method,
        description: data.description,
        total_amount: data.total_amount,
        services: data.services,
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

  // Создать заказ (для менеджера)
  createManager: async (data: Omit<Order, "id" | "created_at" | "updated_at">) => {
    const response = await fetchWithAuth("/api/manager/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: data.client_id,
        worker_id: data.worker_id,
        vehicle_number: data.vehicle_number,
        payment_method: data.payment_method,
        description: data.description,
        total_amount: data.total_amount,
        services: data.services,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Не удалось создать заказ")
    }

    return response.json()
  },

  // Обновить заказ (для менеджера)
  update: async (id: number, data: any) => {
    const response = await fetchWithAuth(`/api/manager/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить заказ")
    }
    return response.json()
  },

  // Удалить заказ (для менеджера)
  delete: async (id: number) => {
    const response = await fetchWithAuth(`/api/manager/orders/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось удалить заказ")
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

  // Получить статистику работника
  getWorkerStats: async () => {
    const response = await fetchWithAuth("/api/worker/statistics")
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

// API для работы с типами клиентов
export const clientTypesApi = {
  getAll: async () => {
    const response = await fetchWithAuth("/api/manager/client-types");
    if (!response.ok) {
      throw new Error('Не удалось получить типы клиентов');
    }
    return response.json();
  },
}

// API для работы с услугами (для менеджера)
export const servicesApi = {
  getAll: async () => {
    const response = await fetchWithAuth("/api/services")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить список услуг")
    }
    return response.json()
  },

  // Получить услуги с ценами по договорам
  getAllWithPrices: async (): Promise<ServiceWithPrices[]> => {
    const response = await fetchWithAuth("/api/manager/services/with-prices")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить услуги с ценами")
    }
    return response.json()
  },

  // Получить услуги с ценами по договору
  getServicesByContract: async (contractId: number) => {
    const response = await fetchWithAuth(`/api/services/${contractId}/prices`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить услуги с ценами")
    }
    return response.json()
  },

  getWorkerServices: async () => {
    const response = await fetchWithAuth("/api/services")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить список услуг")
    }
    return response.json()
  },

  create: async (data: { name: string; price: number; contract_id: number; material_card_id: number }) => {
    const response = await fetchWithAuth("/api/manager/services", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось создать услугу');
    }
    return response.json();
  },

  update: async (id: number, data: { name: string; price: number; contract_id: number; material_card_id: number }) => {
    const response = await fetchWithAuth(`/api/manager/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось обновить услугу');
    }
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetchWithAuth(`/api/manager/services/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось удалить услугу');
    }
    return response.json();
  },
}

// API для работы с клиентами
export const clientsApi = {
  // Получить всех клиентов
  getAll: async () => {
    const response = await fetchWithAuth("/api/clients")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить клиентов")
    }
    return response.json()
  },

  // Получить всех клиентов (для работника)
  getWorkerClients: async () => {
    const response = await fetchWithAuth("/api/clients")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить клиентов")
    }
    return response.json()
  },

  // Создать клиента
  create: async (data: { name: string; owner_phone: string; manager_phone: string; client_type: string; contract_id: number; car_numbers?: string[] }) => {
    const response = await fetchWithAuth("/api/manager/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось создать клиента")
    }
    return response.json()
  },

  // Обновить клиента
  update: async (id: number, data: { name: string; owner_phone: string; manager_phone: string; client_type: string; contract_id: number; car_numbers?: string[] }) => {
    const response = await fetchWithAuth(`/api/manager/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить клиента")
    }
    return response.json()
  },

  // Удалить клиента
  delete: async (id: number) => {
    const response = await fetchWithAuth(`/api/manager/clients/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось удалить клиента")
    }
    return response.json()
  },

  // Получить автомобили клиента
  getVehicles: async (clientId: number) => {
    const response = await fetchWithAuth(`/api/manager/clients/${clientId}/vehicles`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить автомобили клиента")
    }
    return response.json()
  },

  // Добавить автомобиль клиенту
  addVehicle: async (clientId: number, data: { number: string; model: string; year: number }) => {
    const response = await fetchWithAuth(`/api/manager/clients/${clientId}/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось добавить автомобиль")
    }
    return response.json()
  },

  // Удалить автомобиль клиента
  deleteVehicle: async (clientId: number, vehicleId: number) => {
    const response = await fetchWithAuth(`/api/manager/clients/${clientId}/vehicles/${vehicleId}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось удалить автомобиль")
    }
    return response.json()
  },
}

// API для работы с договорами (для менеджера)
export const contractsApi = {
  getAll: async (): Promise<Contract[]> => {
    const response = await fetchWithAuth("/api/manager/contracts")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить список договоров")
    }
    return response.json()
  },

  getById: async (id: number): Promise<Contract> => {
    const response = await fetchWithAuth(`/api/manager/contracts/${id}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить договор")
    }
    return response.json()
  },

  create: async (data: {
    number: string;
    description: string;
    client_company_name: string;
    client_company_address: string;
    client_company_phone: string;
    client_company_email: string;
    client_company_inn: string;
    client_company_kpp: string;
    client_company_ogrn: string;
    client_type: string;
  }): Promise<{ id: number }> => {
    const response = await fetchWithAuth("/api/manager/contracts", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось создать договор');
    }
    return response.json();
  },

  update: async (id: number, data: {
    number: string;
    description: string;
    client_company_name: string;
    client_company_address: string;
    client_company_phone: string;
    client_company_email: string;
    client_company_inn: string;
    client_company_kpp: string;
    client_company_ogrn: string;
    client_type: string;
  }): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/contracts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось обновить договор');
    }
    return response.json();
  },

  delete: async (id: number): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/contracts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось удалить договор');
    }
    return response.json();
  },
}

// API для работы с материалами (для менеджера)
export const materialsApi = {
  // Получить все технологические карты
  getAllMaterialCards: async (): Promise<MaterialCard[]> => {
    const response = await fetchWithAuth("/api/manager/material-cards")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить список технологических карт")
    }
    return response.json()
  },

  // Создать технологическую карту
  createMaterialCard: async (data: Omit<MaterialCard, "id" | "created_at" | "updated_at">): Promise<{ id: number }> => {
    const response = await fetchWithAuth("/api/manager/material-cards", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось создать технологическую карту');
    }
    return response.json();
  },

  // Обновить технологическую карту
  updateMaterialCard: async (id: number, data: Omit<MaterialCard, "id" | "created_at" | "updated_at">): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/material-cards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось обновить технологическую карту');
    }
    return response.json();
  },

  // Удалить технологическую карту
  deleteMaterialCard: async (id: number): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/material-cards/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось удалить технологическую карту');
    }
    return response.json();
  },

  // Получить данные склада
  getStorage: async (): Promise<Storage> => {
    const response = await fetchWithAuth("/api/manager/material-cards/storage")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить данные склада")
    }
    return response.json()
  },

  // Добавить поставку материалов
  addDelivery: async (data: Omit<Storage, "id" | "created_at" | "updated_at">): Promise<any> => {
    const response = await fetchWithAuth("/api/manager/material-cards/delivery", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось добавить поставку');
    }
    return response.json();
  },
}

// Типы для API
export interface Client {
  id: number
  name: string
  client_type: string
  owner_phone: string
  manager_phone: string
  contract_id: number
  car_numbers: string[]
  created_at: string
  updated_at: string
  cars?: Car[]
}

export interface Car {
  id: number
  number: string
  model: string
  year: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: number
  name: string
  price: number
  contract_id: number
  material_card: number
  created_at: string
  updated_at: string
}

export interface ServiceWithPrices {
  name: string
  material_card: number
  prices: Array<{
    contract_id: number
    contract_name: string
    price: number
  }>
  created_at: string
  updated_at: string
}

export interface Contract {
  id: number
  number: string
  description: string
  client_company_name: string
  client_company_address: string
  client_company_phone: string
  client_company_email: string
  client_company_inn: string
  client_company_kpp: string
  client_company_ogrn: string
  client_type: string
  created_at: string
  updated_at: string
}

export interface Worker {
  id: number
  name: string
  surname: string
  email: string
  phone: string
  salary_schema: string
  tmp_salary: number
  has_car: boolean
  created_at: string
  updated_at: string
}

export interface MaterialCard {
  id: number
  rs25: number
  r19: number
  r20: number
  r25: number
  r251: number
  r13: number
  r15: number
  foot9: number
  foot12: number
  foot15: number
  created_at: string
  updated_at: string
}

export interface Storage {
  id: number
  rs25: number
  r19: number
  r20: number
  r25: number
  r251: number
  r13: number
  r15: number
  foot9: number
  foot12: number
  foot15: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  worker_id: number
  client_id: number
  client?: Client
  vehicle_number: string
  payment_method: string
  total_amount: number
  created_at: string
  updated_at: string
  services: OrderService[]
}

export interface OrderService {
  id: number
  order_id: number
  service_id: number
  description: string
  wheel_position: string
  price: number
  created_at: string
  updated_at: string
}
