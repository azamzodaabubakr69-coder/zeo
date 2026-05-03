"use client"

import { useState, type ReactNode } from "react"
import { ChatSidebar } from "@/components/chat/sidebar"
import { BillingDialog } from "@/components/chat/billing-dialog"
import { ChatLayoutProvider } from "@/components/chat/layout-context"

export default function ChatLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <ChatSidebar onUpgrade={() => setBillingOpen(true)} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="h-full">
            <ChatSidebar
              onCloseMobile={() => setMobileOpen(false)}
              onUpgrade={() => {
                setMobileOpen(false)
                setBillingOpen(true)
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-black/60 backdrop-blur-sm"
          />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 h-full overflow-hidden">
        <ChatLayoutProvider
          value={{
            openMobileSidebar: () => setMobileOpen(true),
            openBilling: () => setBillingOpen(true),
          }}
        >
          {children}
        </ChatLayoutProvider>
      </main>

      <BillingDialog open={billingOpen} onOpenChange={setBillingOpen} />
    </div>
  )
}
