import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { IWidgetProps } from "@iraf/dashboard"
import { Settings } from "lucide-react"

export function MarkdownWidget({ widget, data, editMode, onConfigure }: IWidgetProps) {
  const content = typeof data === "string" ? data : ""

  return (
    <div className="h-full flex flex-col p-3 relative overflow-auto">
      {editMode && onConfigure && (
        <button className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground" onClick={onConfigure}>
          <Settings className="h-3.5 w-3.5" />
        </button>
      )}

      {widget.title && <div className="text-sm font-semibold mb-2">{widget.title}</div>}

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
