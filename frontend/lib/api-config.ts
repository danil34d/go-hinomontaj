export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export const API_ROUTES = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    
    // Workers
    WORKERS: '/manager/workers',
    WORKER: (id: string) => `/manager/workers/${id}`,
    
    // Services
    SERVICES: '/manager/services',
    SERVICE: (id: string) => `/manager/services/${id}`,
    
    // Clients
    CLIENTS: '/client',
    CLIENT: (id: string) => `/client/${id}`,
    
    // Orders
    ORDERS: '/manager',
    ORDER: (id: string) => `/manager/${id}`,
    WORKER_ORDERS: '/worker',
    STATISTICS: '/manager/statistics',
}

export const getAuthHeader = (token: string) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
}) 