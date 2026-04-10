import React, { useEffect, useRef, useState } from "react"
import { X, Plus, Send, History, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { MessageBubble } from "./MessageBubble"
import { ActionConfirmCard } from "./ActionConfirmCard"
import { useAiChat } from "./useAiChat"
import { useAiPanel } from "./AiContext"

export function AiPanel() {
  const { open, toggle } = useAiPanel()
  const {
    messages,
    streaming,
    pendingAction,
    conversations,
    send,
    confirmAction,
    loadConversation,
    loadConversations,
    newConversation,
  } = useAiChat()

  const [input, setInput] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pendingAction])

  // Load conversations list when history panel opens
  useEffect(() => {
    if (showHistory) loadConversations()
  }, [showHistory, loadConversations])

  if (!open) return null

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || streaming) return
    setInput("")
    send(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-[380px] shrink-0 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="h-14 shrink-0 border-b flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">AI 助手</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => setShowHistory(v => !v)} title="歷史對話">
            <History className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={newConversation} title="新對話">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={toggle} title="關閉">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* History sidebar */}
      {showHistory && (
        <div className="border-b max-h-48 overflow-y-auto">
          <div className="p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">尚無對話紀錄</p>
            )}
            {conversations.map(conv => (
              <button
                key={conv.id}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted transition-colors truncate"
                onClick={() => {
                  loadConversation(conv.id)
                  setShowHistory(false)
                }}
              >
                {conv.title || "Untitled"}
              </button>
            ))}
          </div>
          <Separator />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <span className="text-2xl">💬</span>
            <span>有什麼可以幫你的嗎？</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id ?? i} message={msg} />
        ))}

        {/* Pending action confirmation */}
        {pendingAction && (
          <ActionConfirmCard action={pendingAction} onConfirm={confirmAction} />
        )}

        {/* Streaming indicator */}
        {streaming && !pendingAction && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>思考中...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t p-3">
        <div className="flex gap-2">
          <textarea
            className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            rows={1}
            placeholder="輸入訊息..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || streaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
