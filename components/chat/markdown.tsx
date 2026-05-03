"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const text = String(children).replace(/\n$/, "")
            const isInline = !className || !text.includes("\n")
            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
            const lang = (className ?? "").replace(/^language-/, "")
            return <CodeBlock code={text} lang={lang} />
          },
          pre({ children }) {
            return <>{children}</>
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="relative my-4 rounded-lg border border-border bg-secondary text-secondary-foreground overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-secondary/60">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors",
          )}
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-[13px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  )
}
