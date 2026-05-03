"use client"

import { createContext, useContext, type ReactNode } from "react"

type ChatLayoutValue = {
  openMobileSidebar: () => void
  openBilling: () => void
}

const ChatLayoutContext = createContext<ChatLayoutValue>({
  openMobileSidebar: () => {},
  openBilling: () => {},
})

export function ChatLayoutProvider({
  value,
  children,
}: {
  value: ChatLayoutValue
  children: ReactNode
}) {
  return <ChatLayoutContext.Provider value={value}>{children}</ChatLayoutContext.Provider>
}

export function useChatLayout(): ChatLayoutValue {
  return useContext(ChatLayoutContext)
}
