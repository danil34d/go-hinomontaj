import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { API_ROUTES } from '@/lib/api-config'

export type User = {
    id: number
    name: string
    email: string
    role: string
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        
        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }
        
        setLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post<{ token: string; user: User }>(
                API_ROUTES.LOGIN,
                { email, password }
            )

            localStorage.setItem('token', response.token)
            localStorage.setItem('user', JSON.stringify(response.user))
            
            setToken(response.token)
            setUser(response.user)
            
            return response.user
        } catch (error) {
            console.error('Ошибка при входе:', error)
            throw error
        }
    }

    const register = async (name: string, email: string, password: string, role: string) => {
        try {
            const response = await api.post<{ token: string; user: User }>(
                API_ROUTES.REGISTER,
                { name, email, password, role }
            )

            localStorage.setItem('token', response.token)
            localStorage.setItem('user', JSON.stringify(response.user))
            
            setToken(response.token)
            setUser(response.user)
            
            return response.user
        } catch (error) {
            console.error('Ошибка при регистрации:', error)
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    return {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
    }
} 