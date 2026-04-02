import React from "react"
import {
  type IControlProps,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useI18n,
} from "@iraf/react"

/**
 * SelectInput — dropdown control for `options` fields.
 * Supports string[] and { id, caption }[] formats.
 * Implemented with Shadcn UI / Radix for consistent Tailwind styling & animations.
 */
export function SelectInput({ value, onChange, disabled, field }: IControlProps) {
  const { t } = useI18n("iraf:core")
  const options = field.options ?? []

  // Shadcn Select onValueChange always passes strings.
  // Treat empty string ("") as unselected (null).
  const handleValueChange = (v: string) => {
    // Radix Select doesn't allow an empty item,
    // so we provide a "none" option for optional fields.
    if (v === "__none__") {
      onChange(null)
    } else {
      onChange(v)
    }
  }

  return (
    <Select
      value={value ? String(value) : "__none__"}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("selectPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {/* Optional "none" option for clearing the value */}
        <SelectItem value="__none__">
          <span className="text-muted-foreground">{t("selectPlaceholder")}</span>
        </SelectItem>
        {options.map((opt) => {
          if (typeof opt === "string") {
            return (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            )
          }
          return (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {opt.caption}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
