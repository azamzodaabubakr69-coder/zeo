"use client"

import { useAuth } from "@/lib/auth"
import { useAdminModels } from "@/lib/hooks"
import { apiRequest } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader, Edit2, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/toaster"
import { useState } from "react"

export default function ModelsPage() {
  const { user } = useAuth()
  const { models, isLoading, mutate } = useAdminModels(Boolean(user?.is_admin))
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm("Delete this model?")) return
    setDeleting(id)
    try {
      await apiRequest(`/api/admin/models/${id}`, { method: "DELETE" })
      toast.success("Model deleted")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete model")
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleActive(id: number, isActive: boolean) {
    try {
      await apiRequest(`/api/admin/models/${id}`, {
        method: "PATCH",
        body: { is_active: !isActive },
      })
      toast.success(isActive ? "Model disabled" : "Model enabled")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update model")
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
        <h2 className="text-2xl font-bold">AI Models</h2>
        <Button>New Model</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Display Name</th>
                <th className="px-6 py-3 text-left font-semibold">Provider Model</th>
                <th className="px-6 py-3 text-left font-semibold">Input Price</th>
                <th className="px-6 py-3 text-left font-semibold">Output Price</th>
                <th className="px-6 py-3 text-left font-semibold">Active</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-semibold">{m.display_name}</td>
                  <td className="px-6 py-3 text-xs font-mono">{m.provider_model}</td>
                  <td className="px-6 py-3 text-xs">${m.price_input_per_mtok}/MTok</td>
                  <td className="px-6 py-3 text-xs">${m.price_output_per_mtok}/MTok</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleToggleActive(m.id, m.is_active)}
                      className="text-xs px-2 py-1 rounded hover:bg-accent"
                    >
                      {m.is_active ? "✓ Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
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
