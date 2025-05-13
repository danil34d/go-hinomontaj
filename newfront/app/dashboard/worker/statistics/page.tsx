"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { statisticsApi } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Loader2 } from "lucide-react"

interface WorkerStatistics {
  total_orders: number
  total_orders_today: number
  total_orders_month: number
  total_revenue: number
  total_revenue_today: number
  total_revenue_month: number
  last_order: string
}

export default function WorkerStatisticsPage() {
  const [stats, setStats] = useState<WorkerStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await statisticsApi.getWorkerStats()
      setStats(data)
    } catch (error: unknown) {
      console.error("Ошибка при загрузке статистики:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="worker">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="worker">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Моя статистика</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Статистика за сегодня */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_orders_today || 0} заказов</div>
              <p className="text-xs text-muted-foreground">
                На сумму {stats?.total_revenue_today || 0} ₽
              </p>
            </CardContent>
          </Card>

          {/* Статистика за месяц */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За месяц</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_orders_month || 0} заказов</div>
              <p className="text-xs text-muted-foreground">
                На сумму {stats?.total_revenue_month || 0} ₽
              </p>
            </CardContent>
          </Card>

          {/* Общая статистика */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За всё время</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_orders || 0} заказов</div>
              <p className="text-xs text-muted-foreground">
                На сумму {stats?.total_revenue || 0} ₽
              </p>
            </CardContent>
          </Card>

          {/* Последний заказ */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Последний заказ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats?.last_order
                  ? formatDistanceToNow(new Date(stats.last_order), {
                      addSuffix: true,
                      locale: ru,
                    })
                  : "Нет заказов"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 