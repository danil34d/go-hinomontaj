"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ClipboardList, Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ordersApi } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

interface Order {
  id: number
  client_id: number
  vehicle_number: string
  payment_method: string
  total_amount: number
  created_at: string
  updated_at: string
  status: string
  client: {
    name: string
    phone: string
  }
}

export default function WorkerDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  })

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getMyOrders()
      setOrders(data)
      
      // Подсчет статистики
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const stats = {
        total: data.length,
        active: data.filter(order => order.status === "in_progress").length,
        completed: data.filter(order => 
          order.status === "completed" && 
          new Date(order.updated_at) > weekAgo
        ).length
      }
      
      setStats(stats)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказы",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500"
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500"
      default:
        return "bg-blue-500/10 text-blue-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Выполнен"
      case "in_progress":
        return "В процессе"
      default:
        return "Новый"
    }
  }

  return (
    <DashboardLayout requiredRole="worker">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Панель сотрудника</h1>
            <p className="text-muted-foreground">Управление вашими заказами</p>
          </div>
          <Button onClick={() => router.push("/dashboard/worker/new-order")}>
            <Plus className="mr-2 h-4 w-4" />
            Новый заказ
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.completed} за последнюю неделю
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные заказы</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active > 0 ? "Требуют внимания" : "Нет активных заказов"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выполнено за неделю</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed > 0 ? "Успешно выполненных заказов" : "Нет выполненных заказов"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Мои последние заказы</CardTitle>
            <CardDescription>Недавно созданные и обработанные заказы</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Нет заказов</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  У вас пока нет заказов. Создайте новый заказ, нажав на кнопку выше.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Заказ #{order.id} • {order.vehicle_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Клиент: {order.client.name} • {formatDistanceToNow(new Date(order.created_at), { locale: ru, addSuffix: true })}
                      </p>
                    </div>
                    <div className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
