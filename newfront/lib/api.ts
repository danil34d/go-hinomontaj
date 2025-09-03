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
    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Получить заказы работника
  getMyOrders: async () => {
    const response = await fetchWithAuth("/api/worker")
    if (!response.ok) {
      throw new Error("Не удалось загрузить заказы")
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
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
  createManager: async (data: {
    client_id: number | null
    worker_id: number
    vehicle_number: string
    payment_method: string
    description: string
    total_amount: number
    status: string
    services: CreateOrderService[]
  }) => {
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
        status: data.status,
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

  // Обновить статус заказа
  updateStatus: async (id: number, status: string) => {
    const response = await fetchWithAuth(`/api/manager/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить статус заказа")
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
    const data = await response.json()
    return Array.isArray(data) ? data : []
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

  // Получить статистику сотрудника
  getStatistics: async (workerId: number, startDate: string, endDate: string) => {
    const response = await fetchWithAuth(`/api/manager/workers/statistics/${workerId}?start=${startDate}&end=${endDate}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить статистику сотрудника")
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
    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Получить услуги с ценами по договорам
  getAllWithPrices: async (): Promise<ServiceWithPrices[]> => {
    const response = await fetchWithAuth("/api/manager/services/with-prices")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить услуги с ценами")
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Получить услуги с ценами по договору
  getServicesByContract: async (contractId: number) => {
    const response = await fetchWithAuth(`/api/services/${contractId}/prices`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить услуги с ценами")
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
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
    const data = await response.json()
    return Array.isArray(data) ? data : []
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

  // Получить владельцев машины
  whooseCar: async (carNumber: string): Promise<Client[]> => {
    const response = await fetchWithAuth(`/api/manager/clients/whoose/${carNumber}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить владельцев машины")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Получить сравнение клиентов для машины
  compareClientsForCar: async (carNumber: string): Promise<ClientComparison[]> => {
    const response = await fetchWithAuth(`/api/manager/clients/compare/${carNumber}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить сравнение клиентов")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
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
    const data = await response.json()
    return Array.isArray(data) ? data : []
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

  uploadPrices: async (contractId: number, file: File): Promise<any> => {
    const form = new FormData()
    form.append('file', file)
    const response = await fetchWithAuth(`/api/manager/contracts/${contractId}/prices/upload`, {
      method: 'POST',
      body: form,
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось загрузить прайс-лист')
    }
    return response.json()
  },
}

// API для работы с материалами (для менеджера)
export const materialsApi = {
  // Получить все материалы
  getAll: async (): Promise<Material[]> => {
    const response = await fetchWithAuth("/api/manager/materials")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить список материалов")
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Создать материал
  create: async (data: Omit<Material, "id" | "created_at" | "updated_at">): Promise<any> => {
    const response = await fetchWithAuth("/api/manager/materials", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось создать материал');
    }
    return response.json();
  },

  // Обновить материал
  update: async (id: number, data: Omit<Material, "id" | "created_at" | "updated_at">): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/materials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось обновить материал');
    }
    return response.json();
  },

  // Удалить материал
  delete: async (id: number): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/materials/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось удалить материал');
    }
    return response.json();
  },

  // Добавить количество материала
  addQuantity: async (id: number, quantity: number): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/materials/${id}/add-quantity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось добавить количество');
    }
    return response.json();
  },

  // Вычесть количество материала
  subtractQuantity: async (id: number, quantity: number): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/materials/${id}/subtract-quantity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось вычесть количество');
    }
    return response.json();
  },

  dropConsumable: async (name: string): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/material-cards/schema/columns/${name}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось удалить расходник');
    }
    return response.json();
  },

  renameConsumable: async (oldName: string, newName: string): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/material-cards/schema/columns/rename`, {
      method: 'PUT',
      body: JSON.stringify({ old_name: oldName, new_name: newName }),
    })
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Не удалось переименовать расходник');
    }
    return response.json();
  },
  getConsumableColumns: async (): Promise<string[]> => {
    const response = await fetchWithAuth('/api/manager/material-cards/schema/columns')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось получить список расходников')
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Управление складом
  getStorage: async (): Promise<Storage> => {
    const response = await fetchWithAuth('/api/manager/storage')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось получить данные склада')
    }
    return response.json()
  },
  updateStorage: async (storage: any): Promise<any> => {
    const response = await fetchWithAuth('/api/manager/storage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storage)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось обновить склад')
    }
    return response.json()
  },
  addStorageColumn: async (name: string): Promise<any> => {
    const response = await fetchWithAuth('/api/manager/storage/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось добавить колонку склада')
    }
    return response.json()
  },
  dropStorageColumn: async (name: string): Promise<any> => {
    const response = await fetchWithAuth(`/api/manager/storage/columns/${name}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось удалить колонку склада')
    }
    return response.json()
  },
  renameStorageColumn: async (oldName: string, newName: string): Promise<any> => {
    const response = await fetchWithAuth('/api/manager/storage/columns/rename', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_name: oldName, new_name: newName })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось переименовать колонку склада')
    }
    return response.json()
  },
  getStorageColumns: async (): Promise<string[]> => {
    const response = await fetchWithAuth('/api/manager/storage/columns')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Не удалось получить колонки склада')
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  },
};



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
  created_at: string
  updated_at: string
}

