"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi } from "@/lib/api"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { WorkerOrderFormDialog } from "@/components/orders/worker-order-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

interface Client {
  id: number
  name: string
  client_type: string
  car_numbers: string[]
}

interface OrderService {
  service_id: number
  service_description: string
  wheel_position: string
  price: number
}

interface Order {
  id: number
  client?: Client
  vehicle_number: string
  payment_method: string
  total_amount: number
  services: OrderService[]
  created_at: string
}

export default function WorkerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getMyOrders()
      setOrders(data || [])
    } catch (error: unknown) {
      console.error("Ошибка при загрузке заказов:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedOrder) return

    try {
      await ordersApi.delete(selectedOrder.id)
      toast({
        title: "Успешно",
        description: "Заказ успешно удален",
      })
      fetchOrders()
    } catch (error: unknown) {
      console.error("Ошибка при удалении заказа:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedOrder(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase()
    const clientName = order.client?.name?.toLowerCase() || ""
    const vehicleNumber = order.vehicle_number?.toLowerCase() || ""
    const services = order.services?.map(s => s.service_description?.toLowerCase() || "").join(" ") || ""

    return (
      clientName.includes(searchLower) ||
      vehicleNumber.includes(searchLower) ||
      services.includes(searchLower)
    )
  })

  const getPaymentMethodText = (method: string): string => {
    switch (method) {
      case "cash":
        return "Наличные"
      case "card":
        return "Карта"
      case "transfer":
        return "Перевод"
      default:
        return "Н/Д"
    }
  }

  return (
    <DashboardLayout requiredRole="worker">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Мои заказы</h1>
          <Button onClick={() => {
            setSelectedOrder(null)
            setIsDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Новый заказ
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по клиенту, номеру или услуге..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Заказы не найдены</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Тип клиента</TableHead>
                  <TableHead>Автомобиль</TableHead>
                  <TableHead>Услуги</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.client?.name || "Н/Д"}</span>
                        <span className="text-sm text-muted-foreground">
                          {order.client?.car_numbers?.join(", ") || "Нет автомобилей"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.client?.client_type || "Н/Д"}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.vehicle_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {order.services?.map((service) => (
                          <div key={`${order.id}-${service.service_id}`} className="flex items-center gap-1">
                            <Badge variant="secondary">
                              {service.service_description}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {service.wheel_position && `(${service.wheel_position})`}
                            </span>
                            <span className="text-sm">{service.price} ₽</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.total_amount} ₽</span>
                        <span className="text-sm text-muted-foreground">
                          {getPaymentMethodText(order.payment_method)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPaymentMethodText(order.payment_method)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(order)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <WorkerOrderFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        order={selectedOrder}
        onSuccess={fetchOrders}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить заказ #{selectedOrder?.id}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
