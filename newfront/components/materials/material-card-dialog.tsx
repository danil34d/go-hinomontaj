"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { materialsApi, MaterialCard } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface MaterialCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  materialCard?: MaterialCard | null
  onSuccess: () => void
}

export function MaterialCardDialog({ open, onOpenChange, materialCard, onSuccess }: MaterialCardDialogProps) {
  const [formData, setFormData] = useState({
    rs25: "",
    r19: "",
    r20: "",
    r25: "",
    r251: "",
    r13: "",
    r15: "",
    foot9: "",
    foot12: "",
    foot15: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const isEditing = !!materialCard

  useEffect(() => {
    if (open) {
      if (materialCard) {
        // Редактирование существующей карты
        setFormData({
          rs25: materialCard.rs25.toString(),
          r19: materialCard.r19.toString(),
          r20: materialCard.r20.toString(),
          r25: materialCard.r25.toString(),
          r251: materialCard.r251.toString(),
          r13: materialCard.r13.toString(),
          r15: materialCard.r15.toString(),
          foot9: materialCard.foot9.toString(),
          foot12: materialCard.foot12.toString(),
          foot15: materialCard.foot15.toString(),
        })
      } else {
        // Создание новой карты
        setFormData({
          rs25: "",
          r19: "",
          r20: "",
          r25: "",
          r251: "",
          r13: "",
          r15: "",
          foot9: "",
          foot12: "",
          foot15: "",
        })
      }
    }
  }, [open, materialCard])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Проверяем, что хотя бы одно поле заполнено
    const hasValues = Object.values(formData).some(value => value && value !== "0")
    if (!hasValues) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните хотя бы одно поле",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const data = {
        rs25: parseInt(formData.rs25) || 0,
        r19: parseInt(formData.r19) || 0,
        r20: parseInt(formData.r20) || 0,
        r25: parseInt(formData.r25) || 0,
        r251: parseInt(formData.r251) || 0,
        r13: parseInt(formData.r13) || 0,
        r15: parseInt(formData.r15) || 0,
        foot9: parseInt(formData.foot9) || 0,
        foot12: parseInt(formData.foot12) || 0,
        foot15: parseInt(formData.foot15) || 0,
      }

      if (isEditing && materialCard) {
        await materialsApi.updateMaterialCard(materialCard.id, data)
        toast({
          title: "Успешно",
          description: "Технологическая карта обновлена",
        })
      } else {
        await materialsApi.createMaterialCard(data)
        toast({
          title: "Успешно",
          description: "Технологическая карта создана",
        })
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить технологическую карту",
      })
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="material-card-description" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать технологическую карту" : "Создать технологическую карту"}
          </DialogTitle>
          <DialogDescription id="material-card-description">
            {isEditing 
              ? "Измените количество материалов в технологической карте"
              : "Укажите количество материалов для новой технологической карты"
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {materialFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  name={field.key}
                  type="number"
                  min="0"
                  value={formData[field.key as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder="0"
                  className="text-right"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEditing ? "Сохранение..." : "Создание...") 
                : (isEditing ? "Сохранить" : "Создать")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 