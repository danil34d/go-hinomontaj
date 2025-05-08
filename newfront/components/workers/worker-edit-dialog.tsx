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
    role: "",
    password: "",
  })

  useEffect(() => {
    if (worker) {
      setFormData({
        name: worker.name || "",
        surname: worker.surname || "",
        email: worker.email || "",
        role: worker.role || "worker",
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

      if (!formData.name || !formData.surname || !formData.email) {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактирование сотрудника</DialogTitle>
          <DialogDescription>
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
            <Label htmlFor="role">Роль</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange("role", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">Работник</SelectItem>
                <SelectItem value="manager">Менеджер</SelectItem>
              </SelectContent>
            </Select>
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