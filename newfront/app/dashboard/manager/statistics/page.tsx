"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { statisticsApi } from "@/lib/api"
import { BarChart, LineChart, PieChart } from "lucide-react"

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const data = await statisticsApi.get()
      setStatistics(data)
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

  if (loading) {
    return (
      <DashboardLayout requiredRole="manager">
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Статистика</h1>
          <p className="text-muted-foreground">Аналитика и статистика по заказам и сотрудникам</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="workers">Сотрудники</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">120</div>
                  <p className="text-xs text-muted-foreground">+10% с прошлого месяца</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Выполнено заказов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">95</div>
                  <p className="text-xs text-muted-foreground">79% от общего числа</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5,240 ₽</div>
                  <p className="text-xs text-muted-foreground">+5% с прошлого месяца</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Активных сотрудников</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">из 10 зарегистрированных</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Заказы по месяцам</CardTitle>
                  <CardDescription>Количество заказов за последние 6 месяцев</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="flex h-[200px] items-center justify-center">
                    <LineChart className="h-16 w-16 text-muted-foreground" />
                    <p className="ml-4 text-sm text-muted-foreground">Здесь будет график заказов по месяцам</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Распределение заказов</CardTitle>
                  <CardDescription>По статусам заказов</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="flex h-[200px] items-center justify-center">
                    <PieChart className="h-16 w-16 text-muted-foreground" />
                    <p className="ml-4 text-sm text-muted-foreground">Здесь будет круговая диаграмма</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Статистика заказов</CardTitle>
                <CardDescription>Детальная информация по заказам</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] items-center justify-center">
                  <BarChart className="h-16 w-16 text-muted-foreground" />
                  <p className="ml-4 text-sm text-muted-foreground">Здесь будет детальная статистика по заказам</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Статистика сотрудников</CardTitle>
                <CardDescription>Производительность и эффективность</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] items-center justify-center">
                  <BarChart className="h-16 w-16 text-muted-foreground" />
                  <p className="ml-4 text-sm text-muted-foreground">Здесь будет статистика по сотрудникам</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
