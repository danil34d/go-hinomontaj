"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download } from "lucide-react"
import { ClientFormDialog } from "./client-form-dialog"

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  clientId?: number
}

export function ClientDialog({ open, onOpenChange, onSuccess, clientId }: ClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)
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

  const handleClientFormSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open && !clientId} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить клиента</DialogTitle>
          </DialogHeader>
          <ClientFormDialog
            open={open && !clientId}
            onOpenChange={onOpenChange}
            onSuccess={handleClientFormSuccess}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={open && !!clientId} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить машину</DialogTitle>
          </DialogHeader>
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
                <div className="space-y-2">
                  <Label htmlFor="file">Выберите Excel файл</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
} 