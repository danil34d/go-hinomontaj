"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi, clientsApi, Order, Client } from "@/lib/api"
import { Plus, Search, Pencil, Trash2, Play, CheckCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { OrderFormDialog } from "@/components/orders/order-form-dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const [ordersData, clientsData] = await Promise.all([
        ordersApi.getAll(),
        clientsApi.getAll()
      ])

      // Добавляем информацию о клиентах к заказам
      const ordersWithClients = ordersData.map(order => {
        const client = clientsData.find(c => c.id === order.client_id)
        return {
          ...order,
          client: client || null
        }
      })

      setOrders(ordersWithClients)
      setClients(clientsData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
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
    try {
      await ordersApi.delete(selectedOrder.id)
      toast({
        title: "Успешно",
        description: "Заказ успешно удален",
      })
      fetchOrders()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedOrder(null)
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus)
      toast({
        title: "Успешно",
        description: "Статус заказа обновлен",
      })
      fetchOrders()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
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

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case "запланирован":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange(order.id, "выполняется")}
            className="flex items-center gap-1"
          >
            <Play className="h-3 w-3" />
            Начать
          </Button>
        )
      case "выполняется":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange(order.id, "выполнен")}
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Завершить
          </Button>
        )
      case "выполнен":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange(order.id, "запланирован")}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Повторить
          </Button>
        )
      default:
        return null
    }
  }

  const filteredOrders = orders?.filter((order) => {
    const searchLower = searchQuery.toLowerCase()
    const clientName = order.client?.name?.toLowerCase() || ""
    const vehicleNumber = order.vehicle_number?.toLowerCase() || ""
    const services = order.services?.map(s => s.service_description?.toLowerCase() || "").join(" ") || ""

    return (
      clientName.includes(searchLower) ||
      vehicleNumber.includes(searchLower) ||
      services.includes(searchLower)
    )
  }) || []

  const getTabOrders = (tab: string) => {
    if (tab === "all") return filteredOrders
    return filteredOrders.filter(order => order.status === tab)
  }

  const getPaymentMethodText = (method: string) => {
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

  const getClientTypeText = (type: string) => {
    switch (type) {
      case "ФИЗЛИЦА":
        return "Физическое лицо"
      case "КОНТРАГЕНТЫ":
        return "Контрагент"
      case "АГРЕГАТОРЫ":
        return "Агрегатор"
      default:
        return type || "Н/Д"
    }
  }

  const renderOrdersTable = (ordersToShow: Order[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Статус</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Тип клиента</TableHead>
            <TableHead>Автомобиль</TableHead>
            <TableHead>Услуги</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Оплата</TableHead>
            <TableHead>Создан</TableHead>
            <TableHead className="w-[200px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersToShow.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                Заказы не найдены
              </TableCell>
            </TableRow>
          ) : (
            ordersToShow.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  {getStatusBadge(order.status)}
                </TableCell>
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
                    {getClientTypeText(order.client?.client_type)}
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
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getPaymentMethodText(order.payment_method)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(order.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusActions(order)}
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Управление заказами</h1>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Все заказы ({filteredOrders.length})</TabsTrigger>
            <TabsTrigger value="запланирован">
              Запланированные ({filteredOrders.filter(o => o.status === "запланирован").length})
            </TabsTrigger>
            <TabsTrigger value="выполняется">
              Выполняются ({filteredOrders.filter(o => o.status === "выполняется").length})
            </TabsTrigger>
            <TabsTrigger value="выполнен">
              Выполненные ({filteredOrders.filter(o => o.status === "выполнен").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="flex h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              renderOrdersTable(getTabOrders("all"))
            )}
          </TabsContent>

          <TabsContent value="запланирован" className="mt-6">
            {loading ? (
              <div className="flex h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              renderOrdersTable(getTabOrders("запланирован"))
            )}
          </TabsContent>

          <TabsContent value="выполняется" className="mt-6">
            {loading ? (
              <div className="flex h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              renderOrdersTable(getTabOrders("выполняется"))
            )}
          </TabsContent>

          <TabsContent value="выполнен" className="mt-6">
            {loading ? (
              <div className="flex h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              renderOrdersTable(getTabOrders("выполнен"))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <OrderFormDialog
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
              Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.
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
