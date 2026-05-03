"use client"

import { useAuth } from "@/lib/auth"
import { useAdminApiKeys } from "@/lib/hooks"
import { apiRequest } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/toaster"
import { useState } from "react"

export default function ApiKeysPage() {
  const { user } = useAuth()
  const { apiKeys, isLoading, mutate } = useAdminApiKeys(Boolean(user?.is_admin))
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm("Delete this API key?")) return
    setDeleting(id)
    try {
      await apiRequest(`/api/admin/api-keys/${id}`, { method: "DELETE" })
      toast.success("API key deleted")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete key")
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
        <h2 className="text-2xl font-bold">API Keys</h2>
        <Button>Add Key</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Label</th>
                <th className="px-6 py-3 text-left font-semibold">Provider</th>
                <th className="px-6 py-3 text-left font-semibold">Last 4</th>
                <th className="px-6 py-3 text-left font-semibold">Active</th>
                <th className="px-6 py-3 text-left font-semibold">Last Used</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k) => (
                <tr key={k.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-semibold">{k.label}</td>
                  <td className="px-6 py-3">{k.provider}</td>
                  <td className="px-6 py-3 font-mono text-xs">****{k.key_last4}</td>
                  <td className="px-6 py-3 text-xs">{k.is_active ? "✓" : "✗"}</td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(k.id)}
                      disabled={deleting === k.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
