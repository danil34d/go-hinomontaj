"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Car } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { ClientVehiclesDialog } from "@/components/clients/client-vehicles-dialog"

export type Client = {
  id: number
  name: string
  phone: string
  email: string
  client_type: string
}

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Имя",
  },
  {
    accessorKey: "phone",
    header: "Телефон",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "client_type",
    header: "Тип клиента",
    cell: ({ row }) => {
      const type = row.getValue("client_type") as string
      return type === "physical" ? "Физическое лицо" : "Юридическое лицо"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const [isOpen, setIsOpen] = useState(false)
      const client = row.original

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsOpen(true)}>
                <Car className="mr-2 h-4 w-4" />
                Машины
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ClientVehiclesDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            clientId={client.id}
            clientName={client.name}
          />
        </>
      )
    },
  },
] 