"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, MessageSquare, Plus, Shield, Sparkles, Trash2, User as UserIcon, X } from "lucide-react"
import { LogoMark } from "@/components/brand"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { useChats } from "@/lib/hooks"
import { apiRequest } from "@/lib/api"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

type Props = {
  onCloseMobile?: () => void
  onUpgrade?: () => void
}

export function ChatSidebar({ onCloseMobile, onUpgrade }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { chats, mutate, isLoading } = useChats(Boolean(user))
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(uuid: string) {
    if (!confirm("Delete this chat? This cannot be undone.")) return
    setDeletingId(uuid)
    try {
      await apiRequest(`/api/chats/${uuid}`, { method: "DELETE" })
      await mutate()
      if (pathname === `/chat/z/${uuid}`) {
        router.replace("/chat")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete chat")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center justify-between gap-2 px-4 border-b border-border">
        <Link href="/chat" className="flex items-center gap-2 text-foreground">
          <LogoMark className="h-7 w-7" />
          <div className="flex flex-col leading-none">
            <span className="font-semibold tracking-tight">Zeo</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">by ZekronAI</span>
          </div>
        </Link>
        {onCloseMobile && (
          <Button variant="ghost" size="icon" onClick={onCloseMobile} className="md:hidden h-8 w-8" aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="px-3 pt-3 pb-2">
        <Button asChild className="w-full justify-start gap-2 h-10" variant="default">
          <Link href="/chat">
            <Plus className="h-4 w-4" />
            New chat
          </Link>
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {!user ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">
            <p className="mb-3 leading-relaxed">Sign in to view your chat history.</p>
            <div className="flex flex-col gap-2">
              <Button asChild size="sm" className="w-full">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="px-3 py-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 rounded-md bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">
            <MessageSquare className="h-5 w-5 mb-2 opacity-60" />
            <p>No chats yet. Start a new conversation to begin.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5 px-1 py-1">
            {chats.map((c) => {
              const active = pathname === `/chat/z/${c.uuid}`
              return (
                <li key={c.uuid} className="group relative">
                  <Link
                    href={`/chat/z/${c.uuid}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground",
                      active && "bg-accent text-foreground",
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="truncate flex-1">{c.title || "New chat"}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(c.uuid)
                    }}
                    disabled={deletingId === c.uuid}
                    aria-label="Delete chat"
                    className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-background disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {user && (
        <div className="border-t border-border p-3 space-y-2">
          <button
            type="button"
            onClick={onUpgrade}
            className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Upgrade plan</div>
              <div className="text-xs text-muted-foreground truncate">More messages and features</div>
            </div>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
              >
                <Avatar className="h-8 w-8">
                  {user.avatar_url ? <AvatarImage src={user.avatar_url} alt="" /> : null}
                  <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name || user.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={onUpgrade}>
                <Sparkles className="h-4 w-4" />
                Plans &amp; billing
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/chat">
                  <UserIcon className="h-4 w-4" />
                  My chats
                </Link>
              </DropdownMenuItem>
              {Number(user.is_admin) === 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      Admin panel
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  )
}

