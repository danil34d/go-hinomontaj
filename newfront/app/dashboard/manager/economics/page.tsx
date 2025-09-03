"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { statisticsApi as statisticsManagerApi, workersApi, salaryApi } from "@/lib/api"
import { BarChart, LineChart, PieChart, DollarSign, TrendingUp, Users, Calculator, Plus, Minus } from "lucide-react"

interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_workers: number
  total_clients: number
  average_order_value: number
}

interface WorkerStatistics {
  worker_id: number
  worker_name: string
  worker_surname: string
  worker_phone: string
  salary_schema: string
  total_orders: number
  total_revenue: number
  total_bonus: number
  total_penalties: number
  total_salary: number
}

export default function EconomicsPage() {
  const [statistics, setStatistics] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [workerStats, setWorkerStats] = useState<WorkerStatistics | null>(null)
  
  // Диалоги
  const [showBonusDialog, setShowBonusDialog] = useState(false)
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false)
  
  // Данные форм
  const [bonusAmount, setBonusAmount] = useState("")
  const [bonusDescription, setBonusDescription] = useState("")
  const [penaltyAmount, setPenaltyAmount] = useState("")
  const [penaltyDescription, setPenaltyDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchStatistics()
    fetchWorkers()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const data = await statisticsManagerApi.get()
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

  const fetchWorkers = async () => {
    try {
      const data = await workersApi.getAll()
      setWorkers(data)
    } catch (error) {
      console.error("Ошибка загрузки сотрудников:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: (error as Error).message || "Не удалось загрузить список сотрудников",
      })
    }
  }

  const handleAddBonus = async () => {
    if (!selectedWorker || !bonusAmount || !bonusDescription) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните все поля",
      })
      return
    }

    setSubmitting(true)
    try {
      await salaryApi.addBonus({
        worker_id: parseInt(selectedWorker),
        amount: parseInt(bonusAmount),
        description: bonusDescription,
      })

      toast({
        title: "Успешно",
        description: "Бонус добавлен",
      })

      setShowBonusDialog(false)
      setBonusAmount("")
      setBonusDescription("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPenalty = async () => {
    if (!selectedWorker || !penaltyAmount || !penaltyDescription) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните все поля",
      })
      return
    }

    setSubmitting(true)
    try {
      await salaryApi.addPenalty({
        worker_id: parseInt(selectedWorker),
        amount: parseInt(penaltyAmount),
        description: penaltyDescription,
      })

      toast({
        title: "Успешно",
        description: "Штраф добавлен",
      })

      setShowPenaltyDialog(false)
      setPenaltyAmount("")
      setPenaltyDescription("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const fetchWorkerStats = async () => {
    if (!selectedWorker || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите сотрудника и период",
      })
      return
    }

    try {
      const data = await workersApi.getStatistics(parseInt(selectedWorker), startDate, endDate)
      setWorkerStats(data)
    } catch (error) {
      console.error("Ошибка при загрузке статистики работника:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: (error as Error).message || "Не удалось загрузить статистику работника",
      })
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
          <h1 className="text-3xl font-bold tracking-tight">Экономика</h1>
          <p className="text-muted-foreground">Управление финансами и зарплатами</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="salary">Зарплаты</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.total_orders || 0}</div>
                  <p className="text-xs text-muted-foreground">За все время</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.total_revenue?.toLocaleString() || 0} ₽</div>
                  <p className="text-xs text-muted-foreground">Общая сумма</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.average_order_value?.toLocaleString() || 0} ₽</div>
                  <p className="text-xs text-muted-foreground">На заказ</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Активных сотрудников</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.total_workers || 0}</div>
                  <p className="text-xs text-muted-foreground">из {workers.length} зарегистрированных</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="salary" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Бонусы и штрафы</CardTitle>
                  <CardDescription>Управление бонусами и штрафами сотрудников</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Dialog open={showBonusDialog} onOpenChange={setShowBonusDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить бонус
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить бонус</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="bonus-worker">Сотрудник</Label>
                            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите сотрудника" />
                              </SelectTrigger>
                              <SelectContent>
                                {(workers ?? []).map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id.toString()}>
                                    {worker.name} {worker.surname}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="bonus-amount">Сумма</Label>
                            <Input
                              id="bonus-amount"
                              type="number"
                              value={bonusAmount}
                              onChange={(e) => setBonusAmount(e.target.value)}
                              placeholder="Введите сумму бонуса"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bonus-description">Описание</Label>
                            <Input
                              id="bonus-description"
                              value={bonusDescription}
                              onChange={(e) => setBonusDescription(e.target.value)}
                              placeholder="Введите описание бонуса"
                            />
                          </div>
                          <Button onClick={handleAddBonus} disabled={submitting}>
                            {submitting ? "Добавление..." : "Добавить бонус"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Minus className="h-4 w-4 mr-2" />
                          Добавить штраф
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить штраф</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="penalty-worker">Сотрудник</Label>
                            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите сотрудника" />
                              </SelectTrigger>
                              <SelectContent>
                                {(workers ?? []).map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id.toString()}>
                                    {worker.name} {worker.surname}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="penalty-amount">Сумма</Label>
                            <Input
                              id="penalty-amount"
                              type="number"
                              value={penaltyAmount}
                              onChange={(e) => setPenaltyAmount(e.target.value)}
                              placeholder="Введите сумму штрафа"
                            />
                          </div>
                          <div>
                            <Label htmlFor="penalty-description">Описание</Label>
                            <Input
                              id="penalty-description"
                              value={penaltyDescription}
                              onChange={(e) => setPenaltyDescription(e.target.value)}
                              placeholder="Введите описание штрафа"
                            />
                          </div>
                          <Button onClick={handleAddPenalty} disabled={submitting}>
                            {submitting ? "Добавление..." : "Добавить штраф"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Статистика сотрудника</CardTitle>
                  <CardDescription>Просмотр статистики по сотруднику за период</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="worker-select">Сотрудник</Label>
                      <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите сотрудника" />
                        </SelectTrigger>
                        <SelectContent>
                          {(workers ?? []).map((worker) => (
                            <SelectItem key={worker.id} value={worker.id.toString()}>
                              {worker.name} {worker.surname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="start-date">Начальная дата</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">Конечная дата</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={fetchWorkerStats} className="w-full">
                        Получить статистику
                      </Button>
                    </div>
                  </div>

                  {workerStats && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Заказов:</span>
                        <span className="font-medium">{workerStats.total_orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Выручка:</span>
                        <span className="font-medium">{workerStats.total_revenue} ₽</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Бонусы:</span>
                        <span className="font-medium text-green-600">+{workerStats.total_bonus} ₽</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Штрафы:</span>
                        <span className="font-medium text-red-600">-{workerStats.total_penalties} ₽</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Итого к выплате:</span>
                        <span className="font-bold">{workerStats.total_salary} ₽</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
