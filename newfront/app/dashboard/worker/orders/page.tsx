"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi } from "@/lib/api"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

export default function WorkerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getMyOrders()
      setOrders(data)
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

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toString().includes(searchQuery) ||
      (order.client && order.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPaymentMethodText = (method) => {
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
          <Button asChild>
            <Link href="/dashboard/worker/new-order">
              <Plus className="mr-2 h-4 w-4" />
              Новый заказ
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по ID, клиенту или номеру авто..."
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
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Номер авто</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Способ оплаты</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Создан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Заказы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{order.client?.name || "Н/Д"}</TableCell>
                      <TableCell>{order.vehicle_number}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {order.status === "completed"
                            ? "Выполнен"
                            : order.status === "in_progress"
                              ? "В процессе"
                              : "Новый"}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentMethodText(order.payment_method)}</TableCell>
                      <TableCell>{order.total_amount} ₽</TableCell>
                      <TableCell title={new Date(order.created_at).toLocaleString()}>
                        {formatDistanceToNow(new Date(order.created_at), { locale: ru, addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
