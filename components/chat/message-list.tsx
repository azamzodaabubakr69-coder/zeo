"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Markdown } from "./markdown"
import { LogoMark } from "@/components/brand"
import type { ChatMessage } from "@/lib/types"
import { useAuth } from "@/lib/auth"

type Props = {
  messages: ChatMessage[]
  pending?: boolean
}

export function MessageList({ messages, pending }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, pending])

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U"

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-8">
      {messages.map((m, i) => (
        <article key={m.id ?? i} className="flex gap-3 md:gap-4">
          <div className="shrink-0">
            {m.role === "assistant" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground">
                <LogoMark className="h-5 w-5" />
              </div>
            ) : (
              <Avatar className="h-8 w-8">
                {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt="" /> : null}
                <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">
              {m.role === "assistant" ? "Zeo" : "You"}
            </div>
            {m.role === "assistant" ? (
              <Markdown>{m.content}</Markdown>
            ) : (
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{m.content}</div>
            )}
          </div>
        </article>
      ))}
      {pending && (
        <article className="flex gap-3 md:gap-4">
          <div className="shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground">
              <LogoMark className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 pt-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" />
            </div>
          </div>
        </article>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
