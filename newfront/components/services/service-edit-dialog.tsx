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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Service, servicesApi, contractsApi, Contract } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ServiceEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service
  onSuccess: () => void
}

export function ServiceEditDialog({ open, onOpenChange, service, onSuccess }: ServiceEditDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    contract_id: "",
    material_card_id: "1"
  })
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchContracts = async () => {
    try {
      const data = await contractsApi.getAll()
      setContracts(data)
    } catch (error: any) {
      console.error("Ошибка при загрузке договоров:", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchContracts()
    }
  }, [open])

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        price: service.price.toString(),
        contract_id: service.contract_id.toString(),
        material_card_id: service.material_card.toString()
      })
    }
  }, [service])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (!value) return
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.contract_id) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните все обязательные поля",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await servicesApi.update(service.id, {
        name: formData.name,
        price: parseInt(formData.price),
        contract_id: parseInt(formData.contract_id),
        material_card_id: parseInt(formData.material_card_id)
      })
      toast({
        title: "Успешно",
        description: "Услуга обновлена",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось обновить услугу",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="service-edit-description">
        <DialogHeader>
          <DialogTitle>Редактировать услугу</DialogTitle>
          <DialogDescription id="service-edit-description">
            Измените данные услуги
          </DialogDescription>
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

          <div className="space-y-2">
            <Label htmlFor="price">Цена</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="Введите цену"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_id">Договор</Label>
            <Select
              value={formData.contract_id}
              onValueChange={(value) => handleSelectChange("contract_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите договор" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id.toString()}>
                    {contract.number} ({contract.client_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material_card_id">Технологическая карта</Label>
            <Select
              value={formData.material_card_id}
              onValueChange={(value) => handleSelectChange("material_card_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите технологическую карту" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Технологическая карта #1</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 