import { useState, useCallback, useRef } from "react"
import type { IAiMessageDTO, IAiPendingAction, IAiSSEEvent } from "@iraf/core"
import { EventBus } from "@iraf/core"
import { useAiContext } from "./AiContext"

export interface ConversationInfo {
  id: string
  title: string
  archived: boolean
  lastMessageAt?: string
}

export function useAiChat() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<IAiMessageDTO[]>([])
  const [streaming, setStreaming] = useState(false)
  const [pendingAction, setPendingAction] = useState<IAiPendingAction | null>(null)
  const [conversations, setConversations] = useState<ConversationInfo[]>([])
  const context = useAiContext()
  const abortRef = useRef<AbortController | null>(null)

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("iraf_token")
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    return headers
  }, [])

  const processSSE = useCallback(async (
    response: Response,
    onDone?: () => void,
  ) => {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let assistantContent = ""
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        let event: IAiSSEEvent
        try {
          event = JSON.parse(line.slice(6))
        } catch {
          continue
        }

        switch (event.type) {
          case "chunk":
            assistantContent += event.content
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last?.role === "assistant" && !last.usage) {
                return [...prev.slice(0, -1), { ...last, content: assistantContent }]
              }
              return [...prev, {
                id: `streaming-${Date.now()}`,
                role: "assistant",
                content: assistantContent,
                timestamp: Date.now(),
              }]
            })
            break

          case "tool_call":
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last?.role === "assistant") {
                const existing = last.toolCalls ?? []
                return [...prev.slice(0, -1), { ...last, toolCalls: [...existing, event.toolCall] }]
              }
              return prev
            })
            break

          case "tool_result":
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last?.role === "assistant") {
                const existing = last.toolResults ?? []
                return [...prev.slice(0, -1), {
                  ...last,
                  toolResults: [...existing, { toolCallId: event.toolCallId, result: event.result, isError: event.isError }],
                }]
              }
              return prev
            })
            break

          case "data_changed":
            // Notify other components (ListView, DetailView) that entity data changed
            EventBus.emit("ai:data-changed", { entityKey: event.entityKey })
            break

          case "pending_action":
            setPendingAction(event.action)
            break

          case "message":
            setMessages(prev => {
              const withoutStreaming = prev.filter(m => !m.id.startsWith("streaming-"))
              return [...withoutStreaming, event.message]
            })
            assistantContent = ""
            break

          case "conversation":
            setConversationId(event.conversationId)
            break

          case "error":
            setMessages(prev => [...prev, {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: `**Error:** ${event.error}`,
              timestamp: Date.now(),
            }])
            break

          case "done":
            onDone?.()
            break
        }
      }
    }
  }, [])

  const send = useCallback(async (userMessage: string) => {
    if (streaming) return

    const userMsg: IAiMessageDTO = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setStreaming(true)
    setPendingAction(null)

    try {
      const abort = new AbortController()
      abortRef.current = abort

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ conversationId, message: userMessage, context }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `**Error:** ${err.error ?? res.statusText}`,
          timestamp: Date.now(),
        }])
        setStreaming(false)
        return
      }

      await processSSE(res, () => setStreaming(false))
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `**Connection error:** ${err.message}`,
          timestamp: Date.now(),
        }])
      }
      setStreaming(false)
    }
  }, [conversationId, streaming, context, getHeaders, processSSE])

  const confirmAction = useCallback(async (approved: boolean, reason?: string) => {
    if (!pendingAction || !conversationId) return
    const actionToConfirm = pendingAction
    setPendingAction(null)
    setStreaming(true)

    try {
      const res = await fetch("/api/ai/confirm", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          conversationId,
          pendingActionId: actionToConfirm.id,
          approved,
          reason,
          context,
        }),
      })

      if (res.ok) {
        await processSSE(res, () => setStreaming(false))
      } else {
        setStreaming(false)
      }
    } catch {
      setStreaming(false)
    }
  }, [conversationId, pendingAction, context, getHeaders, processSSE])

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}/messages`, {
        headers: getHeaders(),
      })
      if (res.ok) {
        const msgs = await res.json()
        setConversationId(id)
        setMessages(msgs)
        setPendingAction(null)
      }
    } catch {
      // ignore
    }
  }, [getHeaders])

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations", {
        headers: getHeaders(),
      })
      if (res.ok) {
        const list = await res.json()
        setConversations(list.map((c: any) => ({
          id: c.id,
          title: c.title,
          archived: c.archived ?? false,
          lastMessageAt: c.lastMessageAt,
        })))
      }
    } catch {
      // ignore
    }
  }, [getHeaders])

  const archiveConversation = useCallback(async (id: string, archived: boolean) => {
    try {
      await fetch(`/api/ai/conversations/${id}/archive`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ archived }),
      })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (conversationId === id && archived) {
        setConversationId(null)
        setMessages([])
        setPendingAction(null)
      }
    } catch {
      // ignore
    }
  }, [conversationId, getHeaders])

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}/title`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
      }
    } catch {
      // ignore
    }
  }, [getHeaders])

  const newConversation = useCallback(() => {
    setConversationId(null)
    setMessages([])
    setPendingAction(null)
    abortRef.current?.abort()
  }, [])

  return {
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
  }
}
