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
import { WheelPositionSelector, WheelPosition } from "./wheel-position-selector"

interface Vehicle {
  id: number
  number: string
  model: string
  year: string
}

interface Client {
  id: number
  name: string
  client_type: string
  owner_phone: string
  manager_phone: string
  contract_id: number
  car_numbers: string[]
  created_at: string
  updated_at: string
}

interface Service {
  id: number
  name: string
  price: number
  contract_id: number
  material_card: number
  created_at: string
  updated_at: string
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
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    client_id: "",
    vehicle_number: "",
    payment_method: "НАЛИЧНЫЕ",
    description: "",
    service_ids: [],
  })

  const [totalAmount, setTotalAmount] = useState(0)
  const [selectedClientType, setSelectedClientType] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedTruckType, setSelectedTruckType] = useState<"type1" | "type2" | null>(null)
  const [selectedWheelPosition, setSelectedWheelPosition] = useState<string>("")

  // Получаем уникальные типы клиентов
  const clientTypes = Array.from(new Set(clients.map(client => client.client_type)))

  // Фильтруем клиентов по выбранному типу
  const filteredClients = clients.filter(client => client.client_type === selectedClientType)

  // Получаем клиента "Наличка" для наличных платежей
  const cashClient = clients.find(client => client.name === "Наличка" && client.client_type === "НАЛИЧКА")

  // Если выбран контрагент или агрегатор и метод оплаты наличными или картой, меняем на безналичный
  useEffect(() => {
    if ((selectedClientType === "КОНТРАГЕНТЫ" || selectedClientType === "АГРЕГАТОРЫ") && 
        (formData.payment_method === "НАЛИЧНЫЕ" || formData.payment_method === "КАРТА")) {
      setFormData(prev => ({ ...prev, payment_method: "ПЕРЕВОД" }))
    }
  }, [selectedClientType])

  // Автоматически устанавливаем клиента "Наличка" при выборе наличной оплаты
  useEffect(() => {
    if (formData.payment_method === "НАЛИЧНЫЕ" && cashClient) {
      setFormData(prev => ({ 
        ...prev, 
        client_id: cashClient.id.toString() 
      }))
      setSelectedClientType("НАЛИЧКА")
      // Загружаем услуги с ценами для налички (договор ID 1)
      loadServicesByContract(1)
    }
  }, [formData.payment_method, cashClient])

  // Проверяем, нужно ли показывать поля выбора клиента
  const shouldShowClientSelection = formData.payment_method !== "НАЛИЧНЫЕ"

  // Проверяем, нужно ли показывать выбор машины из списка
  const shouldShowVehicleSelection = selectedClientType === "КОНТРАГЕНТЫ" || selectedClientType === "АГРЕГАТОРЫ"

  // Обработчик выбора клиента
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === parseInt(clientId))
    if (client) {
      setSelectedClient(client)
      loadServicesByContract(client.contract_id)
      
      // Загружаем машины клиента, если это не наличка
      if (client.client_type !== "НАЛИЧКА") {
        fetchClientVehicles(client.id)
      } else {
        setClientVehicles([])
      }
    }
  }

  // Функция для загрузки машин клиента
  const fetchClientVehicles = async (clientId: number) => {
    try {
      setLoadingVehicles(true)
      const vehicles = await clientsApi.getVehicles(clientId)
      setClientVehicles(vehicles)
    } catch (error: any) {
      console.error("Ошибка при загрузке машин клиента:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить машины клиента",
      })
    } finally {
      setLoadingVehicles(false)
    }
  }

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
          payment_method: "НАЛИЧНЫЕ",
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
        
        // Загружаем машины клиента, если это контрагент или агрегатор
        if (selectedClient.client_type === "КОНТРАГЕНТЫ" || selectedClient.client_type === "АГРЕГАТОРЫ") {
          fetchClientVehicles(selectedClient.id)
        } else {
          setClientVehicles([])
        }
        
        // Загружаем услуги с ценами по договору клиента
        if (selectedClient.contract_id) {
          loadServicesByContract(selectedClient.contract_id)
        }
      }
    } else {
      setSelectedClientType("")
      setClientVehicles([])
    }
  }, [formData.client_id, clients])

  // Сбрасываем выбранного клиента при изменении типа клиента
  useEffect(() => {
    setFormData(prev => ({ ...prev, client_id: "" }))
  }, [selectedClientType])

  useEffect(() => {
    // Пересчитываем общую сумму при изменении выбранных услуг
    console.log("Пересчет общей суммы. Выбранные услуги:", formData.service_ids)
    console.log("Доступные услуги:", services)
    
    const total = formData.service_ids.reduce((sum: number, serviceId: string) => {
      const service = services.find((s: Service) => s.id.toString() === serviceId)
      console.log("Поиск услуги по ID:", serviceId, "Найдена:", service)
      
      if (!service) {
        console.warn(`Не найдена услуга с ID ${serviceId}`)
        return sum
      }
      
      try {
        const wheelType = getWheelType(selectedWheelPosition || "all")
        const price = getServicePrice(service, wheelType)
        
        if (typeof price !== 'number' || isNaN(price)) {
          console.warn(`Некорректная цена для услуги ${serviceId}: ${price}`)
          return sum
        }
        
        console.log(`Добавляем цену услуги ${serviceId} (${service.name}) для типа колеса ${wheelType}: ${price}`)
        return sum + price
      } catch (error) {
        console.warn(`Ошибка при расчете цены для услуги ${serviceId}:`, error)
        return sum
      }
    }, 0)
    
    console.log("Итоговая сумма:", total)
    setTotalAmount(total)
  }, [formData.service_ids, services, selectedWheelPosition])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("Загрузка данных для формы заказа...")
      
      const clientsData = await clientsApi.getAll()

      console.log("Полученные клиенты:", clientsData)

      // Проверяем, что данные являются массивами
      if (!Array.isArray(clientsData)) {
        throw new Error("Неверный формат данных")
      }

      setClients(clientsData)
      
      // Загружаем услуги с ценами для налички (договор ID 1)
      await loadServicesByContract(1)
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

  // Функция для загрузки услуг с ценами по договору
  const loadServicesByContract = async (contractId: number) => {
    try {
      const servicesData = await servicesApi.getServicesByContract(contractId)
      
      console.log("Загружены услуги для договора", contractId, ":", servicesData)
      setServices(servicesData)
    } catch (error: any) {
      console.error("Ошибка при загрузке услуг для договора", contractId, ":", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить услуги с ценами",
      })
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Преобразуем номер автомобиля в верхний регистр
    if (name === "vehicle_number") {
      setFormData((prev: FormData) => ({ ...prev, [name]: value.toUpperCase() }))
    } else {
    setFormData((prev: FormData) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: FormData) => ({ ...prev, [name]: value }))
  }

  const handleServiceSelect = (serviceId: string) => {
    // Проверяем, что выбран клиент или используется наличная оплата
    if (!selectedClientType && formData.payment_method !== "НАЛИЧНЫЕ") {
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
    
    // Проверяем, что выбрана позиция колеса для услуг снятия/установки
    if ((service.name.includes('Снятие колеса') || service.name.includes('Установка колеса')) && !selectedWheelPosition) {
      toast({
        title: "Ошибка",
        description: "Для услуг снятия/установки колес необходимо выбрать позицию колеса",
        variant: "destructive"
      })
      return
    }
    
    try {
      const wheelType = getWheelType(selectedWheelPosition || "all")
      const price = getServicePrice(service, wheelType)
      
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
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : `Для услуги "${service.name}" нет доступных цен`,
        variant: "destructive"
      })
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

    // Проверяем, что выбран клиент (кроме наличной оплаты, где клиент выбирается автоматически)
    if (!formData.client_id && formData.payment_method !== "НАЛИЧНЫЕ") {
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
      truck_type: selectedTruckType,
      services: serviceIds.map((serviceId: number) => {
        const service = services.find((s: Service) => s.id === serviceId)
        if (!service) {
          throw new Error(`Не найдена услуга с ID ${serviceId}`)
        }
        
        const wheelType = getWheelType(selectedWheelPosition || "all")
        const price = getServicePrice(service, wheelType)
        
        if (typeof price !== 'number' || isNaN(price)) {
          throw new Error(`Некорректная цена для услуги "${service.name}"`)
        }
        
        return {
          service_id: serviceId,
          service_description: service.name,
          wheel_position: selectedWheelPosition || "all",
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

  // Функция для определения типа колеса (одиночное или спаренное)
  const getWheelType = (position: string): 'single' | 'dual' => {
    if (!position || position === "all") return 'single'
    
    // Проверяем, содержит ли позиция информацию о спаренном колесе
    // Спаренное колесо имеет позиции с inner/outer
    if (position.includes('inner') || position.includes('outer')) {
      return 'dual'
    }
    
    // Одиночное колесо - все остальные позиции
    return 'single'
  }

  // Функция для получения цены услуги с учетом типа колеса
  const getServicePrice = (service: Service, wheelType: 'single' | 'dual'): number => {
    const prices = Object.values(service.prices)
    if (prices.length === 0) {
      throw new Error(`Для услуги "${service.name}" нет доступных цен`)
    }
    
    // Для услуг снятия и установки колес используем разные цены в зависимости от типа колеса
    if (service.name.includes('Снятие колеса') || service.name.includes('Установка колеса')) {
      if (wheelType === 'single' && service.name.includes('одиночка')) {
        return prices.find(price => typeof price === 'number') || prices[0]
      } else if (wheelType === 'dual' && service.name.includes('спарка')) {
        return prices.find(price => typeof price === 'number') || prices[0]
      }
    }
    
    // Для остальных услуг используем первую доступную цену
    return prices[0]
  }

  const handlePaymentMethodChange = (value: string) => {
    setFormData(prev => ({ ...prev, payment_method: value }))
    
    if (value === "НАЛИЧНЫЕ") {
      const cashClient = clients.find(c => c.client_type === "НАЛИЧКА")
      if (cashClient) {
        setSelectedClient(cashClient)
        setSelectedClientType(cashClient.client_type)
        loadServicesByContract(cashClient.contract_id)
        setClientVehicles([])
      }
    }
  }

  const handleInputChange = (name: string, value: string) => {
    // Преобразуем номер автомобиля в верхний регистр
    if (name === "vehicle_number") {
      setFormData((prev: FormData) => ({ ...prev, [name]: value.toUpperCase() }))
    } else {
      setFormData((prev: FormData) => ({ ...prev, [name]: value }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Редактирование заказа" : "Создание заказа"}</DialogTitle>
          <DialogDescription>
            {order ? "Измените данные заказа" : "Заполните данные для создания нового заказа"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {shouldShowClientSelection && (
                  <>
                <div className="space-y-2">
                  <Label>Тип клиента</Label>
                  <Select
                    value={selectedClientType}
                    onValueChange={setSelectedClientType}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "ФИЗЛИЦА" ? "Физическое лицо" : 
                           type === "КОНТРАГЕНТЫ" ? "Контрагент" : 
                           type === "АГРЕГАТОРЫ" ? "Агрегатор" : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Клиент</Label>
                <Select
                  value={selectedClient?.id.toString() || ""}
                  onValueChange={handleClientSelect}
                  disabled={loading || submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                      {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
                  </>
                )}

                {!shouldShowClientSelection && cashClient && (
                  <div className="space-y-2">
                    <Label>Клиент</Label>
                    <div className="p-3 border rounded-md bg-muted">
                      <span className="font-medium">{cashClient.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">(автоматически выбран для наличной оплаты)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {selectedClient && selectedClient.client_type !== "НАЛИЧКА" ? (
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Машина клиента</Label>
                    <Select
                      value={formData.vehicle_number}
                      onValueChange={(value) => handleSelectChange("vehicle_number", value)}
                      disabled={!!(selectedClient && selectedClient.client_type !== "НАЛИЧКА" && loadingVehicles)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите машину" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.number}>
                            {vehicle.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Номер автомобиля</Label>
                    <Input
                      id="vehicle_number"
                      value={formData.vehicle_number}
                      onChange={(e) => handleInputChange("vehicle_number", e.target.value)}
                      placeholder="Введите номер автомобиля"
                      required
                      disabled={!!(selectedClient && selectedClient.client_type !== "НАЛИЧКА" && loadingVehicles)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Позиция колеса</Label>
              <WheelPositionSelector
                value={selectedWheelPosition}
                onChange={setSelectedWheelPosition}
                truckType={selectedTruckType}
                onTruckTypeChange={setSelectedTruckType}
              />
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
                    {Array.isArray(services) && services
                      .filter(service => !formData.service_ids.includes(service.id.toString()))
                      .map((service) => {
                        try {
                          const wheelType = getWheelType(selectedWheelPosition || "all")
                          const price = getServicePrice(service, wheelType)
                          return (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name} - {price} ₽ {wheelType === 'dual' ? '(спарка)' : '(одиночка)'}
                            </SelectItem>
                          )
                        } catch (error) {
                          return (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name} - ошибка расчета цены
                            </SelectItem>
                          )
                        }
                      })}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label>Выбранные услуги</Label>
                  <div className="space-y-2">
                    {formData.service_ids.map((serviceId) => {
                      const service = services.find(s => s.id.toString() === serviceId)
                      if (!service) return null
                      
                      try {
                        const wheelType = getWheelType(selectedWheelPosition || "all")
                        const price = getServicePrice(service, wheelType)
                        
                        return (
                          <div key={serviceId} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <span className="font-medium">{service.name}</span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                {price} ₽ {wheelType === 'dual' ? '(спарка)' : '(одиночка)'}
                              </span>
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
                      } catch (error) {
                        return (
                          <div key={serviceId} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <span className="font-medium">{service.name}</span>
                              <span className="ml-2 text-sm text-red-500">Ошибка расчета цены</span>
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
                      }
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="payment_method">Способ оплаты</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={handlePaymentMethodChange}
                disabled={loading || submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите способ оплаты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="НАЛИЧНЫЕ">Наличные</SelectItem>
                    <SelectItem value="ПЕРЕВОД">Перевод</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Общая сумма</Label>
                <div className="text-2xl font-bold">{totalAmount} ₽</div>
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