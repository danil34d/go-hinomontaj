"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { statisticsApi, workersApi, salaryApi } from "@/lib/api"
import { BarChart, LineChart, PieChart, DollarSign, TrendingUp, Users, Calculator, Plus, Minus } from "lucide-react"

export default function EconomicsPage() {
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState([])
  const [selectedWorker, setSelectedWorker] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [workerStats, setWorkerStats] = useState(null)
  
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

  const fetchWorkers = async () => {
    try {
      const data = await workersApi.getAll()
      setWorkers(data)
    } catch (error) {
      console.error("Ошибка загрузки сотрудников:", error)
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

    try {
      setSubmitting(true)
      await salaryApi.addBonus({
        worker_id: parseInt(selectedWorker),
        amount: parseInt(bonusAmount),
        description: bonusDescription,
      })

      toast({
        title: "Успешно",
        description: "Премия добавлена",
      })

      setShowBonusDialog(false)
      setBonusAmount("")
      setBonusDescription("")
      
      // Обновляем статистику если выбран период
      if (startDate && endDate) {
        calculateSalary()
      }
    } catch (error: any) {
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

    try {
      setSubmitting(true)
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
      
      // Обновляем статистику если выбран период
      if (startDate && endDate) {
        calculateSalary()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const calculateSalary = async () => {
    if (!selectedWorker || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите сотрудника и период",
      })
      return
    }

    try {
      setSubmitting(true)
      const stats = await salaryApi.getWorkerStatistics(
        parseInt(selectedWorker),
        startDate,
        endDate
      )
      setWorkerStats(stats)

      toast({
        title: "Успешно",
        description: "Зарплата рассчитана",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setSubmitting(false)
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
          <p className="text-muted-foreground">Финансовая аналитика, зарплаты, премии и штрафы сотрудников</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="workers">Сотрудники</TabsTrigger>
            <TabsTrigger value="salary">Зарплаты</TabsTrigger>
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

          <TabsContent value="salary" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общий фонд ЗП</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">245,000 ₽</div>
                  <p className="text-xs text-muted-foreground">за текущий месяц</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Премии</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">42,000 ₽</div>
                  <p className="text-xs text-muted-foreground">+15% к окладам</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Штрафы</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8,500 ₽</div>
                  <p className="text-xs text-muted-foreground">-3.5% от общего</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средняя ЗП</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">30,625 ₽</div>
                  <p className="text-xs text-muted-foreground">на одного сотрудника</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Управление зарплатами сотрудников</CardTitle>
                <CardDescription>Премии, штрафы и анализ доходов по периодам</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="worker-select">Выберите сотрудника</Label>
                      <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите сотрудника..." />
                        </SelectTrigger>
                        <SelectContent>
                          {workers.map((worker: any) => (
                            <SelectItem key={worker.id} value={worker.id.toString()}>
                              {worker.name} {worker.surname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Период анализа</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          placeholder="Дата начала"
                        />
                        <Input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          placeholder="Дата окончания"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Dialog open={showBonusDialog} onOpenChange={setShowBonusDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700" 
                          disabled={!selectedWorker}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Добавить премию
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить премию</DialogTitle>
                          <DialogDescription>
                            Добавить премию сотруднику {workers.find((w: any) => w.id.toString() === selectedWorker)?.name} {workers.find((w: any) => w.id.toString() === selectedWorker)?.surname}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="bonus-amount">Сумма премии (₽)</Label>
                            <Input
                              id="bonus-amount"
                              type="number"
                              value={bonusAmount}
                              onChange={(e) => setBonusAmount(e.target.value)}
                              placeholder="Введите сумму"
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bonus-description">Причина премии</Label>
                            <Textarea
                              id="bonus-description"
                              value={bonusDescription}
                              onChange={(e) => setBonusDescription(e.target.value)}
                              placeholder="Опишите за что премия..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowBonusDialog(false)}>
                              Отмена
                            </Button>
                            <Button onClick={handleAddBonus} disabled={submitting}>
                              {submitting ? "Добавление..." : "Добавить премию"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          disabled={!selectedWorker}
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          Добавить штраф
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить штраф</DialogTitle>
                          <DialogDescription>
                            Добавить штраф сотруднику {workers.find((w: any) => w.id.toString() === selectedWorker)?.name} {workers.find((w: any) => w.id.toString() === selectedWorker)?.surname}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="penalty-amount">Сумма штрафа (₽)</Label>
                            <Input
                              id="penalty-amount"
                              type="number"
                              value={penaltyAmount}
                              onChange={(e) => setPenaltyAmount(e.target.value)}
                              placeholder="Введите сумму"
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="penalty-description">Причина штрафа</Label>
                            <Textarea
                              id="penalty-description"
                              value={penaltyDescription}
                              onChange={(e) => setPenaltyDescription(e.target.value)}
                              placeholder="Опишите за что штраф..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowPenaltyDialog(false)}>
                              Отмена
                            </Button>
                            <Button variant="destructive" onClick={handleAddPenalty} disabled={submitting}>
                              {submitting ? "Добавление..." : "Добавить штраф"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={calculateSalary}
                      disabled={!selectedWorker || !startDate || !endDate || submitting}
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      {submitting ? "Расчет..." : "Рассчитать ЗП"}
                    </Button>
                  </div>

                  {workerStats && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-medium">Результаты анализа</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border p-4">
                          <div className="text-sm text-muted-foreground">Базовая зарплата</div>
                          <div className="text-2xl font-bold">{workerStats.total_salary?.toLocaleString() || 0} ₽</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-sm text-muted-foreground">Премии за период</div>
                          <div className="text-2xl font-bold text-green-600">+{workerStats.total_bonus?.toLocaleString() || 0} ₽</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-sm text-muted-foreground">Штрафы за период</div>
                          <div className="text-2xl font-bold text-red-600">-{workerStats.total_penalties?.toLocaleString() || 0} ₽</div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-4">
                        <div className="text-sm text-muted-foreground">Итого к выплате</div>
                        <div className="text-3xl font-bold">
                          {((workerStats.total_salary || 0) + (workerStats.total_bonus || 0) - (workerStats.total_penalties || 0)).toLocaleString()} ₽
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <div className="text-sm text-muted-foreground">Заказов выполнено</div>
                          <div className="text-xl font-bold">{workerStats.total_orders || 0}</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-sm text-muted-foreground">Общая выручка</div>
                          <div className="text-xl font-bold">{workerStats.total_revenue?.toLocaleString() || 0} ₽</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!workerStats && selectedWorker && startDate && endDate && (
                    <div className="mt-6 p-8 text-center text-muted-foreground">
                      <Calculator className="mx-auto h-12 w-12 mb-4" />
                      <p>Нажмите "Рассчитать ЗП" чтобы увидеть результаты анализа</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
