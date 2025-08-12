"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { materialsApi, Material } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface MaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material?: Material | null
  onSuccess: () => void
}

export function MaterialDialog({ open, onOpenChange, material, onSuccess }: MaterialDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type_ds: "1",
    storage: "0"
  })
  const [loading, setLoading] = useState(false)

  const isEditing = !!material

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        type_ds: material.type_ds.toString(),
        storage: material.storage.toString()
      })
    } else {
      setFormData({
        name: "",
        type_ds: "1",
        storage: "0"
      })
    }
  }, [material])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        name: formData.name,
        type_ds: parseInt(formData.type_ds),
        storage: parseInt(formData.storage)
      }

      if (isEditing && material) {
        await materialsApi.update(material.id, data)
        toast({
          title: "Успешно",
          description: "Материал обновлен",
        })
      } else {
        await materialsApi.create(data)
        toast({
          title: "Успешно",
          description: "Материал создан",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить материал",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать материал" : "Создать материал"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Введите название материала"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type_ds">Тип ДС</Label>
            <Input
              id="type_ds"
              type="number"
              min="1"
              value={formData.type_ds}
              onChange={(e) => handleInputChange("type_ds", e.target.value)}
              placeholder="Введите тип ДС"
              required
            />
            <p className="text-sm text-muted-foreground">
              Введите числовое значение для типа ДС
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storage">Количество на складе</Label>
            <Input
              id="storage"
              type="number"
              min="0"
              value={formData.storage}
              onChange={(e) => handleInputChange("storage", e.target.value)}
              placeholder="0"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : (isEditing ? "Обновить" : "Создать")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 