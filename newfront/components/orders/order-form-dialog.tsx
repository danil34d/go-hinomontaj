"use client"

import { useState, useEffect } from "react"
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
import { WheelPositionSelector, WheelPosition } from "./wheel-position-selector"

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: any
  onSuccess: () => void
}

export function OrderFormDialog({ open, onOpenChange, order, onSuccess }: OrderFormDialogProps) {
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    client_id: "",
    worker_id: "",
    vehicle_number: "",
    payment_method: "cash",
    description: "",
    service_ids: [] as number[],
  })

  const [totalAmount, setTotalAmount] = useState(0)
  const [selectedClientType, setSelectedClientType] = useState("")
  const [selectedTruckType, setSelectedTruckType] = useState<"type1" | "type2" | null>(null)
  const [selectedWheelPosition, setSelectedWheelPosition] = useState<string | null>(null)

  // Получаем уникальные типы клиентов
  const clientTypes = Array.from(new Set(clients.map(client => client.client_type)))

  // Фильтруем клиентов по выбранному типу
  const filteredClients = clients.filter(client => client.client_type === selectedClientType)

  const paymentMethods = [
    { value: "cash", label: "Наличные" },
    { value: "card", label: "Карта" },
    { value: "invoice", label: "Безналичный расчет" },
  ]

  // Фильтруем методы оплаты в зависимости от типа клиента
  const availablePaymentMethods = selectedClientType === "КОНТРАГЕНТЫ" || selectedClientType === "АГРЕГАТОРЫ"
    ? paymentMethods.filter(method => method.value === "invoice")
    : paymentMethods

  // Если выбран контрагент или агрегатор и метод оплаты наличными или картой, меняем на безналичный
  useEffect(() => {
    if ((selectedClientType === "КОНТРАГЕНТЫ" || selectedClientType === "АГРЕГАТОРЫ") && 
        (formData.payment_method === "cash" || formData.payment_method === "card")) {
      setFormData(prev => ({ ...prev, payment_method: "invoice" }))
    }
  }, [selectedClientType])

  useEffect(() => {
    if (open) {
      fetchData()
      if (order) {
        setFormData({
          client_id: order.client_id?.toString() || "",
          worker_id: order.worker_id?.toString() || "",
          vehicle_number: order.vehicle_number || "",
          payment_method: order.payment_method || "cash",
          description: order.description || "",
          service_ids: order.services?.map(service => service.service_id) || [],
        })
      } else {
        setFormData({
          client_id: "",
          worker_id: "",
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
      const selectedClient = clients.find(c => c.id?.toString() === formData.client_id)
      if (selectedClient) {
        setSelectedClientType(selectedClient.client_type || "")
      }
    } else {
      setSelectedClientType("")
    }
  }, [formData.client_id, clients])

  // Сбрасываем выбранного клиента при изменении типа клиента
  useEffect(() => {
    setFormData(prev => ({ ...prev, client_id: "" }))
  }, [selectedClientType])

  useEffect(() => {
    // Пересчитываем общую сумму при изменении выбранных услуг или типа клиента
    console.log("Пересчет общей суммы. Выбранные услуги:", formData.service_ids)
    console.log("Доступные услуги:", services)
    console.log("Тип клиента:", selectedClientType)
    
    const total = formData.service_ids.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId)
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
      const [clientsData, servicesData, workersData] = await Promise.all([
        clientsApi.getAll(),
        servicesApi.getAll(),
        workersApi.getAll()
      ])
      
      // Проверяем и форматируем данные
      const formattedClients = clientsData.map(client => ({
        ...client,
        id: client.id || 0,
        name: client.name || '',
        client_type: client.client_type || ''
      }))

      const formattedServices = servicesData.map(service => ({
        ...service,
        id: service.id || 0,
        name: service.name || '',
        prices: service.prices || {}
      }))
      
      const formattedWorkers = workersData.map(worker => ({
        ...worker,
        id: worker.id || 0,
        name: worker.name || '',
        surname: worker.surname || ''
      }))
      
      console.log("Полученные данные:", {
        clients: formattedClients,
        services: formattedServices,
        workers: formattedWorkers
      })

      setClients(formattedClients)
      setServices(formattedServices)
      setWorkers(formattedWorkers)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    // Преобразуем номер автомобиля в верхний регистр
    if (name === "vehicle_number") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name, value) => {
    if (!value) return;
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleServiceSelect = (serviceId: string) => {
    const serviceIdNum = parseInt(serviceId)
    console.log("Выбрана услуга с ID:", serviceIdNum)
    
    if (!selectedClientType) {
      toast({
        title: "Ошибка",
        description: "Сначала выберите клиента",
        variant: "destructive"
      })
      return
    }
    
    const service = services.find(s => s.id === serviceIdNum)
    if (!service) {
      console.warn(`Не найдена услуга с ID ${serviceIdNum}`)
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
    
    if (!formData.service_ids.includes(serviceIdNum)) {
      if (!selectedWheelPosition) {
        toast({
          title: "Ошибка",
          description: "Выберите позицию колеса",
          variant: "destructive"
        })
        return
      }
      
      setFormData(prev => ({
        ...prev,
        service_ids: [...prev.service_ids, serviceIdNum]
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      // Проверяем, что client_id существует
      if (!formData.client_id) {
        throw new Error("Необходимо выбрать клиента")
      }

      // Проверяем, что все ID корректно преобразуются в числа
      const clientId = parseInt(formData.client_id)
      const workerId = parseInt(formData.worker_id)

      if (isNaN(clientId)) {
        throw new Error("Некорректный ID клиента")
      }
      if (isNaN(workerId)) {
        throw new Error("Некорректный ID работника")
      }

      const orderData = {
        client_id: clientId,
        worker_id: workerId,
        vehicle_number: formData.vehicle_number,
        payment_method: formData.payment_method,
        total_amount: totalAmount,
        truck_type: selectedTruckType,
        services: formData.service_ids.map(serviceId => {
          const service = services.find(s => s.id === serviceId)
          if (!service) {
            throw new Error(`Услуга ${serviceId} не найдена`)
          }
          const price = service.prices[selectedClientType]
          if (price === undefined || price === null) {
            throw new Error(`Для услуги ${service.name} не найдена цена для типа клиента ${selectedClientType}`)
          }
          return {
            service_id: service.id,
            service_description: service.name,
            wheel_position: getPositionText(selectedWheelPosition || "all"),
            price: price
          }
        })
      }

      console.log("Отправляемые данные заказа:", orderData)

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
    } catch (error) {
      console.error("Ошибка при создании заказа:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    value={formData.client_id || ""}
                    onValueChange={(value) => handleSelectChange("client_id", value)}
                    required
                    disabled={!selectedClientType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClients.map((client) => (
                        <SelectItem key={client.id} value={client.id?.toString() || ""}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              <Input
                id="vehicle_number"
                name="vehicle_number"
                placeholder="А123БВ777"
                value={formData.vehicle_number}
                onChange={handleChange}
                required
              />
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
                      .map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - {service.prices[selectedClientType] || 0} ₽
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label>Выбранные услуги</Label>
                  <div className="space-y-2">
                    {formData.service_ids.map((serviceId) => {
                      const service = services.find(s => s.id === serviceId)
                      return service ? (
                        <div key={serviceId} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <span className="font-medium">{service.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">{service.prices[selectedClientType] || 0} ₽</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(serviceId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null
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