"use client"

import { useState, useEffect } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Contract, Service, ServiceWithPrices, contractsApi, servicesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ServiceFormDialog } from "@/components/services/service-form-dialog"
import { ServiceEditDialog } from "@/components/services/service-edit-dialog"
import { ServicePriceEditDialog } from "@/components/services/service-price-edit-dialog"

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceWithPrices[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingPriceService, setEditingPriceService] = useState<ServiceWithPrices | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [servicesData, contractsData] = await Promise.all([
        servicesApi.getAllWithPrices(),
        contractsApi.getAll(),
      ])
      setServices(servicesData || [])
      setContracts(contractsData || [])
    } catch (error: any) {
      console.error("Ошибка при загрузке услуг или договоров:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось загрузить данные",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (service: ServiceWithPrices) => {
    if (!confirm("Вы уверены, что хотите удалить эту услугу?")) {
      return
    }

    try {
      toast({
        title: "Информация",
        description: "Удаление услуг с ценами по договорам пока не поддерживается",
      })
      fetchData()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось удалить услугу",
      })
    }
  }

  const filteredServices = services.filter((service) => {
    if (!service || !service.name) return false
    // Исключаем произвольную услугу
    if (service.name === "Произвольная услуга") return false
    return service.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const uniqueContracts = contracts.map((c) => ({ id: c.id, name: c.number }))

  const getServicePrice = (service: ServiceWithPrices, contractId: number) => {
    if (!service.prices) return "-"
    const price = service.prices.find(p => p.contract_id === contractId)
    return price ? `${price.price} ₽` : "-"
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Услуги</h1>
            <Button disabled>
              <Plus className="w-4 h-4 mr-2" />
              Добавить услугу
            </Button>
          </div>
          <div className="text-center py-8">Загрузка...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Услуги с ценами по договорам</h1>
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

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Название услуги</TableHead>
                {uniqueContracts.map((contract) => (
                  <TableHead key={contract.id} className="min-w-[150px] text-center">
                    Договор: {contract.name}
                  </TableHead>
                ))}
                <TableHead className="min-w-[150px]">Технологическая карта</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={uniqueContracts.length + 3} className="text-center py-8">
                    Услуги не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service, index) => (
                  <TableRow key={`${service.name}-${index}`}>
                    <TableCell className="font-medium">
                      {service.name || "Без названия"}
                    </TableCell>
                    {uniqueContracts.map((contract) => (
                      <TableCell key={contract.id} className="text-center">
                        {getServicePrice(service, contract.id)}
                      </TableCell>
                    ))}
                    <TableCell>
                      {service.material_card || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPriceService(service)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать цены
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(service)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
        onSuccess={fetchData}
      />

      {editingService && (
        <ServiceEditDialog
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          service={editingService}
          onSuccess={fetchData}
        />
      )}
      
      {editingPriceService && (
        <ServicePriceEditDialog
          open={!!editingPriceService}
          onOpenChange={(open) => !open && setEditingPriceService(null)}
          service={editingPriceService}
          onSuccess={fetchData}
        />
      )}
    </DashboardLayout>
  )
} 