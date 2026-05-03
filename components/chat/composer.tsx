"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { ArrowUp, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  onSubmit: (text: string) => void | Promise<void>
  pending?: boolean
  onAbort?: () => void
  placeholder?: string
  disabled?: boolean
  /** When true, the composer captures the current text and forwards it through onSubmit even if user is unauthenticated. */
  autoFocus?: boolean
}

export function Composer({ onSubmit, pending, onAbort, placeholder, disabled, autoFocus }: Props) {
  const [text, setText] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  // Auto-resize
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 240) + "px"
  }, [text])

  function send() {
    const value = text.trim()
    if (!value || pending || disabled) return
    onSubmit(value)
    setText("")
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-border bg-card shadow-sm transition-colors",
          "focus-within:border-foreground/30",
        )}
      >
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={placeholder ?? "Ask Zeo to build something…"}
          disabled={disabled}
          className={cn(
            "flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground scrollbar-thin",
            "max-h-60",
          )}
        />
        <div className="flex items-center pr-2 pb-2">
          {pending ? (
            <Button
              type="button"
              size="icon"
              variant="default"
              onClick={onAbort}
              className="h-9 w-9 rounded-full"
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!text.trim() || disabled}
              className="h-9 w-9 rounded-full"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Zeo can make mistakes. Verify important information before shipping it.
      </p>
    </form>
  )
}
