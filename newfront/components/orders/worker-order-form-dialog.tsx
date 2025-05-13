"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi, clientsApi, servicesApi } from "@/lib/api"
import { fetchWithAuth } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface Client {
  id: number
  name: string
  client_type: string
}

interface Service {
  id: number
  name: string
  prices: Record<string, number>
}

interface WorkerOrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: any
  onSuccess: () => void
}

interface FormData {
  client_id: string
  vehicle_number: string
  payment_method: string
  description: string
  service_ids: string[]
}

export function WorkerOrderFormDialog({ open, onOpenChange, order, onSuccess }: WorkerOrderFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    client_id: "",
    vehicle_number: "",
    payment_method: "cash",
    description: "",
    service_ids: [],
  })

  const [totalAmount, setTotalAmount] = useState(0)
  const [selectedClientType, setSelectedClientType] = useState("")

  useEffect(() => {
    if (open) {
      fetchData()
      if (order) {
        setFormData({
          client_id: order.client_id.toString(),
          vehicle_number: order.vehicle_number,
          payment_method: order.payment_method,
          description: order.description,
          service_ids: order.services?.map(service => service.id.toString()) || [],
        })
      } else {
        setFormData({
          client_id: "",
          vehicle_number: "",
          payment_method: "cash",
          description: "",
          service_ids: [],
        })
      }
    }
  }, [open, order])

  useEffect(() => {
    // Обновляем тип клиента при выборе клиента
    if (formData.client_id) {
      const selectedClient = clients.find((c: Client) => c.id?.toString() === formData.client_id)
      if (selectedClient) {
        setSelectedClientType(selectedClient.client_type || "")
      }
    } else {
      setSelectedClientType("")
    }
  }, [formData.client_id, clients])

  useEffect(() => {
    // Пересчитываем общую сумму при изменении выбранных услуг или типа клиента
    console.log("Пересчет общей суммы. Выбранные услуги:", formData.service_ids)
    console.log("Доступные услуги:", services)
    console.log("Тип клиента:", selectedClientType)
    
    const total = formData.service_ids.reduce((sum: number, serviceId: string) => {
      const service = services.find((s: Service) => s.id.toString() === serviceId)
      console.log("Поиск услуги по ID:", serviceId, "Найдена:", service)
      
      if (!service) {
        console.warn(`Не найдена услуга с ID ${serviceId}`)
        return sum
      }
      
      if (!selectedClientType) {
        console.warn("Не выбран тип клиента")
        return sum
      }
      
      const price = service.prices[selectedClientType]
      if (price === undefined || price === null) {
        console.warn(`Не найдена цена для услуги ${serviceId} и типа клиента ${selectedClientType}`)
        return sum
      }
      
      if (typeof price !== 'number' || isNaN(price)) {
        console.warn(`Некорректная цена для услуги ${serviceId}: ${price}`)
        return sum
      }
      
      console.log(`Добавляем цену услуги ${serviceId} для типа клиента ${selectedClientType}: ${price}`)
      return sum + price
    }, 0)
    
    console.log("Итоговая сумма:", total)
    setTotalAmount(total)
  }, [formData.service_ids, services, selectedClientType])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("Загрузка данных для формы заказа...")
      
      const [clientsData, servicesData] = await Promise.all([
        clientsApi.getAll(),
        servicesApi.getWorkerServices()
      ])

      console.log("Полученные клиенты:", clientsData)
      console.log("Полученные услуги:", servicesData)

      // Проверяем, что данные являются массивами
      if (!Array.isArray(clientsData) || !Array.isArray(servicesData)) {
        throw new Error("Неверный формат данных")
      }

      setClients(clientsData)
      setServices(servicesData)
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: FormData) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: FormData) => ({ ...prev, [name]: value }))
  }

  const handleServiceSelect = (serviceId: string) => {
    if (!selectedClientType) {
      toast({
        title: "Ошибка",
        description: "Сначала выберите клиента",
        variant: "destructive"
      })
      return
    }
    
    const service = services.find((s: Service) => s.id.toString() === serviceId)
    if (!service) {
      console.warn(`Не найдена услуга с ID ${serviceId}`)
      return
    }
    
    const price = service.prices[selectedClientType]
    if (price === undefined || price === null) {
      toast({
        title: "Ошибка",
        description: `Для выбранного типа клиента нет цены на услугу "${service.name}"`,
        variant: "destructive"
      })
      return
    }
    
    if (typeof price !== 'number' || isNaN(price)) {
      toast({
        title: "Ошибка",
        description: `Некорректная цена для услуги "${service.name}"`,
        variant: "destructive"
      })
      return
    }
    
    if (!formData.service_ids.includes(serviceId)) {
      setFormData((prev: FormData) => ({
        ...prev,
        service_ids: [...prev.service_ids, serviceId]
      }))
    }
  }

  const handleRemoveService = (serviceId: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      service_ids: prev.service_ids.filter((id: string) => id !== serviceId)
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.client_id) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите клиента",
      })
      return
    }

    console.log("Начало создания заказа:", {
      user: user,
      worker_id: user?.worker_id,
      role: user?.role
    })

    if (!user?.worker_id) {
      console.error("Отсутствует worker_id в контексте пользователя")
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось определить ID работника. Попробуйте перезайти в систему.",
      })
      return
    }

    const clientId = parseInt(formData.client_id)
    const serviceIds = formData.service_ids.map((id: string) => parseInt(id))

    if (isNaN(clientId)) {
      throw new Error("Некорректный ID клиента")
    }
    if (serviceIds.some(isNaN)) {
      throw new Error("Некорректные ID услуг")
    }

    const orderData = {
      worker_id: user.worker_id,
      client_id: clientId,
      vehicle_number: formData.vehicle_number,
      payment_method: formData.payment_method,
      description: formData.description,
      services: serviceIds.map((serviceId: number) => {
        const service = services.find((s: Service) => s.id === serviceId)
        if (!service) {
          throw new Error(`Не найдена услуга с ID ${serviceId}`)
        }
        const price = service.prices[selectedClientType]
        if (price === undefined || price === null) {
          throw new Error(`Для выбранного типа клиента нет цены на услугу "${service.name}"`)
        }
        return {
          service_id: serviceId,
          service_description: service.name,
          price: price,
        }
      }),
      total_amount: totalAmount,
    }

    console.log("Отправляемые данные заказа:", orderData)

    try {
      if (order) {
        await ordersApi.update(order.id, orderData)
        toast({
          title: "Успешно",
          description: "Заказ успешно обновлен",
        })
      } else {
        await ordersApi.create(orderData)
        toast({
          title: "Успешно",
          description: "Заказ успешно создан",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      console.error("Ошибка при создании заказа:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла неизвестная ошибка",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{order ? "Редактирование заказа" : "Создание нового заказа"}</DialogTitle>
          <DialogDescription>
            {order ? "Измените данные заказа" : "Заполните форму для создания нового заказа"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_id">Клиент</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => handleSelectChange("client_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(clients) && clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} ({client.client_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_number">Номер автомобиля</Label>
                <Input
                  id="vehicle_number"
                  name="vehicle_number"
                  placeholder="А123БВ777"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Услуги</Label>
              <div className="space-y-4">
                <Select
                  value=""
                  onValueChange={handleServiceSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите услугу" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(services) && services.map((service) => {
                      const price = selectedClientType ? service.prices[selectedClientType] : 0
                      return (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - {price} ₽
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label>Выбранные услуги</Label>
                  <div className="space-y-2">
                    {formData.service_ids.map((serviceId) => {
                      const service = services.find(s => s.id.toString() === serviceId)
                      const price = selectedClientType && service ? service.prices[selectedClientType] : 0
                      return (
                        <div key={serviceId} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <span className="font-medium">{service?.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">{price} ₽</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(serviceId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Способ оплаты</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleSelectChange("payment_method", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите способ оплаты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Наличные</SelectItem>
                    <SelectItem value="card">Карта</SelectItem>
                    <SelectItem value="transfer">Перевод</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Общая сумма</Label>
                <div className="text-2xl font-bold">{totalAmount} ₽</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Введите описание заказа"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={submitting || formData.service_ids.length === 0}>
                {submitting ? (order ? "Сохранение..." : "Создание...") : order ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 