"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { useClients } from "@/hooks/use-clients"
import { ClientDialog } from "@/components/clients/client-dialog"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"

export default function ClientsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { clients, isLoading, refetch } = useClients()

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск клиентов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить клиента
        </Button>
      </div>

      <DataTable columns={columns} data={filteredClients} isLoading={isLoading} />

      <ClientDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={refetch}
      />
    </div>
  )
} 