import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Zeo — AI agent for building web apps",
    template: "%s · Zeo",
  },
  description: "Zeo is an AI agent built by ZekronAI that helps you design, plan, and ship modern web applications.",
  applicationName: "Zeo",
  authors: [{ name: "ZekronAI" }],
  icons: {
    icon: "/favicon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground antialiased">
        <AuthProvider>
          <TooltipProvider delayDuration={150}>
            {children}
          </TooltipProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
