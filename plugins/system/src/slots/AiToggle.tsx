import React from "react"
import { BotMessageSquare } from "lucide-react"
import { Button, type ISlotProps, useAiPanel, useAiStatus } from "@iraf/react"

export function AiToggle(_props: ISlotProps) {
  const { open, toggle } = useAiPanel()
  const status = useAiStatus()

  if (!status.hasAccess) return null

  return (
    <Button
      variant={open ? "secondary" : "ghost"}
      size="icon"
      onClick={toggle}
      className="h-8 w-8"
      aria-label="AI 助手"
      title="AI 助手"
    >
      <BotMessageSquare className="h-4 w-4" />
    </Button>
  )
}
