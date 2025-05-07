"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { UserNav } from "@/components/layout/user-nav"

export function DashboardLayout({
  children,
  requiredRole,
}: { children: React.ReactNode; requiredRole?: "manager" | "worker" }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Если загрузка завершена и пользователь не авторизован, перенаправляем на страницу входа
    if (!isLoading && !user) {
      router.push("/login")
      return
    }

    // Если указана требуемая роль и роль пользователя не соответствует, перенаправляем
    if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      if (user.role === "manager") {
        router.push("/dashboard/manager")
      } else {
        router.push("/dashboard/worker")
      }
    }
  }, [user, isLoading, router, requiredRole])

  // Показываем загрузку, пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Если пользователь не авторизован, не показываем содержимое
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <div className="flex-1"></div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
