import React, { useState } from "react"
import type { IAiPendingAction } from "@iraf/core"
import { Button } from "../ui/button"

export function ActionConfirmCard({
  action,
  onConfirm,
}: {
  action: IAiPendingAction
  onConfirm: (approved: boolean, reason?: string) => void
}) {
  const [showReason, setShowReason] = useState(false)
  const [reason, setReason] = useState("")

  return (
    <div className="my-2 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-3 bg-yellow-50/50 dark:bg-yellow-950/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">⚡</span>
        <span className="text-sm font-semibold">AI 提議執行操作</span>
      </div>
      <p className="text-sm mb-2">{action.description}</p>

      <details className="mb-3">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          詳情
        </summary>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground whitespace-pre-wrap break-all bg-muted/50 rounded p-1.5">
          {JSON.stringify(action.input, null, 2)}
        </div>
      </details>

      {showReason ? (
        <div className="space-y-2">
          <textarea
            className="w-full text-xs border rounded p-1.5 bg-background resize-none"
            rows={2}
            placeholder="拒絕原因（可選）"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowReason(false)}>
              取消
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onConfirm(false, reason || undefined)}>
              確認拒絕
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowReason(true)}>
            拒絕
          </Button>
          <Button size="sm" onClick={() => onConfirm(true)}>
            確認執行
          </Button>
        </div>
      )}
    </div>
  )
}
