"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { fetchWithAuth } from "@/lib/api"
import { Clock, CheckCircle, Play, Package, User, Car, CreditCard, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface OrderMaterial {
  id: number
  material_id: number
  quantity: number
  material?: {
    id: number
    name: string
    unit: string
    price: number
  }
}

interface OrderService {
  id: number
  service_id: number
  service_description: string
  wheel_position: string
  price: number
}

interface Order {
  id: number
  status: string
  worker_id: number
  client_id: number
  client?: {
    id: number
    name: string
    client_type: string
  }
  vehicle_number: string
  payment_method: string
  total_amount: number
  created_at: string
  updated_at: string
  services: OrderService[]
  materials?: OrderMaterial[]
}

interface OrderDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function OrderDetailsDialog({ open, onOpenChange, order }: OrderDetailsDialogProps) {
  const [materials, setMaterials] = useState<OrderMaterial[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && order) {
      loadOrderMaterials()
    }
  }, [open, order])

  const loadOrderMaterials = async () => {
    if (!order) return
    
    try {
      setLoading(true)
      const response = await fetchWithAuth(`/api/manager/orders/${order.id}/materials`)
      if (response.ok) {
        const data = await response.json()
        setMaterials(data || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить материалы заказа",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "запланирован":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Запланирован</Badge>
      case "выполняется":
        return <Badge variant="default" className="flex items-center gap-1"><Play className="h-3 w-3" /> Выполняется</Badge>
      case "выполнен":
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Выполнен</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "Наличные"
      case "card":
        return "Карта"
      case "contract":
        return "По договору"
      default:
        return method
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Детали заказа #{order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Клиент:</span>
                <span>{order.client?.name || "Н/Д"}</span>
                {order.client?.client_type && (
                  <Badge variant="outline" className="text-xs">
                    {order.client.client_type}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Автомобиль:</span>
                <span>{order.vehicle_number || "Не указан"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Оплата:</span>
                <span>{getPaymentMethodText(order.payment_method)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Статус:</span>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Сумма:</span>
                <span className="text-lg font-semibold">{order.total_amount.toLocaleString()} ₽</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Создан:</span>
                <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ru })}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Услуги */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Услуги</h3>
            {order.services && order.services.length > 0 ? (
              <div className="space-y-2">
                {order.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{service.service_description}</div>
                      {service.wheel_position && (
                        <div className="text-sm text-muted-foreground">Позиция: {service.wheel_position}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{service.price.toLocaleString()} ₽</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Услуги не указаны</p>
            )}
          </div>

          <Separator />

          {/* Материалы */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Использованные материалы</h3>
            {loading ? (
              <p className="text-muted-foreground">Загрузка материалов...</p>
            ) : materials && materials.length > 0 ? (
              <div className="space-y-2">
                {materials.map((material, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{material.material?.name || `Материал #${material.material_id}`}</div>
                      <div className="text-sm text-muted-foreground">
                        Количество: {material.quantity} {material.material?.unit || 'шт'}
                      </div>
                    </div>
                    {material.material?.price && (
                      <div className="text-right">
                        <div className="font-semibold">
                          {(material.material.price * material.quantity).toLocaleString()} ₽
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {material.material.price.toLocaleString()} ₽ за {material.material.unit || 'шт'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Материалы не использовались</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}