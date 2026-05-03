"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldOff, LogOut, Home } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/brand"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)

  if (!user || !user.is_admin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center max-w-sm">
          <ShieldOff className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access the admin panel.</p>
          <Button asChild>
            <Link href="/chat">Back to Chat</Link>
          </Button>
        </div>
      </div>
    )
  }

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/models", label: "Models", icon: "🤖" },
    { href: "/admin/keys", label: "API Keys", icon: "🔑" },
    { href: "/admin/plans", label: "Plans", icon: "💳" },
    { href: "/admin/usage", label: "Usage", icon: "📊" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  ]

  return (
    <div className="flex h-screen bg-background">
      <aside className={`border-r border-border bg-card transition-all ${expanded ? "w-64" : "w-20"}`}>
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          {expanded && (
            <Link href="/admin" className="flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <span className="font-semibold">Zeo Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8"
          >
            {expanded ? "➖" : "➕"}
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {expanded && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/chat">Back to Chat</Link>
            </Button>
            <Button onClick={handleLogout} variant="destructive" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
