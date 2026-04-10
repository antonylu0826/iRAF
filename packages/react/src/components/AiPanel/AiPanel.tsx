import React, { useEffect, useRef, useState, useCallback } from "react"
import { X, Plus, Send, History, Loader2, Archive, Check, Pencil } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { MessageBubble } from "./MessageBubble"
import { ActionConfirmCard } from "./ActionConfirmCard"
import { useAiChat } from "./useAiChat"
import { useAiPanel } from "./AiContext"

const MIN_WIDTH = 280
const MAX_WIDTH = 680
const DEFAULT_WIDTH = 380

export function AiPanel() {
  const { open, toggle } = useAiPanel()
  const {
    conversationId,
    messages,
    streaming,
    pendingAction,
    conversations,
    send,
    confirmAction,
    loadConversation,
    loadConversations,
    archiveConversation,
    updateConversationTitle,
    newConversation,
  } = useAiChat()

  const [input, setInput] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pendingAction])

  // Load conversations list when history panel opens
  useEffect(() => {
    if (showHistory) loadConversations()
  }, [showHistory, loadConversations])

  // Auto-expand textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  // ─── Resize drag handle ────────────────────────────────────────────────────
  const onMouseDownResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startWidth: width }

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startX - ev.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + delta))
      setWidth(newWidth)
    }
    const onMouseUp = () => {
      dragRef.current = null
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }, [width])

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

  const startTitleEdit = (id: string, currentTitle: string) => {
    setEditingTitleId(id)
    setEditingTitleValue(currentTitle)
  }

  const commitTitleEdit = async () => {
    if (editingTitleId && editingTitleValue.trim()) {
      await updateConversationTitle(editingTitleId, editingTitleValue.trim())
    }
    setEditingTitleId(null)
    setEditingTitleValue("")
  }

  return (
    <div
      className="shrink-0 border-l bg-background flex flex-col h-full relative"
      style={{ width }}
    >
      {/* Drag-to-resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors z-10"
        onMouseDown={onMouseDownResize}
      />

      {/* Header */}
      <div className="h-14 shrink-0 border-b flex items-center justify-between px-3">
        <span className="text-sm font-semibold">AI 助手</span>
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
        <div className="border-b max-h-56 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">尚無對話紀錄</p>
            )}
            {conversations.map(conv => (
              <div
                key={conv.id}
                className="flex items-center gap-1 group rounded hover:bg-muted transition-colors"
              >
                {editingTitleId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1 px-1 py-0.5">
                    <input
                      className="flex-1 text-xs border rounded px-1.5 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      value={editingTitleValue}
                      autoFocus
                      onChange={e => setEditingTitleValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") commitTitleEdit()
                        if (e.key === "Escape") setEditingTitleId(null)
                      }}
                      onBlur={commitTitleEdit}
                    />
                    <button
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={commitTitleEdit}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex-1 text-left px-2 py-1.5 text-xs truncate"
                      onClick={() => {
                        loadConversation(conv.id)
                        setShowHistory(false)
                      }}
                    >
                      {conv.id === conversationId && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 mb-px" />
                      )}
                      {conv.title || "Untitled"}
                    </button>
                    <button
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground px-1 transition-opacity"
                      title="編輯標題"
                      onClick={e => { e.stopPropagation(); startTitleEdit(conv.id, conv.title) }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive px-1 transition-opacity"
                      title="封存對話"
                      onClick={e => { e.stopPropagation(); archiveConversation(conv.id, true) }}
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
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
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring overflow-hidden"
            style={{ minHeight: "38px", maxHeight: "160px" }}
            rows={1}
            placeholder="輸入訊息... (Shift+Enter 換行)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
          />
          <Button
            size="icon"
            className="shrink-0"
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
