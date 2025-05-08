"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Plus, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { servicesApi } from "@/lib/api"
import { ServiceFormDialog } from "@/components/services/service-form-dialog"
import { ServiceEditDialog } from "@/components/services/service-edit-dialog"

interface Service {
  id: number
  name: string
  prices: Record<string, number>
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const { toast } = useToast()

  const fetchServices = async () => {
    try {
      setLoading(true)
      const data = await servicesApi.getAll()
      setServices(data)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список услуг",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту услугу?")) {
      return
    }

    try {
      await servicesApi.delete(id)
      toast({
        title: "Успех",
        description: "Услуга успешно удалена",
      })
      fetchServices()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить услугу",
        variant: "destructive",
      })
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Услуги</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить услугу
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск услуг..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                {Object.keys(services[0]?.prices || {}).map(type => (
                  <TableHead key={type}>Цена для {type}</TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={Object.keys(services[0]?.prices || {}).length + 2} className="text-center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Object.keys(services[0]?.prices || {}).length + 2} className="text-center">
                    Услуги не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    {Object.entries(service.prices).map(([type, price]) => (
                      <TableCell key={type}>{price} ₽</TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingService(service)}>
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(service.id)}
                          >
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ServiceFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchServices}
      />

      {editingService && (
        <ServiceEditDialog
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          service={editingService}
          onSuccess={fetchServices}
        />
      )}
    </DashboardLayout>
  )
} 