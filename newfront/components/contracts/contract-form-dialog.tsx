"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { contractsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ContractFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const clientTypes = [
  "НАЛИЧКА",
  "КОНТРАГЕНТЫ", 
  "АГРЕГАТОРЫ"
]

export function ContractFormDialog({ open, onOpenChange, onSuccess }: ContractFormDialogProps) {
  const [formData, setFormData] = useState({
    number: "",
    description: "",
    client_company_name: "",
    client_company_address: "",
    client_company_phone: "",
    client_company_email: "",
    client_company_inn: "",
    client_company_kpp: "",
    client_company_ogrn: "",
    client_type: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

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
    
    if (!formData.number || !formData.client_type || !formData.client_company_name) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните все обязательные поля",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await contractsApi.create(formData)
      toast({
        title: "Успешно",
        description: "Договор создан",
      })
      onSuccess()
      onOpenChange(false)
      setFormData({
        number: "",
        description: "",
        client_company_name: "",
        client_company_address: "",
        client_company_phone: "",
        client_company_email: "",
        client_company_inn: "",
        client_company_kpp: "",
        client_company_ogrn: "",
        client_type: ""
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось создать договор",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="contract-form-description">
        <DialogHeader>
          <DialogTitle>Создать новый договор</DialogTitle>
          <DialogDescription id="contract-form-description">
            Заполните форму для создания нового договора
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label htmlFor="number">Номер договора *</Label>
            <Input
              id="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              placeholder="Введите номер договора"
              required
            />
          </div>

          <div className="space-y-2">
              <Label htmlFor="client_type">Тип клиента *</Label>
            <Select
              value={formData.client_type}
              onValueChange={(value) => handleSelectChange("client_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип клиента" />
              </SelectTrigger>
              <SelectContent>
                {clientTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание договора</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Введите описание договора"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Информация о компании</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_company_name">Название компании *</Label>
                <Input
                  id="client_company_name"
                  name="client_company_name"
                  value={formData.client_company_name}
                  onChange={handleChange}
                  placeholder="Введите название компании"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_company_phone">Телефон компании</Label>
                <Input
                  id="client_company_phone"
                  name="client_company_phone"
                  value={formData.client_company_phone}
                  onChange={handleChange}
                  placeholder="Введите телефон компании"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_company_address">Адрес компании</Label>
              <Input
                id="client_company_address"
                name="client_company_address"
                value={formData.client_company_address}
                onChange={handleChange}
                placeholder="Введите адрес компании"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_company_email">Email компании</Label>
                <Input
                  id="client_company_email"
                  name="client_company_email"
                  type="email"
                  value={formData.client_company_email}
                  onChange={handleChange}
                  placeholder="Введите email компании"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_company_inn">ИНН</Label>
                <Input
                  id="client_company_inn"
                  name="client_company_inn"
                  value={formData.client_company_inn}
                  onChange={handleChange}
                  placeholder="Введите ИНН"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_company_kpp">КПП</Label>
                <Input
                  id="client_company_kpp"
                  name="client_company_kpp"
                  value={formData.client_company_kpp}
                  onChange={handleChange}
                  placeholder="Введите КПП"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_company_ogrn">ОГРН</Label>
                <Input
                  id="client_company_ogrn"
                  name="client_company_ogrn"
                  value={formData.client_company_ogrn}
                  onChange={handleChange}
                  placeholder="Введите ОГРН"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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