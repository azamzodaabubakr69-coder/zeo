"use client"

import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { useAdminStats } from "@/lib/hooks"
import { Loader } from "lucide-react"

export default function AdminPage() {
  const { user } = useAuth()
  const { stats, isLoading } = useAdminStats(Boolean(user?.is_admin))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground py-12">Failed to load stats</div>
  }

  const metrics = [
    { label: "Total Users", value: stats.users_total, color: "bg-blue-500/20 text-blue-600" },
    { label: "Admins", value: stats.admins_total, color: "bg-purple-500/20 text-purple-600" },
    { label: "Active Models", value: stats.active_models, color: "bg-green-500/20 text-green-600" },
    { label: "Total Chats", value: stats.chats_total, color: "bg-yellow-500/20 text-yellow-600" },
    { label: "Messages", value: stats.messages_total, color: "bg-orange-500/20 text-orange-600" },
    {
      label: "Revenue (USD)",
      value: `$${stats.revenue_usd.toFixed(2)}`,
      color: "bg-emerald-500/20 text-emerald-600",
    },
    {
      label: "Input Tokens",
      value: `${(stats.input_tokens_total / 1e6).toFixed(1)}M`,
      color: "bg-pink-500/20 text-pink-600",
    },
    {
      label: "Output Tokens",
      value: `${(stats.output_tokens_total / 1e6).toFixed(1)}M`,
      color: "bg-indigo-500/20 text-indigo-600",
    },
  ]

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Welcome to Zeo Admin, {user?.name || user?.email}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-6">
            <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
            <p className={`text-3xl font-bold ${metric.color} rounded-md px-2 py-1 inline-block`}>
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ Manage users and admin roles</li>
          <li>✓ Add and configure AI models</li>
          <li>✓ Manage API keys for providers</li>
          <li>✓ Set subscription plans and pricing</li>
          <li>✓ Monitor usage and billing</li>
          <li>✓ Update system settings</li>
        </ul>
      </Card>
    </div>
  )
}
