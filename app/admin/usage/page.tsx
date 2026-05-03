"use client"

import { useAuth } from "@/lib/auth"
import { useAdminUsageLogs } from "@/lib/hooks"
import { Card } from "@/components/ui/card"
import { Loader } from "lucide-react"

export default function UsagePage() {
  const { user } = useAuth()
  const { logs, isLoading } = useAdminUsageLogs(Boolean(user?.is_admin))

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Usage Logs</h2>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">User</th>
                <th className="px-6 py-3 text-left font-semibold">Model</th>
                <th className="px-6 py-3 text-left font-semibold">Input</th>
                <th className="px-6 py-3 text-left font-semibold">Output</th>
                <th className="px-6 py-3 text-left font-semibold">Cost</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 100).map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 text-xs">{log.user_email}</td>
                  <td className="px-6 py-3 text-xs">{log.model_display_name || log.provider_model}</td>
                  <td className="px-6 py-3 text-xs">{log.input_tokens}</td>
                  <td className="px-6 py-3 text-xs">{log.output_tokens}</td>
                  <td className="px-6 py-3 font-mono text-xs">${log.cost_usd.toFixed(6)}</td>
                  <td className="px-6 py-3 text-xs">
                    <span className={log.status === "success" ? "text-green-600" : "text-red-600"}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">Showing latest 100 logs</p>
    </div>
  )
}
