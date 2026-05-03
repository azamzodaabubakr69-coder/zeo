"use client"

import { useAuth } from "@/lib/auth"
import { useAdminPlans } from "@/lib/hooks"
import { apiRequest } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader, Edit2, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/toaster"
import { useState } from "react"

export default function PlansPage() {
  const { user } = useAuth()
  const { plans, isLoading, mutate } = useAdminPlans(Boolean(user?.is_admin))
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm("Delete this plan?")) return
    setDeleting(id)
    try {
      await apiRequest(`/api/admin/plans/${id}`, { method: "DELETE" })
      toast.success("Plan deleted")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete plan")
    } finally {
      setDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <Button>New Plan</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Price</th>
                <th className="px-6 py-3 text-left font-semibold">Interval</th>
                <th className="px-6 py-3 text-left font-semibold">Credit</th>
                <th className="px-6 py-3 text-left font-semibold">Active</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-semibold">{p.name}</td>
                  <td className="px-6 py-3">${p.price_usd.toFixed(2)}</td>
                  <td className="px-6 py-3 text-xs capitalize">{p.interval}</td>
                  <td className="px-6 py-3">${p.monthly_credit_usd.toFixed(2)}</td>
                  <td className="px-6 py-3 text-xs">{p.is_active ? "✓" : "✗"}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