// Интерфейс для сравнения клиентов
export interface ClientComparison {
  client: Client
  services: Service[]
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

export interface Material {
  id: number
  name: string
  type_ds: number
  storage: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  status: string
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

export interface CreateOrderService {
  service_id: number
  description: string
  wheel_position: string
  price: number
}

export interface OnlineDate {
  id: number
  date: string
  name: string
  phone: string
  car_number: string
  client_desc: string
  manager_desc: string
  created_at: string
  updated_at: string
}

// API для работы с онлайн встречами
export const onlineDatesApi = {
  // Получить все онлайн встречи
  getAll: async (): Promise<OnlineDate[]> => {
    const response = await fetchWithAuth("/api/manager/clients/onlinedate")
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось загрузить онлайн встречи")
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Создать новую онлайн встречу
  create: async (data: Omit<OnlineDate, "id" | "created_at" | "updated_at">): Promise<OnlineDate> => {
    const response = await fetchWithAuth("/api/manager/clients/onlinedate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось создать онлайн встречу")
    }

    return response.json()
  },

  // Обновить онлайн встречу (добавить заметку менеджера)
  update: async (data: Partial<OnlineDate>): Promise<OnlineDate> => {
    const response = await fetchWithAuth("/api/manager/clients/onlinedate", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось обновить онлайн встречу")
    }

    return response.json()
  },
}

// API для работы с премиями и штрафами
export const salaryApi = {
  // Добавить премию сотруднику
  addBonus: async (data: { worker_id: number; amount: number; description: string }) => {
    const response = await fetchWithAuth("/api/manager/workers/bonuses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worker_id: data.worker_id,
        amount: data.amount,
        description: data.description,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось добавить премию")
    }

    return response.json()
  },

  // Добавить штраф сотруднику
  addPenalty: async (data: { worker_id: number; amount: number; description: string }) => {
    const response = await fetchWithAuth("/api/manager/workers/penalties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worker_id: data.worker_id,
        amount: data.amount,
        description: data.description,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось добавить штраф")
    }

    return response.json()
  },

  // Получить статистику сотрудника за период
  getWorkerStatistics: async (workerId: number, startDate: string, endDate: string) => {
    const response = await fetchWithAuth(`/api/manager/workers/statistics/${workerId}?start=${startDate}&end=${endDate}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить статистику")
    }

    return response.json()
  },

  // Получить премии сотрудника
  getBonuses: async (workerId: number) => {
    const response = await fetchWithAuth(`/api/manager/workers/bonuses/${workerId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить премии")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  },

  // Получить штрафы сотрудника
  getPenalties: async (workerId: number) => {
    const response = await fetchWithAuth(`/api/manager/workers/penalties/${workerId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Не удалось получить штрафы")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  },
}
