"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useAdminUsers } from "@/lib/hooks"
import { apiRequest } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader, Edit2, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/toaster"

export default function UsersPage() {
  const { user } = useAuth()
  const { users, isLoading, mutate } = useAdminUsers(Boolean(user?.is_admin))
  const [editing, setEditing] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm("Delete this user?")) return
    setDeleting(id)
    try {
      await apiRequest(`/api/admin/users/${id}`, { method: "DELETE" })
      toast.success("User deleted")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user")
    } finally {
      setDeleting(null)
    }
  }

  async function handleMakeAdmin(id: number, isAdmin: boolean) {
    try {
      await apiRequest(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: { is_admin: !isAdmin },
      })
      toast.success(isAdmin ? "Removed admin rights" : "Added admin rights")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update user")
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
      <h2 className="text-2xl font-bold mb-6">Manage Users</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Admin</th>
                <th className="px-6 py-3 text-left font-semibold">Active</th>
                <th className="px-6 py-3 text-left font-semibold">Balance</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3">{u.email}</td>
                  <td className="px-6 py-3">{u.name || "—"}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleMakeAdmin(u.id, Boolean(u.is_admin))}
                      className="text-xs px-2 py-1 rounded hover:bg-accent"
                    >
                      {u.is_admin ? "✓ Yes" : "No"}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-xs">{u.is_active ? "✓" : "✗"}</td>
                  <td className="px-6 py-3 font-mono">${Number(u.balance_usd).toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(u.id)}
                        disabled={deleting === u.id}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
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
