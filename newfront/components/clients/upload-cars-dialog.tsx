"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Download } from "lucide-react"
import { toast } from "sonner"
import { clientsApi } from "@/lib/api"

interface UploadCarsDialogProps {
  clientId: number
  onSuccess?: () => void
}

export function UploadCarsDialog({ clientId, onSuccess }: UploadCarsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/manager/clients/vehicles/template")
      if (!response.ok) {
        throw new Error("Не удалось скачать шаблон")
      }

      // Создаем ссылку для скачивания
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

      const response = await fetch(`/api/manager/clients/${clientId}/vehicles/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Не удалось загрузить файл")
      }

      toast.success("Машины успешно загружены")
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error)
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить файл")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Загрузить список
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Загрузка списка машин</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  )
} 