import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUSD(value: number | string | null | undefined, digits = 4): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value ?? 0)
  if (!Number.isFinite(n)) return "$0.00"
  return `$${n.toFixed(digits)}`
}

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value ?? 0)
  if (!Number.isFinite(n)) return "0"
  return n.toLocaleString()
}
