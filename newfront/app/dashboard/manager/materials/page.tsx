"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { materialsApi, Material } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { MaterialDialog } from "@/components/materials/material-dialog"
import { QuantityDialog } from "@/components/materials/quantity-dialog"
import { Plus, Edit, Trash2, Plus as PlusIcon, Minus as MinusIcon } from "lucide-react"

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  
  // Состояния для диалогов
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [quantityOperation, setQuantityOperation] = useState<"add" | "subtract">("add")

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const data = await materialsApi.getAll()
      setMaterials(data)
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить материалы",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterial = () => {
    setEditingMaterial(null)
    setMaterialDialogOpen(true)
  }

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material)
    setMaterialDialogOpen(true)
  }

  const handleDeleteMaterial = async (material: Material) => {
    try {
      await materialsApi.delete(material.id)
      await fetchMaterials()
      toast({
        title: "Успешно",
        description: `Материал "${material.name}" удален`,
      })
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить материал",
        variant: "destructive",
      })
    }
  }

  const handleQuantityOperation = (material: Material, operation: "add" | "subtract") => {
    setSelectedMaterial(material)
    setQuantityOperation(operation)
    setQuantityDialogOpen(true)
    }



  if (loading) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>
  }

  return (
    <DashboardLayout requiredRole="manager">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Материалы</h1>
          <Button onClick={handleCreateMaterial}>
            <Plus className="w-4 h-4 mr-2" />
            Создать материал
          </Button>
      </div>

          <Card>
            <CardHeader>
            <CardTitle>Список материалов</CardTitle>
            </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Материалы не найдены. Создайте первый материал.
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div key={material.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{material.name}</h3>
                          <Badge variant="secondary">
                            Тип ДС: {material.type_ds}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {material.id} • Создан: {new Date(material.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityOperation(material, "add")}
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Добавить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityOperation(material, "subtract")}
                          disabled={material.storage === 0}
                        >
                          <MinusIcon className="w-4 h-4 mr-1" />
                          Вычесть
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMaterial(material)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Удалить
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить материал?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить. Материал "{material.name}" будет удален навсегда.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMaterial(material)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {material.storage} шт.
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Обновлен: {new Date(material.updated_at).toLocaleDateString()}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

      {/* Диалоги */}
        <MaterialDialog
          open={materialDialogOpen}
          onOpenChange={setMaterialDialogOpen}
          material={editingMaterial}
          onSuccess={fetchMaterials}
      />
      
        {selectedMaterial && (
          <QuantityDialog
            open={quantityDialogOpen}
            onOpenChange={setQuantityDialogOpen}
            material={selectedMaterial}
            operation={quantityOperation}
            onSuccess={fetchMaterials}
      />
        )}
    </div>
    </DashboardLayout>
  )
} 