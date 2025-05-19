"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export type Client = {
  id: number
  name: string
  phone: string
  email: string
  client_type: string
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/manager/clients")
      if (!response.ok) {
        throw new Error("Не удалось загрузить список клиентов")
      }
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Ошибка при загрузке клиентов:", error)
      toast.error("Не удалось загрузить список клиентов")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    isLoading,
    refetch: fetchClients,
  }
} 