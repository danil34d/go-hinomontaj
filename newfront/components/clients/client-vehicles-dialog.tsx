import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { clientsApi } from "@/lib/api"

interface Vehicle {
  id: number
  number: string
  model: string
  year: number
}

interface ClientVehiclesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: number
  clientName: string
}

export function ClientVehiclesDialog({ open, onOpenChange, clientId, clientName }: ClientVehiclesDialogProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    number: "",
    model: "",
    year: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const data = await clientsApi.getVehicles(clientId)
      setVehicles(data)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список автомобилей",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchVehicles()
    }
  }, [open, clientId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.number.trim()) {
        throw new Error("Номер автомобиля обязателен")
      }
      if (!formData.model.trim()) {
        throw new Error("Модель автомобиля обязательна")
      }
      if (!formData.year.trim()) {
        throw new Error("Год выпуска обязателен")
      }

      const year = parseInt(formData.year)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        throw new Error("Некорректный год выпуска")
      }

      await clientsApi.addVehicle(clientId, {
        number: formData.number,
        model: formData.model,
        year: year,
      })

      toast({
        title: "Успех",
        description: "Автомобиль успешно добавлен",
      })

      setFormData({
        number: "",
        model: "",
        year: "",
      })

      fetchVehicles()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось добавить автомобиль",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (vehicleId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот автомобиль?")) {
      return
    }

    try {
      await clientsApi.deleteVehicle(clientId, vehicleId)
      toast({
        title: "Успех",
        description: "Автомобиль успешно удален",
      })
      fetchVehicles()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить автомобиль",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Автомобили клиента {clientName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Номер</Label>
              <Input
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Введите номер"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Модель</Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Введите модель"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Год выпуска</Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                placeholder="Введите год"
                min="1900"
                max={new Date().getFullYear()}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Добавление..." : "Добавить автомобиль"}
            </Button>
          </div>
        </form>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Модель</TableHead>
                <TableHead>Год выпуска</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Автомобили не найдены
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.number}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
} 