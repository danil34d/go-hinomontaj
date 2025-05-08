"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { BarChart3, ClipboardList, Home, LogOut, Users, Package, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Определяем пункты меню в зависимости от роли пользователя
  const menuItems =
    user?.role === "manager"
      ? [
          { href: "/dashboard/manager", label: "Главная", icon: Home },
          { href: "/dashboard/manager/orders", label: "Заказы", icon: ClipboardList },
          { href: "/dashboard/manager/workers", label: "Сотрудники", icon: Users },
          { href: "/dashboard/manager/services", label: "Услуги", icon: Package },
          { href: "/dashboard/manager/clients", label: "Клиенты", icon: UserCircle },
          { href: "/dashboard/manager/statistics", label: "Статистика", icon: BarChart3 },
        ]
      : [
          { href: "/dashboard/worker", label: "Главная", icon: Home },
          { href: "/dashboard/worker/orders", label: "Мои заказы", icon: ClipboardList },
          { href: "/dashboard/worker/statistics", label: "Моя статистика", icon: BarChart3 },
        ]

  return (
    <div className="flex h-screen flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href={user?.role === "manager" ? "/dashboard/manager" : "/dashboard/worker"}
          className="flex items-center gap-2 font-semibold"
        >
          <Package className="h-6 w-6" />
          <span>Hinomontaj</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === item.href && "bg-muted text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    </div>
  )
}
