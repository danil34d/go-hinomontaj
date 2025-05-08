"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { servicesApi, clientTypesApi } from "@/lib/api"

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ServiceFormDialog({ open, onOpenChange, onSuccess }: ServiceFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    prices: {} as Record<string, number>,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientTypes, setClientTypes] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      // Загружаем типы клиентов при открытии диалога
      clientTypesApi.getAll()
        .then(types => {
          setClientTypes(types)
          // Инициализируем цены для каждого типа клиента
          const initialPrices: Record<string, number> = {}
          types.forEach(type => {
            initialPrices[type] = 0
          })
          setFormData(prev => ({ ...prev, prices: initialPrices }))
        })
        .catch(error => {
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить типы клиентов",
            variant: "destructive",
          })
        })
    }
  }, [open, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.startsWith("price_")) {
      const clientType = name.replace("price_", "")
      setFormData(prev => ({
        ...prev,
        prices: {
          ...prev.prices,
          [clientType]: Number(value.replace(/\D/g, ""))
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Проверяем, что все поля заполнены
      if (!formData.name.trim()) {
        throw new Error("Название услуги обязательно")
      }

      // Проверяем, что все цены заполнены
      for (const type of clientTypes) {
        if (!formData.prices[type]) {
          throw new Error(`Необходимо указать цену для типа клиента: ${type}`)
        }
      }

      await servicesApi.create(formData)
      toast({
        title: "Успех",
        description: "Услуга успешно создана",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать услугу",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новую услугу</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название услуги</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите название услуги"
              required
            />
          </div>

          {clientTypes.map(type => (
            <div key={type} className="space-y-2">
              <Label htmlFor={`price_${type}`}>Цена для {type}</Label>
              <Input
                id={`price_${type}`}
                name={`price_${type}`}
                value={formData.prices[type] || ""}
                onChange={handleChange}
                placeholder="Введите цену"
                required
              />
            </div>
          ))}

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
              {isSubmitting ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 