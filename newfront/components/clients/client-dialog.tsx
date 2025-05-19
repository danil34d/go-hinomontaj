"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download } from "lucide-react"

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  clientId?: number
}

export function ClientDialog({ open, onOpenChange, onSuccess, clientId }: ClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    client_type: "",
  })
  const [carData, setCarData] = useState({
    number: "",
    model: "",
    year: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/manager/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Не удалось создать клиента")
      }

      toast.success("Клиент успешно создан")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Ошибка при создании клиента:", error)
      toast.error(error instanceof Error ? error.message : "Не удалось создать клиента")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/manager/clients/${clientId}/vehicles`, {
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
      onSuccess?.()
    } catch (error) {
      console.error("Ошибка при добавлении машины:", error)
      toast.error(error instanceof Error ? error.message : "Не удалось добавить машину")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/manager/clients/vehicles/template")
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
    if (!file || !clientId) return

    try {
      setIsLoading(true)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/manager/clients/${clientId}/vehicles/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Не удалось загрузить файл")
      }

      toast.success("Машины успешно загружены")
      onSuccess?.()
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error)
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить файл")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{clientId ? "Добавить машину" : "Добавить клиента"}</DialogTitle>
        </DialogHeader>
        {clientId ? (
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Одна машина</TabsTrigger>
              <TabsTrigger value="excel">Список из Excel</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
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
            </TabsContent>
            <TabsContent value="excel">
              <div className="space-y-4">
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
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_type">Тип клиента</Label>
              <Select
                value={formData.client_type}
                onValueChange={(value) => setFormData({ ...formData, client_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип клиента" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Физическое лицо</SelectItem>
                  <SelectItem value="legal">Юридическое лицо</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Создание..." : "Создать"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 