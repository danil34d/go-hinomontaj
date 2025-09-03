"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ordersApi, clientsApi, servicesApi, workersApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface WorkerOrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderCreated: () => void
}

interface Client {
  id: number
  name: string
  client_type: string
  car_numbers?: string[]
  company_name?: string
  inn?: string
}

interface Service {
  id: number
  name: string
  price: number
  contract_id: number
}

interface Car {
  id: number
  number: string
  model?: string
  year?: number
}

interface Worker {
  id: number
  name: string
  surname: string
}

interface ContractComparison {
  client: Client
  services: Service[]
  total: number
}

const CLIENT_TYPES = [
  { value: "НАЛИЧКА", label: "Наличка" },
  { value: "КОНТРАГЕНТЫ", label: "Контрагенты" },
  { value: "АГРЕГАТОРЫ", label: "Агрегаторы" }
]

const PAYMENT_METHODS = [
  { value: "cash", label: "Наличные" },
  { value: "transfer", label: "Перевод" },
  { value: "card", label: "Карта" }
]

export function WorkerOrderFormDialog({ open, onOpenChange, onOrderCreated }: WorkerOrderFormDialogProps) {
  const { toast } = useToast()
  
  // Состояние формы
  const [step, setStep] = useState(1)
  const [clientType, setClientType] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [carNumber, setCarNumber] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [workerId, setWorkerId] = useState("")
  const [wheelPosition, setWheelPosition] = useState("")
  const [selectedServices, setSelectedServices] = useState<{[key: string]: number}>({})
  const [comment, setComment] = useState("")
  
  // Данные из API
  const [clients, setClients] = useState<Client[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [whooseCarClients, setWhooseCarClients] = useState<Client[]>([])
  const [contractComparisons, setContractComparisons] = useState<ContractComparison[]>([])
  const [serviceComboboxOpen, setServiceComboboxOpen] = useState(false)
  
  // Состояния загрузки
  const [loading, setLoading] = useState(false)
  const [showContractComparison, setShowContractComparison] = useState(false)

  // Загрузка работников при открытии диалога
  useEffect(() => {
    if (open) {
      loadWorkers()
    }
  }, [open])

  // Загрузка клиентов при выборе типа клиента
  useEffect(() => {
    if (clientType && clientType !== "НАЛИЧКА") {
      loadClients()
    }
  }, [clientType])

  // Загрузка услуг при выборе клиента или для налички
  useEffect(() => {
    if (clientType === "НАЛИЧКА") {
      loadServices(1) // Договор ID=1 для налички
    } else if (selectedClient) {
      loadServices(selectedClient.id)
    }
  }, [clientType, selectedClient])

  const loadWorkers = async () => {
    try {
      const data = await workersApi.getAll()
      setWorkers(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить список работников"
      })
    }
  }

  const loadClients = async () => {
    try {
      const data = await clientsApi.getByType(clientType)
      setClients(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить список клиентов"
      })
    }
  }

  const loadServices = async (contractId: number) => {
    try {
      const data = await servicesApi.getServicesByContract(contractId)
      setServices(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить список услуг"
      })
    }
  }

  const handleCarNumberSubmit = async () => {
    if (!carNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите номер машины"
      })
      return
    }

    setLoading(true)
    try {
      const owners = await clientsApi.whooseCar(carNumber)
      setWhooseCarClients(owners)
      
      if (owners.length === 0) {
        toast({
          variant: "destructive",
          title: "Машина не найдена",
          description: "Машина с таким номером не найдена в системе"
        })
      } else if (owners.length === 1) {
        // Только один владелец - автоматически выбираем его
        setSelectedClient(owners[0])
        setStep(4)
      } else if (clientType === "АГРЕГАТОРЫ") {
        // Несколько агрегаторов - показываем сравнение договоров
        await loadContractComparisons(owners)
        setShowContractComparison(true)
      } else {
        // Несколько контрагентов - позволяем выбрать из списка
        setStep(4)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось найти владельцев машины"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadContractComparisons = async (clients: Client[]) => {
    try {
      const comparisons = await Promise.all(
        clients.map(async (client) => {
          const services = await servicesApi.getServicesByContract(client.id)
          const total = services.reduce((sum, service) => sum + service.price, 0)
          return { client, services, total }
        })
      )
      setContractComparisons(comparisons)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить информацию о договорах"
      })
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setShowContractComparison(false)
    setStep(4)
  }

  const incrementService = (serviceId: number, price: number) => {
    setSelectedServices(prev => {
      const counts: {[key: string]: number} = { ...prev }
      counts[String(serviceId)] = (counts[String(serviceId)] || 0) + 1
      return counts
    })
  }

  const decrementService = (serviceId: number) => {
    setSelectedServices(prev => {
      const counts = { ...prev }
      const key = String(serviceId)
      if (!counts[key]) return prev
      if (counts[key] <= 1) {
        delete counts[key]
      } else {
        counts[key] = counts[key] - 1
      }
      return counts
    })
  }

  const removeAllOfService = (serviceId: number) => {
    setSelectedServices(prev => {
      const counts = { ...prev }
      delete counts[String(serviceId)]
      return counts
    })
  }

  const calculateTotal = () => {
    return Object.entries(selectedServices).reduce((sum, [id, qty]) => {
      const svc = services.find(s => s.id === parseInt(id))
      return sum + (svc ? svc.price * Number(qty) : 0)
    }, 0)
  }

  const handleSubmit = async () => {
    // Валидация
    if (!clientType) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите тип клиента"
      })
      return
    }

    if (clientType === "НАЛИЧКА" && !paymentMethod) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите способ оплаты"
      })
      return
    }

    if ((clientType === "КОНТРАГЕНТЫ" || clientType === "АГРЕГАТОРЫ") && (!carNumber || !selectedClient)) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите номер машины и выберите клиента"
      })
      return
    }

    if (!workerId) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите работника"
      })
      return
    }

    if (!wheelPosition) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите позицию колеса"
      })
      return
    }

    if (Object.keys(selectedServices).length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите хотя бы одну услугу"
      })
      return
    }

    setLoading(true)
    try {
      const orderData = {
        client_type: clientType,
        client_id: clientType === "НАЛИЧКА" ? 1 : selectedClient?.id,
        vehicle_number: carNumber || "",
        payment_method: clientType === "НАЛИЧКА" ? paymentMethod : "contract",
        worker_id: parseInt(workerId),
        total_amount: calculateTotal(),
        services: Object.entries(selectedServices).flatMap(([serviceId, qty]) => {
          const service = services.find(s => s.id === parseInt(serviceId))
          const count = Number(qty)
          return Array.from({ length: count }, () => ({
            service_id: parseInt(serviceId),
            description: service?.name || "Услуга",
            wheel_position: wheelPosition,
            price: service?.price || 0
          }))
        })
      }

      await ordersApi.create(orderData)
      
      toast({
        title: "Успех",
        description: "Заказ успешно создан"
      })
      
      onOrderCreated()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось создать заказ"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setClientType("")
    setPaymentMethod("")
    setCarNumber("")
    setSelectedClient(null)
    setSelectedCar(null)
    setWorkerId("")
    setWheelPosition("")
    setSelectedServices({})
    setComment("")
    setClients([])
    setCars([])
    setServices([])
    setWhooseCarClients([])
    setContractComparisons([])
    setShowContractComparison(false)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Label>Тип клиента</Label>
            <Select value={clientType} onValueChange={setClientType}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип клиента" />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setStep(2)} 
              disabled={!clientType}
              className="w-full"
            >
              Далее
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Способ оплаты</Label>
              <Badge variant="outline">{CLIENT_TYPES.find(t => t.value === clientType)?.label}</Badge>
            </div>
            
            {clientType === "НАЛИЧКА" ? (
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите способ оплаты" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Способ оплаты: По договору</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Назад
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={clientType === "НАЛИЧКА" && !paymentMethod}
                className="flex-1"
              >
                Далее
              </Button>
            </div>
          </div>
        )

      case 3:
        if (clientType === "НАЛИЧКА") {
          setStep(4)
          return null
        }
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Номер машины</Label>
              <Badge variant="outline">{CLIENT_TYPES.find(t => t.value === clientType)?.label}</Badge>
            </div>
            
            <Input
              placeholder="Введите номер машины"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
            />
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Назад
              </Button>
              <Button 
                onClick={handleCarNumberSubmit} 
                disabled={!carNumber.trim() || loading}
                className="flex-1"
              >
                {loading ? "Поиск..." : "Найти владельцев"}
              </Button>
            </div>
          </div>
        )

      case 4:
        if (clientType !== "НАЛИЧКА" && whooseCarClients.length > 1 && !selectedClient) {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Выберите клиента</Label>
                <Badge variant="outline">{carNumber}</Badge>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {whooseCarClients.map((client) => (
                  <Card 
                    key={client.id} 
                    className="cursor-pointer hover:bg-muted" 
                    onClick={() => handleClientSelect(client)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium">{client.name}</div>
                      {client.company_name && (
                        <div className="text-sm text-muted-foreground">{client.company_name}</div>
                      )}
                      {client.inn && (
                        <div className="text-xs text-muted-foreground">ИНН: {client.inn}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                Назад
              </Button>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Работник</Label>
              {selectedClient && (
                <Badge variant="outline">{selectedClient.name}</Badge>
              )}
            </div>
            
            <Select value={workerId} onValueChange={setWorkerId}>
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
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(clientType === "НАЛИЧКА" ? 2 : 3)} 
                className="flex-1"
              >
                Назад
              </Button>
              <Button 
                onClick={() => setStep(5)} 
                disabled={!workerId}
                className="flex-1"
              >
                Далее
              </Button>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <Label>Позиция колеса</Label>
            <Select value={wheelPosition} onValueChange={setWheelPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите позицию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front-left">Переднее левое</SelectItem>
                <SelectItem value="front-right">Переднее правое</SelectItem>
                <SelectItem value="rear-left">Заднее левое</SelectItem>
                <SelectItem value="rear-right">Заднее правое</SelectItem>
              </SelectContent>
            </Select>

            <Label>Добавить услугу</Label>
            <Popover open={serviceComboboxOpen} onOpenChange={setServiceComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={serviceComboboxOpen} className="w-full justify-between">
                  Выберите услугу для добавления
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0">
                <Command>
                  <CommandInput placeholder="Поиск услуги..." />
                  <CommandList>
                    <CommandEmpty>Ничего не найдено</CommandEmpty>
                    <CommandGroup>
                      {services.map((service) => (
                        <CommandItem key={service.id} value={service.name} onSelect={() => { incrementService(service.id, service.price); setServiceComboboxOpen(false) }}>
                          <div className="flex w-full items-center justify-between">
                            <span>{service.name}</span>
                            <span className="text-muted-foreground">{service.price} ₽</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Корзина услуг с количеством */}
            {Object.keys(selectedServices).length > 0 && (
              <div className="space-y-2">
                <Label>Корзина услуг</Label>
                <div className="space-y-2">
                  {Object.entries(selectedServices).map(([id, qty]) => {
                    const svc = services.find(s => s.id === parseInt(id))
                    if (!svc) return null
                    return (
                      <div key={id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="font-medium">{svc.name}</div>
                          <div className="text-sm text-muted-foreground">{svc.price} ₽ за единицу</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="icon" onClick={() => decrementService(svc.id)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{qty}</span>
                          <Button type="button" variant="outline" size="icon" onClick={() => incrementService(svc.id, svc.price)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="ml-4 font-medium">{Number(qty) * svc.price} ₽</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeAllOfService(svc.id)}>
                            Удалить
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Комментарий (необязательно)</Label>
              <Input
                placeholder="Дополнительная информация"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {Object.keys(selectedServices).length > 0 && (() => {
              const total = Object.entries(selectedServices).reduce((sum, [id, qty]) => {
                const svc = services.find(s => s.id === parseInt(id))
                return sum + (svc ? svc.price * Number(qty) : 0)
              }, 0)
              return (
                <div className="p-3 bg-muted rounded-md">
                  <div className="font-medium">Итого: {total} ₽</div>
                  <div className="text-sm text-muted-foreground">Позиции: {Object.keys(selectedServices).length}</div>
                </div>
              )
            })()}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                Назад
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!wheelPosition || Object.keys(selectedServices).length === 0 || loading}
                className="flex-1"
              >
                {loading ? "Создание..." : "Создать заказ"}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Создание заказа</DialogTitle>
            <DialogDescription>
              Шаг {step} из 5: {
                step === 1 ? "Тип клиента" :
                step === 2 ? "Способ оплаты" :
                step === 3 ? "Номер машины" :
                step === 4 ? "Работник" :
                "Услуги"
              }
            </DialogDescription>
          </DialogHeader>
          
          {renderStep()}
        </DialogContent>
      </Dialog>

      {/* Диалог сравнения договоров */}
      <Dialog open={showContractComparison} onOpenChange={setShowContractComparison}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Сравнение договоров агрегаторов</DialogTitle>
            <DialogDescription>
              Машина {carNumber} принадлежит нескольким агрегаторам. Выберите подходящий договор.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {contractComparisons.map((comparison) => (
              <Card 
                key={comparison.client.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleClientSelect(comparison.client)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{comparison.client.name}</CardTitle>
                  {comparison.client.company_name && (
                    <p className="text-sm text-muted-foreground">{comparison.client.company_name}</p>
                  )}
                  {comparison.client.inn && (
                    <p className="text-xs text-muted-foreground">ИНН: {comparison.client.inn}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Услуги:</div>
                    {comparison.services.slice(0, 3).map((service) => (
                      <div key={service.id} className="flex justify-between text-xs">
                        <span>{service.name}</span>
                        <span>{service.price} ₽</span>
                      </div>
                    ))}
                    {comparison.services.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{comparison.services.length - 3} услуг
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Итого:</span>
                      <span>{comparison.total} ₽</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowContractComparison(false)}>
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 

