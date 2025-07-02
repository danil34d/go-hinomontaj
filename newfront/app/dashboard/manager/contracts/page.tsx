"use client"

import { useState, useEffect } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Contract, contractsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ContractFormDialog } from "@/components/contracts/contract-form-dialog"
import { ContractEditDialog } from "@/components/contracts/contract-edit-dialog"

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchContracts = async () => {
    try {
      setIsLoading(true)
      const data = await contractsApi.getAll()
      setContracts(data)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось загрузить договоры",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот договор?")) {
      return
    }

    try {
      await contractsApi.delete(id)
      toast({
        title: "Успешно",
        description: "Договор удален",
      })
      fetchContracts()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось удалить договор",
      })
    }
  }

  const filteredContracts = contracts.filter((contract) =>
    contract.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.client_company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.client_company_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.client_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Договоры</h1>
            <Button disabled>
              <Plus className="w-4 h-4 mr-2" />
              Добавить договор
            </Button>
          </div>
          <div className="text-center py-8">Загрузка...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Договоры</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить договор
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск договоров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер договора</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Тип клиента</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Договоры не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.number}</TableCell>
                    <TableCell>{contract.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{contract.client_company_name}</span>
                        <span className="text-sm text-muted-foreground">{contract.client_company_phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>{contract.client_type}</TableCell>
                    <TableCell>
                      {new Date(contract.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingContract(contract)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(contract.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
      </div>

      <ContractFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchContracts}
      />

      {editingContract && (
        <ContractEditDialog
          open={!!editingContract}
          onOpenChange={(open) => !open && setEditingContract(null)}
          contract={editingContract}
          onSuccess={fetchContracts}
        />
      )}
    </DashboardLayout>
  )
} 