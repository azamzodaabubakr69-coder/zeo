"use client"

import { useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { usePlans, useBilling } from "@/lib/hooks"
import { apiRequest } from "@/lib/api"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingDialog({ open, onOpenChange }: Props) {
  const { user, refresh } = useAuth()
  const { plans } = usePlans()
  const { billing, mutate } = useBilling(Boolean(user))
  const [submittingId, setSubmittingId] = useState<number | null>(null)

  async function subscribe(planId: number) {
    setSubmittingId(planId)
    try {
      await apiRequest("/api/plans/subscribe", { method: "POST", body: { plan_id: planId } })
      toast.success("Subscribed!")
      await Promise.all([mutate(), refresh()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not subscribe")
    } finally {
      setSubmittingId(null)
    }
  }

  async function cancel() {
    try {
      await apiRequest("/api/plans/cancel", { method: "POST" })
      toast.success("Subscription canceled")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel")
    }
  }

  const activeSlug = billing?.subscription?.slug

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Plans &amp; billing</DialogTitle>
          <DialogDescription>
            Pick a plan that fits how much you ship. Pricing is configured by your workspace admin.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="plans" className="mt-2">
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-4">
            <div className="grid gap-3 md:grid-cols-3">
              {plans.length === 0 && (
                <div className="md:col-span-3 text-sm text-muted-foreground py-10 text-center">
                  No plans configured yet.
                </div>
              )}
              {plans.map((p) => {
                const active = activeSlug === p.slug
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-xl border p-5 flex flex-col gap-3 bg-background",
                      p.is_featured ? "border-primary/60 ring-1 ring-primary/30" : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          {p.name}
                          {p.is_featured && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">
                              Popular
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                        )}
                      </div>
                      {active && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-semibold tracking-tight">${p.price_usd.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">
                          / {p.interval === "year" ? "year" : p.interval === "one_time" ? "once" : "month"}
                        </span>
                      </div>
                      {p.monthly_message_cap > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Up to {p.monthly_message_cap.toLocaleString()} messages
                        </div>
                      )}
                    </div>

                    <ul className="space-y-1.5 text-sm flex-1">
                      {p.features?.map((f, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground/80">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {active ? (
                      <Button variant="outline" onClick={cancel} className="w-full">
                        Cancel plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => subscribe(p.id)}
                        disabled={submittingId === p.id}
                        className="w-full"
                        variant={p.is_featured ? "default" : "outline"}
                      >
                        <Sparkles className="h-4 w-4" />
                        {submittingId === p.id ? "Subscribing…" : `Choose ${p.name}`}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Balance</div>
                <div className="text-2xl font-semibold mt-1">
                  ${(billing?.balance_usd ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Spent</div>
                <div className="text-2xl font-semibold mt-1">
                  ${Number(billing?.totals?.spent ?? 0).toFixed(4)}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Tokens</div>
                <div className="text-2xl font-semibold mt-1">
                  {Number(billing?.totals?.in_tok ?? 0).toLocaleString()} /{" "}
                  {Number(billing?.totals?.out_tok ?? 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <div className="px-4 py-3 border-b border-border text-sm font-semibold">Recent usage</div>
              <div className="divide-y divide-border">
                {(billing?.recent ?? []).length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No usage yet.</div>
                ) : (
                  billing!.recent.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.model_display_name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {r.input_tokens.toLocaleString()} / {r.output_tokens.toLocaleString()} tok
                        </span>
                        <span className="font-mono text-foreground/80 w-16 text-right">
                          ${Number(r.cost_usd).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
