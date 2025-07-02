"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { workersApi } from "@/lib/api"

interface WorkerEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worker: any
  onSuccess: () => void
}

export function WorkerEditDialog({ open, onOpenChange, worker, onSuccess }: WorkerEditDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    salary_schema: "fixed",
    tmp_salary: 0,
    has_car: false,
    password: "",
  })

  useEffect(() => {
    if (worker) {
      setFormData({
        name: worker.name || "",
        surname: worker.surname || "",
        email: worker.email || "",
        phone: worker.phone || "",
        salary_schema: worker.salary_schema || "fixed",
        tmp_salary: worker.tmp_salary || 0,
        has_car: worker.has_car || false,
        password: "", // Не заполняем пароль при редактировании
      })
    }
  }, [worker])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      if (!formData.name || !formData.surname || !formData.email || !formData.phone) {
        throw new Error("Необходимо заполнить все обязательные поля")
      }

      // Если пароль не указан, не отправляем его
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }

      await workersApi.update(worker.id, updateData)
      toast({
        title: "Успешно",
        description: "Данные сотрудника обновлены",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Ошибка при обновлении сотрудника:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="worker-edit-description">
        <DialogHeader>
          <DialogTitle>Редактирование сотрудника</DialogTitle>
          <DialogDescription id="worker-edit-description">
            Измените данные сотрудника
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              name="name"
              placeholder="Введите имя"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surname">Фамилия</Label>
            <Input
              id="surname"
              name="surname"
              placeholder="Введите фамилию"
              value={formData.surname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Введите email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Введите телефон"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary_schema">Схема оплаты</Label>
            <Select
              value={formData.salary_schema}
              onValueChange={(value) => handleSelectChange("salary_schema", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите схему оплаты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Фиксированная</SelectItem>
                <SelectItem value="percentage">Процентная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tmp_salary">Зарплата</Label>
            <Input
              id="tmp_salary"
              name="tmp_salary"
              type="number"
              placeholder="Введите зарплату"
              value={formData.tmp_salary}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="has_car"
              name="has_car"
              type="checkbox"
              checked={formData.has_car}
              onChange={(e) => setFormData(prev => ({ ...prev, has_car: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="has_car">Есть машина</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Новый пароль (необязательно)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Введите новый пароль (минимум 6 символов)"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
            />
            <p className="text-sm text-muted-foreground">
              Оставьте поле пустым, если не хотите менять пароль
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 