import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"

import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata = {
  title: "Система управления Hinomontaj",
  description: "Система управления заказами и сотрудниками",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
