"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Edit, Trash2, Warehouse, TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { materialsApi, MaterialCard, Storage } from "@/lib/api"
import { MaterialCardDialog } from "@/components/materials/material-card-dialog"
import { DeliveryDialog } from "@/components/materials/delivery-dialog"

export default function MaterialsPage() {
  const [materialCards, setMaterialCards] = useState<MaterialCard[]>([])
  const [storage, setStorage] = useState<Storage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [materialCardDialogOpen, setMaterialCardDialogOpen] = useState(false)
  const [editingMaterialCard, setEditingMaterialCard] = useState<MaterialCard | null>(null)
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchMaterialCards = async () => {
    try {
      const data = await materialsApi.getAllMaterialCards()
      setMaterialCards(data || [])
    } catch (error: any) {
      console.error("Ошибка при загрузке технологических карт:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось загрузить технологические карты",
      })
    }
  }

  const fetchStorage = async () => {
    try {
      const data = await materialsApi.getStorage()
      setStorage(data)
    } catch (error: any) {
      console.error("Ошибка при загрузке данных склада:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось загрузить данные склада",
      })
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    await Promise.all([fetchMaterialCards(), fetchStorage()])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteCard = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту технологическую карту?")) {
      return
    }

    try {
      await materialsApi.deleteMaterialCard(id)
      toast({
        title: "Успешно",
        description: "Технологическая карта удалена",
      })
      fetchMaterialCards()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось удалить технологическую карту",
      })
    }
  }

  const handleCreateMaterialCard = () => {
    setEditingMaterialCard(null)
    setMaterialCardDialogOpen(true)
  }

  const handleEditMaterialCard = (card: MaterialCard) => {
    setEditingMaterialCard(card)
    setMaterialCardDialogOpen(true)
  }

  const handleAddDelivery = () => {
    setDeliveryDialogOpen(true)
  }

  const materialFields = [
    { key: 'rs25', label: 'RS25' },
    { key: 'r19', label: 'R19' },
    { key: 'r20', label: 'R20' },
    { key: 'r25', label: 'R25' },
    { key: 'r251', label: 'R251' },
    { key: 'r13', label: 'R13' },
    { key: 'r15', label: 'R15' },
    { key: 'foot9', label: 'Foot9' },
    { key: 'foot12', label: 'Foot12' },
    { key: 'foot15', label: 'Foot15' },
  ]

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Материалы</h1>
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
          <h1 className="text-2xl font-bold">Управление материалами</h1>
        </div>

        <Tabs defaultValue="storage" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Warehouse className="w-4 h-4" />
              Склад
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Технологические карты
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <TruckIcon className="w-4 h-4" />
              Поставки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Текущее состояние склада</CardTitle>
                <CardDescription>
                  Количество материалов на складе
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storage ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {materialFields.map((field) => (
                      <div key={field.key} className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {storage[field.key as keyof Storage]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {field.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Данные склада не найдены
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Технологические карты</h2>
              <Button onClick={handleCreateMaterialCard}>
                <Plus className="w-4 h-4 mr-2" />
                Создать карту
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    {materialFields.map((field) => (
                      <TableHead key={field.key} className="text-center">
                        {field.label}
                      </TableHead>
                    ))}
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialCards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={materialFields.length + 2} className="text-center py-8">
                        Технологические карты не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    materialCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">{card.id}</TableCell>
                        {materialFields.map((field) => (
                          <TableCell key={field.key} className="text-center">
                            {card[field.key as keyof MaterialCard]}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditMaterialCard(card)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Поставки материалов</h2>
              <Button onClick={handleAddDelivery}>
                <TruckIcon className="w-4 h-4 mr-2" />
                Оформить поставку
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Управление поставками</CardTitle>
                <CardDescription>
                  Здесь вы можете оформить поставку материалов на склад
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Функциональность будет добавлена позже
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Диалоги */}
        <MaterialCardDialog
          open={materialCardDialogOpen}
          onOpenChange={setMaterialCardDialogOpen}
          materialCard={editingMaterialCard}
          onSuccess={fetchData}
        />

        <DeliveryDialog
          open={deliveryDialogOpen}
          onOpenChange={setDeliveryDialogOpen}
          onSuccess={fetchData}
        />
      </div>
    </DashboardLayout>
  )
} 