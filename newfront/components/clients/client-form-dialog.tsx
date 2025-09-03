import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast"
import { clientsApi, contractsApi, Contract, clientTypesApi } from "@/lib/api"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: any
  onSuccess: () => void
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    owner_phone: "",
    manager_phone: "",
    client_type: "",
    contract_id: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientTypes, setClientTypes] = useState<string[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isNewType] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      // Загружаем типы клиентов и договоры при открытии диалога
      Promise.all([
        clientTypesApi.getAll().catch(() => ["Наличка", "Контрагент", "Агрегатор"]),
        contractsApi.getAll().catch(() => [])
      ]).then(([types, contractsData]) => {
          setClientTypes(types)
        setContracts(contractsData)
        
          if (client) {
            setFormData({
              name: client.name,
              owner_phone: client.owner_phone,
              manager_phone: client.manager_phone,
              client_type: client.client_type,
              contract_id: client.contract_id?.toString() || "",
            })
        } else {
          // Сбрасываем форму для создания нового клиента
          setFormData({
            name: "",
            owner_phone: "",
            manager_phone: "",
            client_type: "",
            contract_id: "",
          })
        }
        })
    }
  }, [open, client])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) =>
    setFormData(prev => ({ ...prev, [name]: value }))

  const handleTypeChange = (value: string) => setFormData(prev => ({ ...prev, client_type: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Проверяем, что все поля заполнены
      if (!formData.name.trim()) {
        throw new Error("Имя клиента обязательно")
      }
      if (!formData.owner_phone.trim()) {
        throw new Error("Телефон владельца обязателен")
      }
      if (!formData.manager_phone.trim()) {
        throw new Error("Телефон менеджера обязателен")
      }
      if (!formData.client_type) {
        throw new Error("Тип клиента обязателен")
      }

      const clientData = {
        name: formData.name,
        owner_phone: formData.owner_phone,
        manager_phone: formData.manager_phone,
        client_type: formData.client_type,
        contract_id: parseInt(formData.contract_id),
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
      <DialogContent className="max-w-md" aria-describedby="client-form-description">
        <DialogHeader>
          <DialogTitle>{client ? "Редактирование клиента" : "Создание нового клиента"}</DialogTitle>
          <DialogDescription id="client-form-description">
            {client ? "Измените данные клиента" : "Заполните форму для создания нового клиента"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя клиента</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Введите имя клиента" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_phone">Телефон владельца</Label>
              <Input id="owner_phone" name="owner_phone" value={formData.owner_phone} onChange={handleChange} placeholder="Введите телефон владельца" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager_phone">Телефон менеджера</Label>
              <Input id="manager_phone" name="manager_phone" value={formData.manager_phone} onChange={handleChange} placeholder="Введите телефон менеджера" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Тип клиента</Label>
            <Select
              value={formData.client_type}
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
              </SelectContent>
            </Select>
          </div>

          {/* Удалено добавление нового типа клиента */}

          <div className="space-y-2">
            <Label>Договор</Label>
            <Select
              value={formData.contract_id}
              onValueChange={(value) => handleSelectChange("contract_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите договор" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map(contract => (
                  <SelectItem key={contract.id} value={contract.id.toString()}>
                    {contract.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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