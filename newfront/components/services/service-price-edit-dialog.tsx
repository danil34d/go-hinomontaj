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
import { ServiceWithPrices, servicesApi, contractsApi, Contract } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ServicePriceEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceWithPrices
  onSuccess: () => void
}

interface ContractPrice {
  contract_id: number
  contract_name: string
  price: string
}

export function ServicePriceEditDialog({ open, onOpenChange, service, onSuccess }: ServicePriceEditDialogProps) {
  const [contractPrices, setContractPrices] = useState<ContractPrice[]>([])
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
    if (service && contracts.length > 0) {
      // Инициализируем цены для всех договоров
      const prices = contracts.map(contract => {
        const existingPrice = service.prices?.find(p => p.contract_id === contract.id)
        return {
          contract_id: contract.id,
          contract_name: contract.number,
          price: existingPrice ? existingPrice.price.toString() : ""
        }
      })
      setContractPrices(prices)
    }
  }, [service, contracts])

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
    
    // Проверяем, что хотя бы одна цена указана
    const validPrices = contractPrices.filter(cp => cp.price && cp.price !== "" && parseInt(cp.price) > 0)
    if (validPrices.length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Укажите хотя бы одну цену для договора",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Создаем новые услуги для договоров с указанными ценами
      const promises = validPrices.map(cp => 
        servicesApi.create({
          name: service.name,
          price: parseInt(cp.price),
          contract_id: cp.contract_id,
          material_card_id: service.material_card
        })
      )

      await Promise.all(promises)
      
      toast({
        title: "Успешно",
        description: "Цены услуги обновлены для всех выбранных договоров",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось обновить цены услуги",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="service-price-edit-description" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать цены услуги</DialogTitle>
          <DialogDescription id="service-price-edit-description">
            Измените цены для услуги "{service?.name}" по всем договорам
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Название услуги</Label>
            <div className="p-3 border rounded-md bg-muted">
              <span className="font-medium">{service?.name}</span>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Цены по договорам</Label>
            <div className="space-y-3">
              {contractPrices.map((contractPrice) => (
                <div key={contractPrice.contract_id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">
                      {contractPrice.contract_name}
                    </Label>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Цена"
                      value={contractPrice.price}
                      onChange={(e) => handlePriceChange(contractPrice.contract_id, e.target.value)}
                      className="text-right"
                      min="0"
                    />
                  </div>
                  <div className="w-8 text-sm text-muted-foreground">₽</div>
                </div>
              ))}
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
              {isSubmitting ? "Сохранение..." : "Сохранить цены"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 