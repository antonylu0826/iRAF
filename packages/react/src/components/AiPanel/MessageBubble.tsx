import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { IAiMessageDTO } from "@iraf/core"
import { useAuth } from "../../context/AuthContext"
import { ToolCallCard } from "./ToolCallCard"
import { cn } from "../../lib/utils"

export function MessageBubble({ message }: { message: IAiMessageDTO }) {
  const isUser = message.role === "user"
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes("admins") ?? false

  return (
    <div className={cn("flex mb-3", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted",
      )}>
        {/* Message content — Markdown for assistant */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node: _n, ...props }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="text-xs border-collapse w-full" {...props} />
                  </div>
                ),
                th: ({ node: _n, ...props }) => (
                  <th className="border border-border px-2 py-1 bg-muted font-semibold text-left" {...props} />
                ),
                td: ({ node: _n, ...props }) => (
                  <td className="border border-border px-2 py-1" {...props} />
                ),
                code: ({ node: _n, className, children, ...props }) => {
                  const isBlock = className?.includes("language-")
                  return isBlock
                    ? <code className="block bg-muted/80 rounded p-2 text-[11px] font-mono overflow-x-auto whitespace-pre" {...props}>{children}</code>
                    : <code className="bg-muted/80 rounded px-1 text-[11px] font-mono" {...props}>{children}</code>
                },
                pre: ({ node: _n, ...props }) => <pre className="not-prose bg-transparent p-0 m-0" {...props} />,
                p: ({ node: _n, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool calls + usage — admin only */}
        {isAdmin && message.toolCalls && message.toolCalls.length > 0 && (
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

        {isAdmin && message.usage && (
          <div className="mt-1 text-[10px] text-muted-foreground/60">
            {message.usage.model} · {message.usage.inputTokens}↑ {message.usage.outputTokens}↓ · {(message.usage.durationMs / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  )
}
