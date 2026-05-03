export type AiModel = {
  id: number
  slug: string
  display_name: string
  description: string | null
  made_by_label: string
  made_by_logo_svg: string | null
  logo_svg: string | null
  price_input_per_mtok: number
  price_output_per_mtok: number
  max_output_tokens: number
  context_window: number
  supports_thinking: boolean
  supports_vision: boolean
  is_default: boolean
  is_active: boolean
  sort_order: number
  // Admin-only extras (when fetched from /api/admin/models)
  provider?: string
  provider_model?: string
  system_prompt?: string | null
}

export type ChatSummary = {
  id: string
  uuid: string
  title: string
  model_id: number | null
  model_display_name: string | null
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id?: number | string
  role: "user" | "assistant" | "system"
  content: string
  created_at?: string
  input_tokens?: number
  output_tokens?: number
  cost_usd?: number
}

export type Plan = {
  id: number
  slug: string
  name: string
  description: string | null
  price_usd: number
  interval: "month" | "year" | "one_time"
  monthly_credit_usd: number
  monthly_message_cap: number
  features: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
}

export type ApiKeyRow = {
  id: number
  provider: string
  label: string
  key_last4: string
  is_active: number | boolean
  priority: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export type AdminUser = {
  id: number
  email: string
  name: string | null
  avatar_url: string | null
  is_admin: number | boolean
  is_active: number | boolean
  balance_usd: string | number
  last_login_at: string | null
  created_at: string
}

export type UsageLog = {
  id: number
  user_id: number
  model_id: number | null
  chat_id: number | null
  provider: string
  provider_model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  latency_ms: number
  status: "success" | "error"
  error_message: string | null
  created_at: string
  model_display_name?: string | null
  user_email?: string
}

export type BillingSummary = {
  balance_usd: number
  totals: {
    spent: number
    in_tok: number
    out_tok: number
  }
  recent: UsageLog[]
  subscription: {
    id: number
    status: string
    started_at: string
    current_period_end: string | null
    slug: string
    name: string
    price_usd: number
    interval: string
  } | null
}

export type AdminStats = {
  users_total: number
  admins_total: number
  active_models: number
  chats_total: number
  messages_total: number
  revenue_usd: number
  input_tokens_total: number
  output_tokens_total: number
}

export type Setting = {
  setting_key: string
  setting_value: string | null
  is_secret: number | boolean
}

export type AdminStats = {
  users_total: number
  admins_total: number
  active_models: number
  chats_total: number
  messages_total: number
  revenue_usd: number | string
  input_tokens_total: number | string
  output_tokens_total: number | string
}

export type BillingSummary = {
  balance_usd: number
  totals: { spent: number | string; in_tok: number | string; out_tok: number | string }
  recent: Array<{
    id: number
    input_tokens: number
    output_tokens: number
    cost_usd: number
    latency_ms: number
    status: "success" | "error"
    created_at: string
    model_display_name: string | null
  }>
  subscription: null | {
    id: number
    status: string
    started_at: string
    current_period_end: string | null
    slug: string
    name: string
    price_usd: number | string
    interval: string
  }
}
