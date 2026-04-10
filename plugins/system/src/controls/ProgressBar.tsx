import { cn, type IControlProps } from "@iraf/react"

/**
 * ProgressBar Control — Read-only visualization of numeric value (0-100).
 * 
 * Supports:
 * - field.progressColor: custom hex or tailwind color class
 */
export function ProgressBar({ value, field }: IControlProps) {
  const percent = Math.min(100, Math.max(0, Number(value) || 0))
  const color = field.progressColor || "bg-primary"

  // Check if it's a tailwind class or a raw color
  const isTailwind = color.startsWith("bg-") || color.startsWith("text-")
  const fillStyle = isTailwind ? {} : { backgroundColor: color }

  return (
    <div className="flex items-center gap-3 w-full h-9">
      <div className="flex-1 h-3 w-full rounded-full bg-muted/30 overflow-hidden border border-border/20">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]",
            isTailwind ? color : "bg-primary"
          )}
          style={{ 
            width: `${percent}%`,
            ...(!isTailwind && color ? { backgroundColor: color } : {})
          }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums min-w-[32px] text-right text-foreground/80">
        {percent}%
      </span>
    </div>
  )
}
