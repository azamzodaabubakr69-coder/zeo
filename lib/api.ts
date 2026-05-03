"use client"

const TOKEN_KEY = "zekron_token"

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "https://agent.zekron.codes"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token)
    } else {
      window.localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  signal?: AbortSignal
  auth?: boolean
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, auth = true } = options
  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      credentials: "omit",
      mode: "cors",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    throw new ApiError(`Cannot reach backend: ${message}`, 0, "network_error")
  }

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: { message: text } }
    }
  }

  if (!response.ok) {
    const errObj = (data as { error?: { code?: string; message?: string } } | null)?.error
    const message = errObj?.message ?? `Request failed (${response.status})`
    const code = errObj?.code ?? "request_failed"
    throw new ApiError(message, response.status, code)
  }

  return data as T
}

export const apiFetcher = <T>(path: string) => apiRequest<T>(path)
