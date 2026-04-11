import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { IAiMessageDTO } from "@iraf/core"
import { useAuth } from "../../context/AuthContext"
import { ToolCallCard } from "./ToolCallCard"
import { cn } from "../../lib/utils"
import { Copy, Check } from "lucide-react"

// ─── CodeBlock ────────────────────────────────────────────────────────────────

function CodeBlock({ language, children }: { language?: string; children: string }) {
  const [copied, setCopied] = useState(false)

  // Auto-format JSON
  let content = children
  if (language === "json" || (!language && children.trimStart().startsWith("{"))) {
    try {
      content = JSON.stringify(JSON.parse(children), null, 2)
    } catch {
      // leave as-is
    }
  }

  function copy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="my-2 rounded-lg border border-border overflow-hidden text-[11px] font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-muted/60 border-b border-border">
        <span className="text-[10px] text-muted-foreground">{language ?? "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied
            ? <><Check className="h-3 w-3" /> 已複製</>
            : <><Copy className="h-3 w-3" /> 複製</>
          }
        </button>
      </div>
      {/* Code content */}
      <pre className="overflow-x-auto p-3 m-0 bg-muted/30 leading-relaxed">
        {language === "json" || (!language && content.trimStart().startsWith("{"))
          ? <JsonHighlight code={content} />
          : content
        }
      </pre>
    </div>
  )
}

// ─── JsonHighlight ────────────────────────────────────────────────────────────
// Minimal JSON syntax highlighting without any library.

function JsonHighlight({ code }: { code: string }) {
  // Tokenise line by line using a simple regex
  const tokens = code.split(
    /(\"(?:[^\"\\]|\\.)*\"\s*:)|(\"(?:[^\"\\]|\\.)*\")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
  )

  return (
    <>
      {tokens.map((tok, i) => {
        if (!tok) return null
        // key  (string followed by colon)
        if (/^\".*\"\s*:$/.test(tok))
          return <span key={i} className="text-blue-400 dark:text-blue-300">{tok}</span>
        // string value
        if (/^\".*\"$/.test(tok))
          return <span key={i} className="text-green-500 dark:text-green-400">{tok}</span>
        // boolean / null
        if (tok === "true" || tok === "false" || tok === "null")
          return <span key={i} className="text-orange-400 dark:text-orange-300">{tok}</span>
        // number
        if (/^-?\d/.test(tok))
          return <span key={i} className="text-purple-400 dark:text-purple-300">{tok}</span>
        return tok
      })}
    </>
  )
}

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
                  const language = className?.replace("language-", "")
                  const content = String(children).replace(/\n$/, "")
                  // Block code (fenced) — hand off to CodeBlock
                  if (className?.startsWith("language-") || content.includes("\n")) {
                    return <CodeBlock language={language} children={content} />
                  }
                  // Inline code
                  return <code className="bg-muted/80 rounded px-1 text-[11px] font-mono" {...props}>{children}</code>
                },
                pre: ({ node: _n, children }) => <>{children}</>,
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
