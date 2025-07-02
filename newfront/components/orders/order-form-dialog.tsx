"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi, clientsApi, servicesApi, workersApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { WheelPositionSelector } from "./wheel-position-selector"

interface Vehicle {
  id: number
  number: string
  model: string
  year: number
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

interface Worker {
  id: number
  name: string
  surname: string
}

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: any
  onSuccess: () => void
}

interface FormData {
  worker_id: string
  vehicle_number: string
  payment_method: string
  total_amount: number
  service_ids: number[]
}

export function OrderFormDialog({ open, onOpenChange, order, onSuccess }: OrderFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData>({
    worker_id: "",
    vehicle_number: "",
    payment_method: "cash",
    total_amount: 0,
    service_ids: [],
  })

  const [totalAmount, setTotalAmount] = useState(0)
  const [selectedClientType, setSelectedClientType] = useState("")
  const [selectedTruckType, setSelectedTruckType] = useState<"type1" | "type2" | null>(null)
  const [selectedWheelPosition, setSelectedWheelPosition] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedServices, setSelectedServices] = useState<Array<{
    serviceId: number
    wheelPosition: string
    description: string
  }>>([])

  // Фильтруем клиентов по типу
  const filteredClients = useMemo(() => {
    if (selectedClientType) {
      return clients.filter(client => client.client_type === selectedClientType)
    }
    return clients
  }, [selectedClientType, clients])

  // Сбрасываем выбор клиента при изменении типа
  useEffect(() => {
    setSelectedClient(null)
    setServices([])
  }, [selectedClientType])

  // Получаем уникальные типы клиентов
  const clientTypes = useMemo(() => {
    const types = new Set(clients.map(client => client.client_type))
    return Array.from(types)
  }, [clients])

  // Фильтруем машины по выбранному клиенту
  const filteredVehicles = useMemo(() => {
    if (!selectedClient) return []
    return clientVehicles.filter(vehicle => 
      selectedClient.car_numbers?.includes(vehicle.number)
    )
  }, [selectedClient, clientVehicles])

  const paymentMethods = [
    { value: "НАЛИЧНЫЕ", label: "Наличные" },
    { value: "ПЕРЕВОД", label: "Перевод" },
    { value: "КАРТА", label: "Карта" }
  ]

  // Получаем клиента "Наличка" для наличных платежей
  const cashClient = clients.find(client => client.name === "Наличка" && client.client_type === "НАЛИЧКА")

  // Фильтруем методы оплаты в зависимости от типа клиента
  const availablePaymentMethods = selectedClientType === "КОНТРАГЕНТЫ" || selectedClientType === "АГРЕГАТОРЫ"
    ? paymentMethods.filter(method => method.value === "ПЕРЕВОД")
    : paymentMethods

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

  // Инициализация формы при открытии диалога
  useEffect(() => {
    if (open) {
      if (order) {
        setFormData({
          worker_id: order.worker_id?.toString() || "",
          vehicle_number: order.vehicle_number || "",
          payment_method: order.payment_method || "НАЛИЧНЫЕ",
          total_amount: order.total_amount || 0,
          service_ids: order.services?.map((s: any) => s.service_id) || []
        })
        
        // Устанавливаем выбранного клиента
        if (order.client) {
          setSelectedClient(order.client)
          loadServicesByContract(order.client.contract_id)
        }
      } else {
        setFormData({
          worker_id: "",
          vehicle_number: "",
          payment_method: "НАЛИЧНЫЕ",
          total_amount: 0,
          service_ids: []
        })
        setSelectedClient(null)
        setServices([])
      }
    }
  }, [open, order])

  // Пересчитываем общую сумму при изменении выбранных услуг
  useEffect(() => {
    let total = 0
    formData.service_ids.forEach((serviceId) => {
      const service = services.find((s: Service) => s.id === serviceId)
      
      if (!service) {
        console.warn(`Не найдена услуга с ID ${serviceId}`)
        return
      }
      
      try {
        const wheelType = getWheelType(selectedWheelPosition || "all")
        const price = getServicePrice(service, wheelType)
        
        if (typeof price !== 'number' || isNaN(price)) {
          console.warn(`Некорректная цена для услуги ${serviceId}: ${price}`)
          return
        }
        
        console.log(`Добавляем цену услуги ${serviceId} (${service.name}) для типа колеса ${wheelType}: ${price}`)
        total += price
      } catch (error) {
        console.warn(`Ошибка при расчете цены для услуги ${serviceId}:`, error)
        return
      }
    })
    
    console.log("Итоговая сумма:", total)
    setTotalAmount(total)
  }, [formData.service_ids, services, selectedWheelPosition])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [clientsData, workersData] = await Promise.all([
        clientsApi.getAll(),
        workersApi.getAll()
      ])
      
      // Проверяем и форматируем данные
      const formattedClients = clientsData.map((client: any) => ({
        ...client,
        id: client.id || 0,
        name: client.name || '',
        client_type: client.client_type || '',
        owner_phone: client.owner_phone || '',
        manager_phone: client.manager_phone || '',
        contract_id: client.contract_id || 0,
        car_numbers: client.car_numbers || [],
        created_at: client.created_at || '',
        updated_at: client.updated_at || ''
      }))
      
      const formattedWorkers = workersData.map((worker: any) => ({
        ...worker,
        id: worker.id || 0,
        name: worker.name || '',
        surname: worker.surname || ''
      }))
      
      console.log("Полученные данные:", {
        clients: formattedClients,
        workers: formattedWorkers
      })

      setClients(formattedClients)
      setWorkers(formattedWorkers)
      
      // Загружаем услуги с ценами для налички (договор ID 1)
      await loadServicesByContract(1)
    } catch (error: any) {
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
      
      const formattedServices = servicesData.map((service: any) => ({
        ...service,
        id: service.id || 0,
        name: service.name || '',
        price: service.price || 0,
        contract_id: service.contract_id || 0,
        material_card: service.material_card || 0,
        created_at: service.created_at || '',
        updated_at: service.updated_at || ''
      }))
      
      console.log("Загружены услуги для договора", contractId, ":", formattedServices)
      setServices(formattedServices)
    } catch (error: any) {
      console.error("Ошибка при загрузке услуг для договора", contractId, ":", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить услуги с ценами",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Преобразуем номер автомобиля в верхний регистр
    if (name === "vehicle_number") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
    } else {
    setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (!value) return;
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleServiceSelect = (serviceId: string) => {
    const serviceIdNum = parseInt(serviceId)
    const isChecked = !formData.service_ids.includes(serviceIdNum)
    
    if (isChecked) {
      const service = services.find(s => s.id === serviceIdNum)
      if (service) {
        setSelectedServices(prev => [...prev, {
          serviceId: serviceIdNum,
          wheelPosition: "",
          description: service.name
        }])
        setFormData(prev => ({
          ...prev,
          service_ids: [...prev.service_ids, serviceIdNum]
        }))
      }
    } else {
      setSelectedServices(prev => prev.filter(s => s.serviceId !== serviceIdNum))
      setFormData(prev => ({
        ...prev,
        service_ids: prev.service_ids.filter(id => id !== serviceIdNum)
      }))
    }
  }

  const handleRemoveService = (serviceId: number) => {
    console.log("Удаление услуги с ID:", serviceId)
    setFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.filter(id => id !== serviceId)
    }))
  }

  const getPositionText = (position: string): string => {
    if (!position) return "Все"
    if (position === "spare") return "Запасное колесо"
    
    const parts = position.split("_")
    const side = parts[0] === "left" ? "Левое" : "Правое"
    const axle = parts[1]
    const dualPosition = parts[2] || ""
    
    let axleText = ""
    if (axle === "1") {
      axleText = "рулевое"
    } else {
      axleText = `${axle}-я ось`
    }

    let positionText = ""
    if (dualPosition === "inner") {
      positionText = "внутреннее"
    } else if (dualPosition === "outer") {
      positionText = "внешнее"
    }

    return `${side} ${axleText}${positionText ? ` ${positionText}` : ""}`
  }

  // Функция для определения типа колеса по позиции
  const getWheelType = (position: string) => {
    if (position.includes("спарка")) return "спарка"
    return "одиночка"
  }

  // Функция для получения цены услуги
  const getServicePrice = (service: Service, wheelType: string) => {
    const basePrice = service.price
    
    // Для услуг снятия и установки колес цена зависит от типа колеса
    if (service.name.includes("Снятие") || service.name.includes("Установка")) {
      if (service.name.includes("спарка")) {
        return wheelType === "спарка" ? basePrice : 0
      } else {
        return wheelType === "одиночка" ? basePrice : 0
      }
    }
    
    return basePrice
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.worker_id || !formData.vehicle_number || !formData.payment_method) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive"
      })
      return
    }

    if (formData.service_ids.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну услугу",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      // Подготавливаем данные для отправки
      const orderData = {
        client_id: selectedClient?.id || 0,
        worker_id: parseInt(formData.worker_id),
        vehicle_number: formData.vehicle_number,
        payment_method: formData.payment_method,
        total_amount: formData.total_amount,
        services: formData.service_ids.map(serviceId => {
          const service = services.find(s => s.id === serviceId)
          const selectedService = selectedServices.find(s => s.serviceId === serviceId)
          return {
            service_id: serviceId,
            description: service?.name || "",
            wheel_position: selectedService?.wheelPosition || "",
            price: service?.price || 0
          }
        })
      }

      await ordersApi.createManager(orderData as any)
      
      toast({
        title: "Успешно",
        description: "Заказ создан",
      })
      
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать заказ",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Функция для сброса формы
  const resetForm = () => {
    setFormData({
      worker_id: "",
      vehicle_number: "",
      payment_method: "",
      total_amount: 0,
      service_ids: []
    })
    setSelectedClient(null)
    setSelectedServices([])
    setSelectedWheelPosition("")
  }

  // Обработчик изменения способа оплаты
  const handlePaymentMethodChange = (method: string) => {
    setFormData(prev => ({ ...prev, payment_method: method }))
    
    if (method === "НАЛИЧНЫЕ") {
      // Для наличной оплаты автоматически выбираем клиента "Наличка"
      const cashClient = clients.find(client => client.client_type === "НАЛИЧКА")
      if (cashClient) {
        setSelectedClient(cashClient)
        loadServicesByContract(cashClient.contract_id)
      }
    } else {
      // Для других способов оплаты сбрасываем выбор клиента
      setSelectedClient(null)
      setServices([])
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="order-dialog-description">
        <DialogHeader>
          <DialogTitle>{order ? "Редактирование заказа" : "Создание нового заказа"}</DialogTitle>
          <DialogDescription id="order-dialog-description">
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
                  value={selectedClient?.id?.toString() || ""}
                  onValueChange={(value) => handleClientSelect(value)}
                  required
                  disabled={formData.payment_method === "НАЛИЧНЫЕ"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} ({client.client_type})
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
                <Label htmlFor="worker_id">Работник</Label>
                <Select
                  value={formData.worker_id || ""}
                  onValueChange={(value) => handleSelectChange("worker_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите работника" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id?.toString() || ""}>
                        {`${worker.name} ${worker.surname}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_number">Номер автомобиля</Label>
              {selectedClient && selectedClient.client_type !== "НАЛИЧКА" && clientVehicles.length > 0 ? (
                <Select
                  value={formData.vehicle_number}
                  onValueChange={(value) => handleSelectChange("vehicle_number", value)}
                  disabled={!!(selectedClient && selectedClient.client_type !== "НАЛИЧКА" && loadingVehicles)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите автомобиль" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.number}>
                        {vehicle.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="vehicle_number"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  placeholder="Введите номер автомобиля"
                  required
                  disabled={!!(selectedClient && selectedClient.client_type !== "НАЛИЧКА" && loadingVehicles)}
                />
              )}
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
                    {services
                      .filter(service => !formData.service_ids.includes(service.id))
                      .map((service) => {
                        try {
                          const wheelType = getWheelType(selectedWheelPosition || "all")
                          const price = getServicePrice(service, wheelType)
                          return (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name} - {price} ₽ {wheelType === 'спарка' ? '(спарка)' : '(одиночка)'}
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
                      const service = services.find(s => s.id === serviceId)
                      if (!service) return null
                      
                      try {
                        const wheelType = getWheelType(selectedWheelPosition || "all")
                        const price = getServicePrice(service, wheelType)
                        
                        return (
                          <div key={serviceId} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <span className="font-medium">{service.name}</span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                {price} ₽ {wheelType === 'спарка' ? '(спарка)' : '(одиночка)'}
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

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Способ оплаты</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handlePaymentMethodChange(value)}
                  disabled={loading || submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите способ оплаты" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Общая сумма</Label>
                <div className="text-2xl font-bold">{totalAmount} ₽</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Дополнительные заметки</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Дополнительные заметки..."
                className="min-h-[100px]"
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