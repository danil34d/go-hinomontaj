"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { materialsApi, Material } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface QuantityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: Material
  operation: "add" | "subtract"
  onSuccess: () => void
}

export function QuantityDialog({ open, onOpenChange, material, operation, onSuccess }: QuantityDialogProps) {
  const [quantity, setQuantity] = useState("")
  const [loading, setLoading] = useState(false)

  const isAdd = operation === "add"
  const title = isAdd ? "Добавить количество" : "Вычесть количество"
  const description = isAdd 
    ? `Добавить количество к материалу "${material.name}"`
    : `Вычесть количество из материала "${material.name}" (текущий остаток: ${material.storage})`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректное количество",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const qty = parseInt(quantity)
      
      if (isAdd) {
        const result = await materialsApi.addQuantity(material.id, qty)
        toast({
          title: "Успешно",
          description: `Добавлено ${qty} к материалу "${material.name}". Новый остаток: ${result.new_storage || 'неизвестно'}`,
        })
      } else {
        if (qty > material.storage) {
          toast({
            title: "Ошибка",
            description: "Недостаточно материала на складе",
            variant: "destructive",
          })
          return
        }
        const result = await materialsApi.subtractQuantity(material.id, qty)
        toast({
          title: "Успешно",
          description: `Вычтено ${qty} из материала "${material.name}". Новый остаток: ${result.new_storage || 'неизвестно'}`,
        })
      }

      onSuccess()
      onOpenChange(false)
      setQuantity("")
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить количество",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Количество</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Введите количество"
              required
            />
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : (isAdd ? "Добавить" : "Вычесть")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 