"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { workersApi } from "@/lib/api"

interface WorkerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WorkerFormDialog({ open, onOpenChange, onSuccess }: WorkerFormDialogProps) {
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
    role: "worker",
    password: "",
  })

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

      if (!formData.name || !formData.surname || !formData.email || !formData.phone || !formData.password) {
        throw new Error("Необходимо заполнить все поля")
      }

      if (formData.password.length < 6) {
        throw new Error("Пароль должен содержать минимум 6 символов")
      }

      console.log("Отправляемые данные сотрудника:", formData)

      await workersApi.create(formData)
      toast({
        title: "Успешно",
        description: "Сотрудник успешно создан",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Ошибка при создании сотрудника:", error)
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
      <DialogContent className="max-w-md" aria-describedby="worker-form-description">
        <DialogHeader>
          <DialogTitle>Создание нового сотрудника</DialogTitle>
          <DialogDescription id="worker-form-description">
            Заполните форму для создания нового сотрудника
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
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Введите пароль (минимум 6 символов)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <p className="text-sm text-muted-foreground">
              Пароль должен содержать минимум 6 символов
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 