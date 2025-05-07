"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: number
  email: string
  role: "manager" | "worker"
  name?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Проверяем, есть ли сохраненный токен и пользователь
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка при входе")
      }

      const data = await response.json()

      // Сохраняем токен и данные пользователя
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)

      toast({
        title: "Успешный вход",
        description: `Добро пожаловать, ${data.user.email}!`,
      })

      // Перенаправляем на соответствующую страницу в зависимости от роли
      if (data.user.role === "manager") {
        router.push("/dashboard/manager")
      } else {
        router.push("/dashboard/worker")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка при регистрации")
      }

      const data = await response.json()

      // Сохраняем токен и данные пользователя
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)

      toast({
        title: "Успешная регистрация",
        description: `Добро пожаловать, ${data.user.email}!`,
      })

      // Перенаправляем на соответствующую страницу в зависимости от роли
      if (data.user.role === "manager") {
        router.push("/dashboard/manager")
      } else {
        router.push("/dashboard/worker")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка регистрации",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
