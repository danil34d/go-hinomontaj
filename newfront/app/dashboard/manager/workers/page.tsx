"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { workersApi, Worker } from "@/lib/api"
import { Edit, MoreHorizontal, Plus, Search, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { WorkerFormDialog } from "@/components/workers/worker-form-dialog"
import { WorkerEditDialog } from "@/components/workers/worker-edit-dialog"

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      const data = await workersApi.getAll()
      setWorkers(data)
    } catch (error) {
      console.error("Ошибка при загрузке сотрудников:", error)
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить список сотрудников",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorker = async (id: number) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"))
      if (user.role !== "manager") {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "У вас нет прав на удаление сотрудников",
        })
        return
      }

      await workersApi.delete(id)
      toast({
        title: "Успешно",
        description: "Сотрудник успешно удален",
      })
      fetchWorkers()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      })
    }
  }

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsEditDialogOpen(true)
  }

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.phone?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Управление сотрудниками</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать сотрудника
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск сотрудников..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Фамилия</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Зарплата</TableHead>
                  <TableHead>Схема</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Сотрудники не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>#{worker.id}</TableCell>
                      <TableCell>{worker.name}</TableCell>
                      <TableCell>{worker.surname}</TableCell>
                      <TableCell>{worker.email || "Н/Д"}</TableCell>
                      <TableCell>{worker.phone || "Н/Д"}</TableCell>
                      <TableCell>{worker.tmp_salary || 0}</TableCell>
                      <TableCell>
                        <Badge variant={worker.salary_schema === "fixed" ? "default" : "secondary"}>
                          {worker.salary_schema === "fixed" ? "Фиксированная" : "Процентная"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(worker)}>
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteWorker(worker.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <WorkerFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchWorkers}
      />

      {selectedWorker && (
        <WorkerEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          worker={selectedWorker}
          onSuccess={fetchWorkers}
        />
      )}
    </DashboardLayout>
  )
}
