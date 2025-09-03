"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi, clientsApi, servicesApi, workersApi, materialsApi, fetchWithAuth } from "@/lib/api"
import type { OrderService as ApiOrderService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { X, Info } from "lucide-react"
import ClientComparisonDialog from "./client-comparison-dialog"

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
  client_id: number | null
  worker_id: string
  vehicle_number: string
  payment_method: string
  total_amount: number
  description: string
  status: string
  services: Array<{
    service_id: number
    description: string
    price: number
  }>
  materials: Array<{
    material_id: number
    quantity: number
  }>
}

interface ExistingOrderServicePrefill {
  service_id: number
  description: string
  price: number
}

export function OrderFormDialog({ open, onOpenChange, order, onSuccess }: OrderFormDialogProps) {
  const [services, setServices] = useState<Service[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([])
  const [materials, setMaterials] = useState<any[]>([])

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const { toast } = useToast()

  // Состояние формы
  const [formData, setFormData] = useState<FormData>({
    client_id: null,
    worker_id: "",
    vehicle_number: "",
    payment_method: "",
    total_amount: 0,
    description: "",
    status: "запланирован",
    services: [],
    materials: [],
  })

  // Состояния для пошагового выбора
  const [selectedClientType, setSelectedClientType] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  // Состояния для обработки машин агрегаторов
  const [whooseCarClients, setWhooseCarClients] = useState<Client[]>([])
  const [contractComparison, setContractComparison] = useState<Array<{
    client: Client
    services: Service[]
  }>>([])
  const [showContractComparison, setShowContractComparison] = useState(false)
  const [checkingVehicle, setCheckingVehicle] = useState(false)
  
  // Состояние для нового диалога сравнения
  const [showClientComparison, setShowClientComparison] = useState(false)
  const [currentCarNumber, setCurrentCarNumber] = useState("")

  // Состояния для произвольной услуги
  const [customServiceName, setCustomServiceName] = useState("")
  const [customServicePrice, setCustomServicePrice] = useState("")

  // Типы клиентов
  const clientTypes = [
    { value: "НАЛИЧКА", label: "Наличка" },
    { value: "КОНТРАГЕНТЫ", label: "Контрагенты" },
    { value: "АГРЕГАТОРЫ", label: "Агрегаторы" }
  ]

  // Способы оплаты в зависимости от типа клиента
  const getPaymentMethods = () => {
    if (selectedClientType === "НАЛИЧКА") {
      return [
        { value: "НАЛИЧНЫЕ", label: "Наличные" },
        { value: "ПЕРЕВОД", label: "Перевод" },
        { value: "КАРТА", label: "Карта" }
      ]
    }
    return [{ value: "ДОГОВОР", label: "По договору" }]
  }

  // Инициализация данных при открытии диалога
  useEffect(() => {
    if (!open) return
    if (order) {
      setFormData({
        client_id: order.client_id ?? null,
        worker_id: String(order.worker_id ?? ""),
        vehicle_number: order.vehicle_number ?? "",
        payment_method: order.payment_method ?? "",
        total_amount: Number(order.total_amount ?? 0),
        description: "",
        status: order.status ?? "запланирован",
        services: Array.isArray(order.services)
          ? order.services.map((s: ApiOrderService): ExistingOrderServicePrefill => ({ service_id: s.service_id, description: s.description, price: Number(s.price) }))
          : [],
        materials: [],
      })
    } else {
      setFormData(prev => ({ ...prev }))
    }
  }, [open, order])

  // Сброс формы при изменении типа клиента
  useEffect(() => {
    if (selectedClientType) {
      setSelectedClient(null)
      setSelectedVehicle(null)
      setClientVehicles([])
      setServices([])
      setFormData(prev => ({
        ...prev,
        client_id: null,
        vehicle_number: "",
        payment_method: selectedClientType === "НАЛИЧКА" ? "cash" : "contract",
        services: []
      }))
      
      if (selectedClientType === "НАЛИЧКА") {
        // Для налички загружаем услуги по договору ID=1
        loadServicesByContract(1)
        setFormData(prev => ({ ...prev, client_id: 1 })) // Устанавливаем клиента с ID=1 для налички
      } else {
        // Для других типов загружаем клиентов этого типа
        loadClientsByType(selectedClientType)
      }
    }
  }, [selectedClientType])

  // Обработка выбора клиента
  useEffect(() => {
    if (selectedClient) {
      setFormData(prev => ({ 
        ...prev, 
        client_id: selectedClient.id,
        payment_method: "contract"
      }))
      loadServicesByContract(selectedClient.contract_id)
      fetchClientVehicles(selectedClient.id)
    }
  }, [selectedClient])

  // Пересчет общей суммы при изменении услуг
  useEffect(() => {
    const total = formData.services.reduce((sum, service) => sum + service.price, 0)
    setFormData(prev => ({ ...prev, total_amount: total }))
  }, [formData.services])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [workersData, materialsData] = await Promise.all([
        workersApi.getAll(),
        materialsApi.getAll()
      ])
      setWorkers(workersData)
      setMaterials(materialsData)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadClientsByType = async (clientType: string) => {
    try {
      const clientsData = await clientsApi.getAll()
      const filteredClients = clientsData.filter((client: Client) => client.client_type === clientType)
      setClients(filteredClients)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить клиентов",
      })
    }
  }

  const loadServicesByContract = async (contractId: number) => {
    try {
      const servicesData = await servicesApi.getServicesByContract(contractId)
      setServices(servicesData)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить услуги",
      })
    }
  }

  const fetchClientVehicles = async (clientId: number) => {
    try {
      setLoadingVehicles(true)
      const vehicles = await clientsApi.getVehicles(clientId)
      setClientVehicles(vehicles)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить автомобили клиента",
      })
    } finally {
      setLoadingVehicles(false)
    }
  }

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { material_id: 0, quantity: 1 }]
    }))
  }

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }))
  }

  const updateMaterial = (index: number, field: 'material_id' | 'quantity', value: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }))
  }

  const handleVehicleNumberBlur = async () => {
    if (!formData.vehicle_number || selectedClientType === "НАЛИЧКА") return
    
    setCheckingVehicle(true)
    try {
      const ownersData = await clientsApi.whooseCar(formData.vehicle_number)
      const filteredOwners = ownersData.filter((client: Client) => client.client_type === selectedClientType)
      setWhooseCarClients(filteredOwners)
      
      if (selectedClientType === "АГРЕГАТОРЫ" && filteredOwners.length > 1) {
        // Получаем цены для каждого агрегатора
        const comparisons = await Promise.all(
          filteredOwners.map(async (client: Client) => {
            const services = await servicesApi.getServicesByContract(client.contract_id)
            return { client, services }
          })
        )
        setContractComparison(comparisons)
        setShowContractComparison(true)
      } else if (filteredOwners.length === 1) {
        // Автоматически выбираем единственного владельца
        setSelectedClient(filteredOwners[0])
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка", 
          description: "Владелец машины не найден среди выбранного типа клиентов",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось проверить владельца машины",
      })
    } finally {
      setCheckingVehicle(false)
    }
  }

  const handleContractSelect = (selectedComparison: { client: Client; services: Service[] }) => {
    setSelectedClient(selectedComparison.client)
    setShowContractComparison(false)
    setContractComparison([])
  }

  // Проверка машины на принадлежность нескольким клиентам
  const checkVehicleOwnership = async (vehicleNumber: string) => {
    if (!vehicleNumber.trim()) return false
    
    try {
      const cleanNumber = vehicleNumber.replace(/\s+/g, '')
      const owners = await clientsApi.compareClientsForCar(cleanNumber)
      
      if (owners.length > 1) {
        // Машина принадлежит нескольким клиентам - показываем диалог сравнения
        setCurrentCarNumber(vehicleNumber)
        setShowClientComparison(true)
        return true
      }
      
      return false
    } catch (error) {
      console.error("Ошибка проверки владельца машины:", error)
      return false
    }
  }

  // Обработчик выбора клиента из диалога сравнения
  const handleClientFromComparison = async (clientId: number, clientName: string) => {
    try {
      // Если список клиентов пуст, загружаем всех клиентов
      let allClients = clients
      if (allClients.length === 0) {
        allClients = await clientsApi.getAll()
      }
      
      // Находим клиента из списка
      const client = allClients.find(c => c.id === clientId)
      if (client) {
        setSelectedClient(client)
        setSelectedClientType(client.client_type)
        setClients(allClients) // Обновляем состояние клиентов
        
        setFormData(prev => ({ 
          ...prev, 
          client_id: clientId, 
          vehicle_number: currentCarNumber,
          payment_method: client.client_type === "НАЛИЧКА" ? "cash" : "contract"
        }))
        
        // Создаем объект Vehicle для selectedVehicle
        const vehicleObj: Vehicle = {
          id: 0, // Временный ID
          number: currentCarNumber,
          model: "Неизвестно", // Временные данные
          year: 0
        }
        setSelectedVehicle(vehicleObj)
        
        // Загружаем услуги для выбранного клиента
        await loadServicesByContract(client.contract_id)
        
        toast({
          title: "Клиент выбран",
          description: `Выбран клиент: ${clientName}`,
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось выбрать клиента",
      })
    }
  }

  const handleServiceAdd = (serviceId: string) => {
    const service = services.find(s => s.id === parseInt(serviceId))
    if (!service) return

    const serviceIdNum = parseInt(serviceId)
    const newService = {
      service_id: serviceIdNum,
      description: service.name,
      price: service.price
    }

    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }))
  }

  const handleServiceRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }))
  }

  const handleCustomServiceAdd = () => {
    if (!customServiceName || !customServicePrice) return

    const newService = {
      service_id: 1, // Используем специальную услугу для произвольных услуг
      description: customServiceName,
      price: parseFloat(customServicePrice)
    }

    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }))

    // Очищаем поля ввода
    setCustomServiceName("")
    setCustomServicePrice("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация
    if (!selectedClientType) {
      toast({ variant: "destructive", title: "Ошибка", description: "Выберите тип клиента" })
      return
    }
    
    if (selectedClientType !== "НАЛИЧКА" && !selectedClient) {
      toast({ variant: "destructive", title: "Ошибка", description: "Выберите клиента" })
      return
    }
    
    if (selectedClientType !== "НАЛИЧКА" && !formData.vehicle_number) {
      toast({ variant: "destructive", title: "Ошибка", description: "Введите номер машины" })
      return
    }

    if (selectedClientType !== "НАЛИЧКА" && selectedClientType !== "АГРЕГАТОРЫ" && !selectedVehicle) {
      toast({ variant: "destructive", title: "Ошибка", description: "Выберите машину из списка клиента" })
      return
    }
    
    if (!formData.worker_id) {
      toast({ variant: "destructive", title: "Ошибка", description: "Выберите работника" })
      return
    }
    
    if (formData.services.length === 0) {
      toast({ variant: "destructive", title: "Ошибка", description: "Добавьте хотя бы одну услугу" })
      return
    }

    try {
      setSubmitting(true)
      
      // Сначала вычитаем расходники со склада
      if (formData.materials.length > 0) {
        for (const material of formData.materials) {
          if (material.material_id > 0 && material.quantity > 0) {
            try {
              await materialsApi.subtractQuantity(material.material_id, material.quantity)
            } catch (error: any) {
              toast({
                variant: "destructive",
                title: "Ошибка",
                description: `Не удалось вычесть расходник: ${error.message}`,
              })
              return
            }
          }
        }
      }
      
      const orderData = {
        client_id: selectedClientType === "НАЛИЧКА" ? 1 : formData.client_id,
        worker_id: parseInt(formData.worker_id),
        vehicle_number: formData.vehicle_number || "",
        payment_method: formData.payment_method || (selectedClientType === "НАЛИЧКА" ? "cash" : "contract"),
        total_amount: formData.total_amount,
        description: formData.description,
        status: formData.status,
        services: formData.services.map(service => ({
          service_id: service.service_id,
          description: service.description,
          price: service.price,
          wheel_position: ""
        }))
      }

      if (order?.id) {
        await ordersApi.update(order.id, orderData)
        toast({
          title: "Успешно",
          description: "Заказ обновлен",
        })
      } else {
      await ordersApi.createManager(orderData)
      toast({
        title: "Успешно",
        description: "Заказ создан и расходники вычтены со склада",
      })
      }
      
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || (order?.id ? "Не удалось обновить заказ" : "Не удалось создать заказ"),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      client_id: null,
      worker_id: "",
      vehicle_number: "",
      payment_method: "",
      total_amount: 0,
      description: "",
      status: "запланирован",
      services: [],
      materials: [],
    })
    setSelectedClientType("")
    setSelectedClient(null)
    setSelectedVehicle(null)
    setClientVehicles([])
    setServices([])
    setWhooseCarClients([])
    setContractComparison([])
    setShowContractComparison(false)
    setCustomServiceName("")
    setCustomServicePrice("")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{order ? "Редактирование заказа" : "Создание нового заказа"}</DialogTitle>
            <DialogDescription>
              Заполните форму для создания нового заказа
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Шаг 1: Выбор типа клиента */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Тип клиента *</Label>
                  <Select value={selectedClientType} onValueChange={setSelectedClientType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Способ оплаты - только для налички */}
                {selectedClientType === "НАЛИЧКА" && (
                  <div className="space-y-2">
                    <Label>Способ оплаты *</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите способ оплаты" />
                      </SelectTrigger>
                      <SelectContent>
                        {getPaymentMethods().map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Выбор статуса заказа */}
                <div className="space-y-2">
                  <Label>Статус заказа *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статус заказа" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="запланирован">Запланирован</SelectItem>
                      <SelectItem value="выполняется">Выполняется</SelectItem>
                      <SelectItem value="выполнен">Выполнен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Шаг 2: Выбор клиента (для контрагентов и агрегаторов) */}
              {(selectedClientType === "КОНТРАГЕНТЫ" || selectedClientType === "АГРЕГАТОРЫ") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Клиент *</Label>
                    <Select 
                      value={selectedClient?.id.toString() || ""} 
                      onValueChange={(value) => {
                        const client = clients.find(c => c.id.toString() === value)
                        setSelectedClient(client || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name} ({client.owner_phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedClient && (
                    <>
                      <div className="space-y-2">
                        <Label>Номер машины *</Label>
                        <Input
                          value={formData.vehicle_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
                          onBlur={async () => {
                            // Сначала проверяем на множественных владельцев
                            const hasMultipleOwners = await checkVehicleOwnership(formData.vehicle_number)
                            
                            // Если машина принадлежит только одному клиенту, выполняем стандартную проверку
                            if (!hasMultipleOwners) {
                              await handleVehicleNumberBlur()
                            }
                          }}
                          placeholder="Введите номер машины"
                          disabled={checkingVehicle}
                        />
                        {checkingVehicle && <p className="text-sm text-muted-foreground">Проверяем владельца машины...</p>}
                      </div>

                      {clientVehicles.length > 0 && (
                        <div className="space-y-2">
                          <Label>Выбор машины из списка клиента *</Label>
                          <Select 
                            value={selectedVehicle?.number || ""} 
                            onValueChange={async (value) => {
                              const vehicle = clientVehicles.find(v => v.number === value)
                              
                              // Проверяем принадлежность машины нескольким клиентам
                              const hasMultipleOwners = await checkVehicleOwnership(value)
                              
                              if (!hasMultipleOwners) {
                                // Машина принадлежит только одному клиенту
                                setSelectedVehicle(vehicle || null)
                                setFormData(prev => ({ ...prev, vehicle_number: value }))
                              }
                              // Если машина принадлежит нескольким клиентам, 
                              // то диалог сравнения откроется автоматически
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите машину из списка" />
                            </SelectTrigger>
                            <SelectContent>
                              {clientVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.number}>
                                  {vehicle.number} - {vehicle.model} ({vehicle.year})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Номер машины для налички */}
              {selectedClientType === "НАЛИЧКА" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Номер машины (необязательно)</Label>
                    <Input
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
                      onBlur={async () => {
                        // Проверяем машину на множественных владельцев даже для НАЛИЧКА
                        if (formData.vehicle_number.trim()) {
                          await checkVehicleOwnership(formData.vehicle_number)
                        }
                      }}
                      placeholder="Введите номер машины"
                    />
                  </div>
                </div>
              )}

              {/* Шаг 3: Выбор работника */}
              {selectedClientType && (
                <div className="space-y-2">
                  <Label>Работник *</Label>
                  <Select 
                    value={formData.worker_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, worker_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите работника" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id.toString()}>
                          {worker.name} {worker.surname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Описание заказа */}
              {selectedClientType && (
                <div className="space-y-2">
                  <Label>Описание заказа</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Введите описание заказа (необязательно)"
                    rows={3}
                  />
                </div>
              )}

              {/* Шаг 4: Выбор услуг */}
              {services.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Доступные услуги</Label>
                    <Select value="" onValueChange={handleServiceAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите услугу для добавления" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name} - {service.price} ₽
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Выбранные услуги */}
                  {formData.services.length > 0 && (
                    <div className="space-y-2">
                      <Label>Выбранные услуги</Label>
                      <div className="space-y-2">
                        {formData.services.map((service, index) => (
                          <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <span className="font-medium">{service.description}</span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                {service.price} ₽
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleServiceRemove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Добавление произвольной услуги */}
                  <div className="space-y-2 border-t pt-4">
                    <Label>Добавить произвольную услугу</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Название услуги"
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Цена"
                        value={customServicePrice}
                        onChange={(e) => setCustomServicePrice(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCustomServiceAdd}
                      disabled={!customServiceName || !customServicePrice}
                    >
                      Добавить услугу
                    </Button>
                  </div>

                  {/* Расходники */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Расходники</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMaterial}
                      >
                        Добавить расходник
                      </Button>
                    </div>
                    
                    {formData.materials.length > 0 && (
                      <div className="space-y-2">
                        {formData.materials.map((material, index) => (
                          <div key={index} className="flex items-center gap-2 rounded-lg border p-3">
                            <Select 
                              value={material.material_id.toString()} 
                              onValueChange={(value) => updateMaterial(index, 'material_id', parseInt(value))}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Выберите материал" />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map((mat) => (
                                  <SelectItem key={mat.id} value={mat.id.toString()}>
                                    {mat.name} (остаток: {mat.storage})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min="1"
                              max={materials.find(m => m.id === material.material_id)?.storage || 1}
                              placeholder="Количество"
                              value={material.quantity}
                              onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-24"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Общая сумма */}
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Общая сумма:</span>
                    <span>{formData.total_amount} ₽</span>
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (order ? "Сохранение..." : "Создание...") : (order ? "Редактировать" : "Создать заказ")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог сравнения договоров */}
      <Dialog open={showContractComparison} onOpenChange={setShowContractComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Выбор агрегатора</DialogTitle>
            <DialogDescription>
              Машина {formData.vehicle_number} принадлежит нескольким агрегаторам. Выберите подходящий договор:
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {contractComparison.map(({ client, services }) => (
              <div key={client.id} className="border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Телефон владельца: {client.owner_phone}</p>
                    <p>Телефон менеджера: {client.manager_phone}</p>
                    <p>Договор ID: {client.contract_id}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Цены на услуги:</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {services.map((service) => (
                      <div key={service.id} className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span className="font-medium">{service.price} ₽</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleContractSelect({ client, services })}
                >
                  Выбрать этого агрегатора
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог сравнения клиентов для машин */}
      <ClientComparisonDialog
        open={showClientComparison}
        onOpenChange={setShowClientComparison}
        carNumber={currentCarNumber}
        onClientSelected={handleClientFromComparison}
      />
    </>
  )
} 