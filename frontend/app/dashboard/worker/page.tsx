import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ClipboardList, Package } from "lucide-react"

export default function WorkerDashboard() {
  return (
    <DashboardLayout requiredRole="worker">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Панель сотрудника</h1>
          <p className="text-muted-foreground">Добро пожаловать в панель сотрудника</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Мои заказы</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 за последнюю неделю</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные заказы</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">2 требуют внимания</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Эффективность</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">+5% с прошлого месяца</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Мои последние заказы</CardTitle>
            <CardDescription>Недавно созданные и обработанные заказы</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Заказ #1234</p>
                  <p className="text-xs text-muted-foreground">Клиент: Иван Петров • 2 часа назад</p>
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
                  <p className="text-xs text-muted-foreground">Клиент: Мария Сидорова • 3 часа назад</p>
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
                  <p className="text-xs text-muted-foreground">Клиент: Алексей Иванов • 5 часов назад</p>
                </div>
                <div className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">Новый</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
