"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ordersApi, clientsApi, servicesApi } from "@/lib/api"

export default function NewOrderPage() {
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    client_id: "",
    service_id: "",
    description: "",
    total_price: "",
    status: "new",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [clientsData, servicesData] = await Promise.all([clientsApi.getAll(), servicesApi.getAll()])
        setClients(clientsData)
        setServices(servicesData)
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

    fetchData()
  }, [toast])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      // Преобразуем строковые ID в числа
      const orderData = {
        ...formData,
        client_id: Number.parseInt(formData.client_id),
        service_id: Number.parseInt(formData.service_id),
        total_price: Number.parseFloat(formData.total_price),
      }

      await ordersApi.create(orderData)

      toast({
        title: "Успешно",
        description: "Заказ успешно создан",
      })

      router.push("/dashboard/worker/orders")
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

  if (loading) {
    return (
      <DashboardLayout requiredRole="worker">
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="worker">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Создание нового заказа</h1>
          <p className="text-muted-foreground">Заполните форму для создания нового заказа</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_id">Клиент</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleSelectChange("client_id", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_id">Услуга</Label>
              <Select
                value={formData.service_id}
                onValueChange={(value) => handleSelectChange("service_id", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите услугу" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Введите описание заказа"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_price">Сумма заказа (₽)</Label>
              <Input
                id="total_price"
                name="total_price"
                type="number"
                placeholder="0.00"
                value={formData.total_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Новый</SelectItem>
                  <SelectItem value="in_progress">В процессе</SelectItem>
                  <SelectItem value="completed">Выполнен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Создание..." : "Создать заказ"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
