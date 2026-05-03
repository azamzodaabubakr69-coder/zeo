"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { apiFetcher } from "./api"
import type { AiModel, ChatSummary, Plan, BillingSummary, AdminUser, UsageLog, ApiKeyRow, AdminStats } from "./types"

export function useModels(enabled = true) {
  const { data, error, isLoading } = useSWR<{ models: AiModel[] }>(
    enabled ? "/api/models" : null,
    apiFetcher,
  )
  return {
    models: data?.models ?? [],
    error,
    isLoading,
  }
}

export function useChats(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ chats: ChatSummary[] }>(
    enabled ? "/api/chats" : null,
    apiFetcher,
    { revalidateOnFocus: false },
  )
  return {
    chats: data?.chats ?? [],
    error,
    isLoading,
    mutate,
  }
}

export function refreshChats() {
  return globalMutate("/api/chats")
}

export function usePlans() {
  const { data, error, isLoading } = useSWR<{ plans: Plan[] }>("/api/plans", apiFetcher)
  return {
    plans: data?.plans ?? [],
    error,
    isLoading,
  }
}

export function useBilling(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<BillingSummary>(
    enabled ? "/api/billing/me" : null,
    apiFetcher,
  )
  return { billing: data, error, isLoading, mutate }
}

// Admin hooks
export function useAdminStats(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ stats: AdminStats }>(
    enabled ? "/api/admin/stats" : null,
    apiFetcher,
  )
  return { stats: data?.stats, error, isLoading, mutate }
}

export function useAdminUsers(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ users: AdminUser[] }>(
    enabled ? "/api/admin/users" : null,
    apiFetcher,
  )
  return { users: data?.users ?? [], error, isLoading, mutate }
}

export function useAdminModels(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ models: AiModel[] }>(
    enabled ? "/api/admin/models" : null,
    apiFetcher,
  )
  return { models: data?.models ?? [], error, isLoading, mutate }
}

export function useAdminApiKeys(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ api_keys: ApiKeyRow[] }>(
    enabled ? "/api/admin/api-keys" : null,
    apiFetcher,
  )
  return { apiKeys: data?.api_keys ?? [], error, isLoading, mutate }
}

export function useAdminPlans(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ plans: Plan[] }>(
    enabled ? "/api/admin/plans" : null,
    apiFetcher,
  )
  return { plans: data?.plans ?? [], error, isLoading, mutate }
}

export function useAdminUsageLogs(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ logs: UsageLog[] }>(
    enabled ? "/api/admin/usage-logs" : null,
    apiFetcher,
  )
  return { logs: data?.logs ?? [], error, isLoading, mutate }
}

export function useAdminSettings(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ settings: Array<{ setting_key: string; setting_value: string; is_secret: boolean }> }>(
    enabled ? "/api/admin/settings" : null,
    apiFetcher,
  )
  return { settings: data?.settings ?? [], error, isLoading, mutate }
}
