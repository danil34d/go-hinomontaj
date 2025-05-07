import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ClipboardList, Package, Users } from "lucide-react"

export default function ManagerDashboard() {
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
              <div className="text-2xl font-bold">120</div>
              <p className="text-xs text-muted-foreground">+10% с прошлого месяца</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные заказы</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 за последнюю неделю</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сотрудники</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">+1 новый сотрудник</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Статистика</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">Выполнение плана</p>
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
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Заказ #1234</p>
                    <p className="text-xs text-muted-foreground">Иван Петров • 2 часа назад</p>
                  </div>
                  <div className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                    Выполнен
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Заказ #1233</p>
                    <p className="text-xs text-muted-foreground">Мария Сидорова • 3 часа назад</p>
                  </div>
                  <div className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">
                    В процессе
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Заказ #1232</p>
                    <p className="text-xs text-muted-foreground">Алексей Иванов • 5 часов назад</p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">Новый</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Производительность сотрудников</CardTitle>
              <CardDescription>Топ сотрудников по количеству заказов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Иван Петров</p>
                    <p className="text-xs text-muted-foreground">24 заказа</p>
                  </div>
                  <div className="text-sm font-medium">85%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Мария Сидорова</p>
                    <p className="text-xs text-muted-foreground">18 заказов</p>
                  </div>
                  <div className="text-sm font-medium">72%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Алексей Иванов</p>
                    <p className="text-xs text-muted-foreground">15 заказов</p>
                  </div>
                  <div className="text-sm font-medium">65%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
