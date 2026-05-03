"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="dark"
      richColors
      toastOptions={{
        classNames: {
          toast: "border-border",
        },
      }}
    />
  )
}

export { toast } from "sonner"
