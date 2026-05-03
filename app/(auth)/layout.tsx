"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { LogoMark } from "@/components/brand"

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat")
    }
  }, [loading, user, router])

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-5 flex items-center">
        <a href="/" className="flex items-center gap-2 text-foreground" aria-label="Zeo">
          <LogoMark className="h-7 w-7" />
          <div className="flex flex-col leading-none">
            <span className="font-semibold tracking-tight">Zeo</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">by ZekronAI</span>
          </div>
        </a>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  )
}
