"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import Link from "next/link"
import { Menu, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/brand"
import { ModelSelector } from "./model-selector"
import { MessageList } from "./message-list"
import { Composer } from "./composer"
import { AuthPromptDialog } from "./auth-prompt-dialog"
import { BillingDialog } from "./billing-dialog"
import { useAuth } from "@/lib/auth"
import { useModels, refreshChats } from "@/lib/hooks"
import { ApiError, apiFetcher, apiRequest } from "@/lib/api"
import { toast } from "@/components/ui/toaster"
import { useChatLayout } from "./layout-context"
import type { AiModel, ChatMessage } from "@/lib/types"

type Props = {
  /** When provided, loads existing messages from the backend. */
  uuid?: string
}

type ChatResponse = {
  chat: { id: string; title: string }
  messages: ChatMessage[]
}

export function ChatView({ uuid, onMenuClick }: Props) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { models } = useModels(Boolean(user))
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)

  // Load existing chat if uuid provided
  const { data: chatData, isLoading: chatLoading } = useSWR<ChatResponse>(
    uuid && user ? `/api/chats/${uuid}` : null,
    apiFetcher,
    { revalidateOnFocus: false },
  )

  useEffect(() => {
    if (chatData?.messages) {
      setMessages(chatData.messages)
    }
  }, [chatData])

  // Reset state when navigating to /chat (no uuid)
  useEffect(() => {
    if (!uuid) {
      setMessages([])
    }
  }, [uuid])

  // Replay pending guest message after sign-in
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const stashed = window.sessionStorage.getItem("zeo_pending_message")
      if (stashed) {
        window.sessionStorage.removeItem("zeo_pending_message")
        // Send it after a tick so models load
        setTimeout(() => sendMessage(stashed), 250)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("zeo_pending_message", text)
        }
        setPendingMessage(text)
        setAuthOpen(true)
        return
      }

      const userMsg: ChatMessage = { role: "user", content: text }
      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setPending(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await apiRequest<{
          chat_id: string
          message: ChatMessage
        }>("/api/chat", {
          method: "POST",
          body: {
            chat_id: uuid ?? null,
            model_id: selectedModel?.id ?? null,
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
          },
          signal: controller.signal,
        })

        setMessages((prev) => [...prev, res.message])

        // Refresh sidebar chat list
        await refreshChats()

        // If this was a new chat, route to its UUID
        if (!uuid) {
          router.replace(`/chat/z/${res.chat_id}`)
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        if (e instanceof ApiError && e.status === 402) {
          toast.error(e.message, { description: "Upgrade your plan to continue." })
          setBillingOpen(true)
        } else {
          toast.error(e instanceof Error ? e.message : "Failed to send")
        }
        // Remove the optimistic user message on error
        setMessages((prev) => prev.filter((m) => m !== userMsg))
      } finally {
        setPending(false)
        abortRef.current = null
      }
    },
    [user, messages, selectedModel, uuid, router],
  )

  function abort() {
    abortRef.current?.abort()
    setPending(false)
  }

  const showWelcome = messages.length === 0 && !chatLoading

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 md:px-4">
        <div className="flex items-center gap-2">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden h-9 w-9" aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <ModelSelector
            models={models}
            selectedId={selectedModel?.id ?? null}
            onSelect={setSelectedModel}
            disabled={pending || authLoading}
          />
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="outline" size="sm" onClick={() => setBillingOpen(true)} className="gap-2 h-9">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Upgrade</span>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-9">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="h-9">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {showWelcome ? (
          <Welcome modelName={selectedModel?.display_name ?? "Zeo"} />
        ) : (
          <MessageList messages={messages} pending={pending} />
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-background">
        <Composer
          onSubmit={sendMessage}
          pending={pending}
          onAbort={abort}
          autoFocus
          placeholder={user ? "Ask Zeo to build something…" : "Try a message — we'll ask you to sign in to send it"}
        />
      </div>

      <AuthPromptDialog open={authOpen} onOpenChange={setAuthOpen} pendingMessage={pendingMessage} />
      <BillingDialog open={billingOpen} onOpenChange={setBillingOpen} />
    </div>
  )
}

function Welcome({ modelName }: { modelName: string }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-foreground mb-5">
        <LogoMark className="h-9 w-9" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        What are we building today?
      </h1>
      <p className="mt-3 text-muted-foreground text-pretty max-w-xl leading-relaxed">
        I&apos;m Zeo — an AI agent built by ZekronAI for shipping production-quality web applications.
        Describe what you want and we&apos;ll get going.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
        {SUGGESTIONS.map((s) => (
          <SuggestionCard key={s.title} title={s.title} subtitle={s.subtitle} />
        ))}
      </div>

      <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Connected to <span className="font-medium text-foreground/80">{modelName}</span>
      </div>
    </div>
  )
}

const SUGGESTIONS: { title: string; subtitle: string }[] = [
  { title: "Build a landing page", subtitle: "for an AI productivity SaaS" },
  { title: "Set up Next.js auth", subtitle: "with email + Google OAuth" },
  { title: "Design a pricing section", subtitle: "with 3 tiers and feature list" },
  { title: "Add a dashboard chart", subtitle: "for weekly active users" },
]

function SuggestionCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-left">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
    </div>
  )
}
