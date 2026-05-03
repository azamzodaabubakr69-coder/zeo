import { cn } from "@/lib/utils"

type SvgProps = React.SVGProps<SVGSVGElement> & { title?: string }

/**
 * Zeo wordmark / logo. The Z is rendered as a stylised arrow path so the mark
 * works at small sizes (16px) and as a favicon.
 */
export function LogoMark({ className, title = "Zeo", ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={cn(className)}
      {...props}
    >
      <title>{title}</title>
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.08" />
      <path
        d="M9 9.5h13.5L11.6 22.5H22.8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.6" cy="22.5" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function ZeoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <LogoMark className="h-6 w-6" />
      <span className="font-semibold tracking-tight text-base">Zeo</span>
    </span>
  )
}

/**
 * Anthropic Claude wordmark. Used as fallback for the model "Made by" hover
 * when admin doesn't upload a custom SVG.
 */
export function ClaudeMark({ className, title = "Claude", ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={cn(className)}
      {...props}
    >
      <title>{title}</title>
      <path
        d="M6.6 22.5 12.8 9h2.4l4.4 9.9h-2.5l-1-2.5h-4.6l-1 2.5H6.6Zm6.7-5.1h3l-1.5-3.7-1.5 3.7Z"
        fill="#D97757"
      />
      <path d="M18.7 22.5 24.9 9h2.4l-6.2 13.5h-2.4Z" fill="#D97757" />
    </svg>
  )
}

export function GoogleMark({ className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Google"
      className={cn(className)}
      {...props}
    >
      <title>Google</title>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.708V4.96H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.04l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.346l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

/**
 * Default AI model logo, used when an admin hasn't uploaded a custom SVG.
 */
export function DefaultAiMark({ className, title = "AI", ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={cn(className)}
      {...props}
    >
      <title>{title}</title>
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.1" />
      <path
        d="M16 8.5a7.5 7.5 0 0 0-7.5 7.5v6a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-6A7.5 7.5 0 0 0 16 8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12.7" cy="15.8" r="1.3" fill="currentColor" />
      <circle cx="19.3" cy="15.8" r="1.3" fill="currentColor" />
      <path
        d="M12.5 19.4c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M16 6.5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="5.4" r="1.1" fill="currentColor" />
    </svg>
  )
}

/**
 * Renders an admin-uploaded SVG (sanitisation should be done server-side in
 * production). Falls back to DefaultAiMark when the SVG is empty.
 */
export function ModelLogo({
  svg,
  className,
  alt = "AI model",
}: {
  svg: string | null | undefined
  className?: string
  alt?: string
}) {
  if (svg && svg.trim().length > 0) {
    return (
      <span
        className={cn("inline-flex items-center justify-center [&_svg]:h-full [&_svg]:w-full", className)}
        role="img"
        aria-label={alt}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-controlled SVG
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }
  return <DefaultAiMark className={className} title={alt} />
}

/**
 * Renders the "Made by" logo for the model hover. If the admin uploaded a
 * custom SVG it's used; otherwise we map common labels to a known mark.
 */
export function MadeByLogo({
  label,
  svg,
  className,
}: {
  label: string | null | undefined
  svg: string | null | undefined
  className?: string
}) {
  if (svg && svg.trim().length > 0) {
    return (
      <span
        className={cn("inline-flex items-center justify-center [&_svg]:h-full [&_svg]:w-full", className)}
        role="img"
        aria-label={label ?? "Made by"}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-controlled SVG
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }
  const normalized = (label ?? "").toLowerCase()
  if (normalized.includes("claude") || normalized.includes("anthropic")) {
    return <ClaudeMark className={className} />
  }
  return <DefaultAiMark className={className} title={label ?? "AI"} />
}
