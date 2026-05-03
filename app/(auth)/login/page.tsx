"use client"

import { Suspense, useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ApiError, BACKEND_URL } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleMark } from "@/components/brand"
import { toast } from "@/components/ui/toaster"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const err = params.get("error")
    if (err) {
      toast.error("Sign-in failed", { description: err.replace(/_/g, " ") })
    }
  }, [params])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      router.replace("/chat")
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not sign in"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function googleSignIn() {
    const url = `${BACKEND_URL}/api/auth/google?redirect_to=${encodeURIComponent(`${window.location.origin}/oauth/callback`)}`
    window.location.href = url
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to keep building with Zeo.</p>
      </div>

      <Button type="button" variant="outline" className="w-full h-11" onClick={googleSignIn}>
        <GoogleMark className="h-4 w-4" />
        <span>Continue with Google</span>
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full h-11" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-foreground font-medium hover:underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
