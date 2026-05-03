"use client"

import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/brand"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingMessage?: string
}

export function AuthPromptDialog({ open, onOpenChange, pendingMessage }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary mb-2">
            <LogoMark className="h-7 w-7" />
          </div>
          <DialogTitle>Sign in to chat with Zeo</DialogTitle>
          <DialogDescription>
            Create a free account or sign in to send messages, save chats, and pick up where you left off.
          </DialogDescription>
        </DialogHeader>

        {pendingMessage && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              Your message is saved
            </div>
            <p className="text-sm line-clamp-3 leading-relaxed">{pendingMessage}</p>
            <p className="text-xs text-muted-foreground mt-2">
              We&apos;ll send it as soon as you sign in.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button asChild className="h-11 w-full">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href="/register">Create free account</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
