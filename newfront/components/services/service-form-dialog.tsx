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
import { servicesApi, contractsApi, Contract } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ContractPrice {
  contract_id: number
  price: string
}

export function ServiceFormDialog({ open, onOpenChange, onSuccess }: ServiceFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    material_card_id: "1" // По умолчанию используем технологическую карту с ID 1
  })
  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractPrices, setContractPrices] = useState<ContractPrice[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchContracts = async () => {
    try {
      const data = await contractsApi.getAll()
      setContracts(data)
      // Инициализируем цены для всех договоров
      setContractPrices(data.map(contract => ({
        contract_id: contract.id,
        price: ""
      })))
    } catch (error: any) {
      console.error("Ошибка при загрузке договоров:", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchContracts()
    }
  }, [open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (!value) return
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePriceChange = (contractId: number, price: string) => {
    setContractPrices(prev => 
      prev.map(cp => 
        cp.contract_id === contractId 
          ? { ...cp, price } 
          : cp
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите название услуги",
      })
      return
    }

    // Проверяем, что хотя бы одна цена указана
    const hasPrices = contractPrices.some(cp => cp.price && cp.price !== "")
    if (!hasPrices) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Укажите хотя бы одну цену для договора",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Создаем услуги для всех договоров с указанными ценами
      const promises = contractPrices
        .filter(cp => cp.price && cp.price !== "")
        .map(cp => 
          servicesApi.create({
        name: formData.name,
            price: parseInt(cp.price),
            contract_id: cp.contract_id,
        material_card_id: parseInt(formData.material_card_id)
      })
        )

      await Promise.all(promises)
      
      toast({
        title: "Успешно",
        description: "Услуга создана для всех выбранных договоров",
      })
      onSuccess()
      onOpenChange(false)
      setFormData({ name: "", material_card_id: "1" })
      setContractPrices([])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось создать услугу",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="service-form-description" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать новую услугу</DialogTitle>
          <DialogDescription id="service-form-description">
            Заполните форму для создания новой услуги с ценами по договорам
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-4">
            <Label>Цены по договорам</Label>
            <div className="space-y-3">
              {contracts.map((contract) => {
                const contractPrice = contractPrices.find(cp => cp.contract_id === contract.id)
                return (
                  <div key={contract.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        {contract.number} ({contract.client_type})
                      </Label>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Цена"
                        value={contractPrice?.price || ""}
                        onChange={(e) => handlePriceChange(contract.id, e.target.value)}
                        className="text-right"
                      />
                    </div>
                    <div className="w-8 text-sm text-muted-foreground">₽</div>
                  </div>
                )
              })}
            </div>
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
              {isSubmitting ? "Создание..." : "Создать услугу"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 