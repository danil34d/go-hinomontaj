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

      if (!formData.name || !formData.password) {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создание нового сотрудника</DialogTitle>
          <DialogDescription>
            Заполните форму для создания нового сотрудника
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Имя сотрудника</Label>
            <Input
              id="name"
              name="name"
              placeholder="Введите имя сотрудника"
              value={formData.name}
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