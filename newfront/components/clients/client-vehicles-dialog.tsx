"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchWithAuth } from "@/lib/api"

interface Vehicle {
  id: number
  number: string
  model: string
  year: string
}

interface ClientVehiclesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: number
  clientName: string
}

export function ClientVehiclesDialog({ open, onOpenChange, clientId, clientName }: ClientVehiclesDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [carData, setCarData] = useState({
    number: "",
    model: "",
    year: "",
  })

  const fetchVehicles = async () => {
    try {
      const response = await fetchWithAuth(`/api/manager/clients/${clientId}/vehicles`)
      if (!response.ok) {
        throw new Error("Не удалось загрузить список машин")
      }
      const data = await response.json()
      setVehicles(Array.isArray(data) ? data : Array.isArray(data?.vehicles) ? data.vehicles : [])
    } catch (error) {
      console.error("Ошибка при загрузке машин:", error)
      toast.error("Не удалось загрузить список машин")
    }
  }

  useEffect(() => {
    if (open) {
      fetchVehicles()
    }
  }, [open, clientId])

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(`/api/manager/clients/${clientId}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Не удалось добавить машину")
      }

      toast.success("Машина успешно добавлена")
      setCarData({ number: "", model: "", year: "" })
      fetchVehicles()
    } catch (error) {
      console.error("Ошибка при добавлении машины:", error)
      toast.error(error instanceof Error ? error.message : "Не удалось добавить машину")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetchWithAuth("/api/manager/clients/vehicles/template")
      if (!response.ok) {
        throw new Error("Не удалось скачать шаблон")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cars_template.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Шаблон успешно скачан")
    } catch (error) {
      console.error("Ошибка при скачивании шаблона:", error)
      toast.error("Не удалось скачать шаблон")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetchWithAuth(`/api/manager/clients/${clientId}/vehicles/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Не удалось загрузить файл")
      }

      toast.success("Машины успешно загружены")
      fetchVehicles()
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error)
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить файл")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Машины клиента: {clientName}</DialogTitle>
          <DialogDescription>
            Управление списком машин клиента. Вы можете добавить машину вручную или загрузить список из Excel файла.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Список машин</TabsTrigger>
            <TabsTrigger value="add">Добавить машины</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Модель</TableHead>
                    <TableHead>Год</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(vehicles ?? []).map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.number}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                    </TableRow>
                  ))}
                  {(vehicles ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="add">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Добавить одну машину</h3>
                <form onSubmit={handleAddCar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="number">Номер</Label>
              <Input
                id="number"
                      value={carData.number}
                      onChange={(e) => setCarData({ ...carData, number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Модель</Label>
              <Input
                id="model"
                      value={carData.model}
                      onChange={(e) => setCarData({ ...carData, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
                    <Label htmlFor="year">Год</Label>
              <Input
                id="year"
                type="number"
                      value={carData.year}
                      onChange={(e) => setCarData({ ...carData, year: e.target.value })}
              />
            </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Добавление..." : "Добавить"}
                  </Button>
                </form>
          </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Загрузить список из Excel</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Скачайте шаблон Excel файла, заполните его и загрузите обратно
                  </p>
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Скачать шаблон
            </Button>
          </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
        </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 