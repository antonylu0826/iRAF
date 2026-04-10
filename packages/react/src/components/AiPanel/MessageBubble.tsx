import React from "react"
import type { IAiMessageDTO } from "@iraf/core"
import { ToolCallCard } from "./ToolCallCard"
import { cn } from "../../lib/utils"

export function MessageBubble({ message }: { message: IAiMessageDTO }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex mb-3", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted",
      )}>
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-1">
            {message.toolCalls.map((tc, i) => {
              const result = message.toolResults?.find(r => r.toolCallId === tc.id)
              return (
                <ToolCallCard
                  key={tc.id ?? i}
                  toolCall={tc}
                  result={result?.result}
                  isError={result?.isError}
                />
              )
            })}
          </div>
        )}

        {/* Usage info (small, muted) */}
        {message.usage && (
          <div className="mt-1 text-[10px] text-muted-foreground/60">
            {message.usage.model} · {message.usage.inputTokens}↑ {message.usage.outputTokens}↓ · {(message.usage.durationMs / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  )
}
