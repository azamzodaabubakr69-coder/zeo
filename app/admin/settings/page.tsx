"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useAdminSettings } from "@/lib/hooks"
import { apiRequest } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader } from "lucide-react"
import { toast } from "@/components/ui/toaster"

export default function SettingsPage() {
  const { user } = useAuth()
  const { settings, isLoading, mutate } = useAdminSettings(Boolean(user?.is_admin))
  const [saving, setSaving] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  const handleChange = (key: string, value: string) => {
    setValues({ ...values, [key]: value })
  }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await apiRequest("/api/admin/settings", {
        method: "POST",
        body: {
          key,
          value: values[key] || "",
          is_secret: settings.find((s) => s.setting_key === key)?.is_secret ?? false,
        },
      })
      toast.success("Setting saved")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save setting")
    } finally {
      setSaving(null)
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
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>

      <div className="space-y-4 max-w-2xl">
        {settings.map((setting) => (
          <Card key={setting.setting_key} className="p-4">
            <label className="block text-sm font-semibold mb-2">
              {setting.setting_key.replace(/_/g, " ")}
              {setting.is_secret && <span className="text-destructive ml-1">*Secret</span>}
            </label>
            <div className="flex gap-2">
              <Input
                type={setting.is_secret ? "password" : "text"}
                defaultValue={values[setting.setting_key] ?? setting.setting_value ?? ""}
                onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => handleSave(setting.setting_key)}
                disabled={saving === setting.setting_key}
                className="px-6"
              >
                {saving === setting.setting_key ? "Saving..." : "Save"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
