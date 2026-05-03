"use client"

import { useEffect } from "react"
import { Check, ChevronDown, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ModelLogo, MadeByLogo } from "@/components/brand"
import { cn } from "@/lib/utils"
import type { AiModel } from "@/lib/types"

type Props = {
  models: AiModel[]
  selectedId: number | null
  onSelect: (model: AiModel) => void
  disabled?: boolean
}

export function ModelSelector({ models, selectedId, onSelect, disabled }: Props) {
  const selected = models.find((m) => m.id === selectedId) ?? models.find((m) => m.is_default) ?? models[0]

  // Auto-select default when none picked yet
  useEffect(() => {
    if (!selectedId && selected) {
      onSelect(selected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.id])

  if (!selected) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 h-9">
        <Lock className="h-3.5 w-3.5" />
        No models
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-2 h-9 pr-2 pl-2.5 font-medium"
            >
              <ModelLogo svg={selected.logo_svg} alt={selected.display_name} className="h-4 w-4 text-foreground" />
              <span className="truncate max-w-[160px]">{selected.display_name}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="px-3 py-2">
          <div className="flex items-center gap-2">
            <MadeByLogo
              label={selected.made_by_label}
              svg={selected.made_by_logo_svg}
              className="h-4 w-4"
            />
            <span className="text-xs">
              Made by <span className="font-semibold">{selected.made_by_label}</span>
            </span>
          </div>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" className="w-72 p-1.5">
        {models.map((m) => {
          const active = m.id === selected.id
          return (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onSelect={() => onSelect(m)}
                  className={cn(
                    "items-start gap-3 rounded-md px-2.5 py-2.5 cursor-pointer",
                    active && "bg-accent",
                  )}
                >
                  <ModelLogo svg={m.logo_svg} alt={m.display_name} className="h-7 w-7 mt-0.5 text-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{m.display_name}</span>
                      {m.is_default && (
                        <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {m.description}
                      </p>
                    )}
                  </div>
                  {active && <Check className="h-4 w-4 text-primary mt-1 shrink-0" />}
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <MadeByLogo
                    label={m.made_by_label}
                    svg={m.made_by_logo_svg}
                    className="h-4 w-4"
                  />
                  <span className="text-xs">
                    Made by <span className="font-semibold">{m.made_by_label}</span>
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
