import { useEffect } from "react"
import { useAiPanel } from "./AiContext"

export function useAiStatus() {
  const { status, setStatus } = useAiPanel()

  useEffect(() => {
    const token = localStorage.getItem("iraf_token")
    if (!token) return

    fetch("/api/ai/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { enabled: false, hasAccess: false })
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, hasAccess: false }))
  }, [setStatus])

  return status
}
