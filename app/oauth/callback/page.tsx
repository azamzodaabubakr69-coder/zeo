"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { LogoMark } from "@/components/brand"

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { setAuthFromToken } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = params.get("token")
    const err = params.get("error")
    if (err) {
      setError(err.replace(/_/g, " "))
      setTimeout(() => router.replace(`/login?error=${encodeURIComponent(err)}`), 1200)
      return
    }
    if (!token) {
      setError("Missing token")
      setTimeout(() => router.replace("/login?error=missing_token"), 1200)
      return
    }
    setAuthFromToken(token).then(() => {
      router.replace("/chat")
    })
  }, [params, router, setAuthFromToken])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <LogoMark className="h-9 w-9 text-foreground" />
        <p className="text-sm">{error ? `Error: ${error}` : "Completing sign-in…"}</p>
      </div>
    </main>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
