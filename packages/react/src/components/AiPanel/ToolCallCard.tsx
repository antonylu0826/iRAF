import React, { useState } from "react"
import type { IAiToolCallInfo } from "@iraf/core"
import { cn } from "../../lib/utils"

export function ToolCallCard({
  toolCall,
  result,
  isError,
}: {
  toolCall: IAiToolCallInfo
  result?: string
  isError?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="my-1 border rounded text-xs bg-muted/30">
      <button
        className="w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-muted-foreground">{open ? "▾" : "▸"}</span>
        <span className="font-mono text-muted-foreground">🔧</span>
        <span className="font-semibold">{toolCall.name}</span>
        {result && (
          <span className={cn("ml-auto text-[10px]", isError ? "text-destructive" : "text-green-600")}>
            {isError ? "error" : "done"}
          </span>
        )}
      </button>
      {open && (
        <div className="px-2 pb-2 space-y-1">
          <div className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap break-all bg-muted/50 rounded p-1.5">
            {JSON.stringify(toolCall.input, null, 2)}
          </div>
          {result && (
            <div className={cn(
              "font-mono text-[10px] whitespace-pre-wrap break-all rounded p-1.5",
              isError ? "bg-destructive/10 text-destructive" : "bg-green-50 dark:bg-green-950/20 text-foreground",
            )}>
              {result.length > 500 ? result.slice(0, 500) + "…" : result}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
