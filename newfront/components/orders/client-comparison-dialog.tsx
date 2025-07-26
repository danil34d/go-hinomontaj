"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { clientsApi, ClientComparison } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Car, Phone, Building, CreditCard, Users } from "lucide-react"

interface ClientComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  carNumber: string
  onClientSelected: (clientId: number, clientName: string) => void
}

export default function ClientComparisonDialog({
  open,
  onOpenChange,
  carNumber,
  onClientSelected,
}: ClientComparisonDialogProps) {
  const [comparisons, setComparisons] = useState<ClientComparison[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && carNumber) {
      loadComparisons()
    }
  }, [open, carNumber])

  const loadComparisons = async () => {
    try {
      setLoading(true)
      const data = await clientsApi.compareClientsForCar(carNumber)
      setComparisons(data)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось загрузить сравнение клиентов",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClient = (clientId: number, clientName: string) => {
    onClientSelected(clientId, clientName)
    onOpenChange(false)
  }

  const getClientTypeBadge = (clientType: string) => {
    const variants = {
      "НАЛИЧКА": "default",
      "КОНТРАГЕНТЫ": "secondary", 
      "АГРЕГАТОРЫ": "outline"
    } as const
    
    return (
      <Badge variant={variants[clientType as keyof typeof variants] || "default"}>
        {clientType}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Загрузка сравнения клиентов...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-40">
            <div className="text-lg">Загрузка...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Выбор клиента для машины {carNumber}
          </DialogTitle>
          <DialogDescription>
            Эта машина принадлежит нескольким клиентам. Выберите клиента для создания заказа и сравните цены услуг.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="grid gap-6 md:grid-cols-2">
            {comparisons.map((comparison, index) => (
              <Card key={comparison.client.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {comparison.client.name}
                    </div>
                    {getClientTypeBadge(comparison.client.client_type)}
                  </CardTitle>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Владелец: {comparison.client.owner_phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Менеджер: {comparison.client.manager_phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Договор ID: {comparison.client.contract_id}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Таблица с ценами услуг */}
                  <div>
                    <h4 className="font-semibold mb-2">Цены услуг:</h4>
                    <ScrollArea className="max-h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Услуга</TableHead>
                            <TableHead className="text-right">Цена</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparison.services.map((service) => (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium">
                                {service.name}
                              </TableCell>
                              <TableCell className="text-right">
                                {service.price.toLocaleString()} ₽
                              </TableCell>
                            </TableRow>
                          ))}
                          {comparison.services.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                Услуги не найдены
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>

                  <Button 
                    onClick={() => handleSelectClient(comparison.client.id, comparison.client.name)}
                    className="w-full"
                    size="lg"
                  >
                    Выбрать клиента "{comparison.client.name}"
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {comparisons.length === 0 && (
            <div className="text-center py-8">
              <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Клиенты для этой машины не найдены</p>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 