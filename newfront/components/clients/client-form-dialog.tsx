import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { clientsApi, clientTypesApi } from "@/lib/api"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: {
    id: number
    name: string
    phone: string
    client_type: string
  }
  onSuccess: () => void
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    client_type: "",
    new_client_type: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientTypes, setClientTypes] = useState<string[]>([])
  const [isNewType, setIsNewType] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      // Загружаем типы клиентов при открытии диалога
      clientTypesApi.getAll()
        .then(types => {
          setClientTypes(types)
          if (client) {
            setFormData({
              name: client.name,
              phone: client.phone,
              client_type: client.client_type,
              new_client_type: "",
            })
            setIsNewType(!types.includes(client.client_type))
          }
        })
        .catch(error => {
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить типы клиентов",
            variant: "destructive",
          })
        })
    }
  }, [open, client, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: string) => {
    if (value === "new") {
      setIsNewType(true)
      setFormData(prev => ({ ...prev, client_type: "", new_client_type: "" }))
    } else {
      setIsNewType(false)
      setFormData(prev => ({ ...prev, client_type: value, new_client_type: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Проверяем, что все поля заполнены
      if (!formData.name.trim()) {
        throw new Error("Имя клиента обязательно")
      }
      if (!formData.phone.trim()) {
        throw new Error("Телефон клиента обязателен")
      }
      if (!isNewType && !formData.client_type) {
        throw new Error("Тип клиента обязателен")
      }
      if (isNewType && !formData.new_client_type.trim()) {
        throw new Error("Новый тип клиента обязателен")
      }

      const clientData = {
        name: formData.name,
        phone: formData.phone,
        client_type: isNewType ? formData.new_client_type : formData.client_type,
      }

      if (client) {
        await clientsApi.update(client.id, clientData)
        toast({
          title: "Успех",
          description: "Клиент успешно обновлен",
        })
      } else {
        await clientsApi.create(clientData)
        toast({
          title: "Успех",
          description: "Клиент успешно создан",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить клиента",
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
          <DialogTitle>{client ? "Редактировать клиента" : "Добавить клиента"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя клиента</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите имя клиента"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Введите телефон"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Тип клиента</Label>
            <Select
              value={isNewType ? "new" : formData.client_type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип клиента" />
              </SelectTrigger>
              <SelectContent>
                {clientTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Добавить новый тип</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isNewType && (
            <div className="space-y-2">
              <Label htmlFor="new_client_type">Новый тип клиента</Label>
              <Input
                id="new_client_type"
                name="new_client_type"
                value={formData.new_client_type}
                onChange={handleChange}
                placeholder="Введите новый тип клиента"
                required
              />
            </div>
          )}

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
              {isSubmitting ? "Сохранение..." : client ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 