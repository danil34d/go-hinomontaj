"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ClipboardList, Package, Users } from "lucide-react"
import { statisticsApi, ordersApi, workersApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_workers: number
  total_clients: number
  average_order_value: number
}

interface Order {
  id: number
  status: string
  client?: {
    name: string
  }
  created_at: string
}

interface Worker {
  id: number
  name: string
  surname: string
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, ordersData, workersData] = await Promise.all([
        statisticsApi.get(),
        ordersApi.getAll(),
        workersApi.getAll()
      ])
      
      setStats(statsData)
      setRecentOrders(ordersData?.slice(0, 3) || [])
      setWorkers(workersData || [])
    } catch (error: any) {
      console.error("Ошибка при загрузке данных дашборда:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось загрузить данные",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "выполнен":
        return "Выполнен"
      case "выполняется":
        return "В процессе"
      case "запланирован":
        return "Запланирован"
      default:
        return "Новый"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "выполнен":
        return "bg-green-500/10 text-green-500"
      case "выполняется":
        return "bg-yellow-500/10 text-yellow-500"
      case "запланирован":
        return "bg-blue-500/10 text-blue-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "только что"
    if (diffInHours < 24) return `${diffInHours} час${diffInHours === 1 ? '' : diffInHours < 5 ? 'а' : 'ов'} назад`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} дн${diffInDays === 1 ? 'ь' : diffInDays < 5 ? 'я' : 'ей'} назад`
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="manager">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
          <p className="text-muted-foreground">Добро пожаловать в панель управления менеджера</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
              <p className="text-xs text-muted-foreground">За все время</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выручка</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_revenue?.toLocaleString() || 0} ₽</div>
              <p className="text-xs text-muted-foreground">Общая сумма</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сотрудники</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_workers || 0}</div>
              <p className="text-xs text-muted-foreground">Активных сотрудников</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.average_order_value?.toLocaleString() || 0} ₽</div>
              <p className="text-xs text-muted-foreground">На заказ</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Последние заказы</CardTitle>
              <CardDescription>Недавно созданные заказы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет заказов</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Заказ #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.client?.name || "Н/Д"} • {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Сотрудники</CardTitle>
              <CardDescription>Список активных сотрудников</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет сотрудников</p>
                ) : (
                  workers.slice(0, 3).map((worker) => (
                    <div key={worker.id} className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {worker.name} {worker.surname}
                        </p>
                        <p className="text-xs text-muted-foreground">Сотрудник</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
