import React from "react"
import {
  type IControlProps,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@iraf/react"

/**
 * SelectInput — 供 `options` 欄位使用的下拉選單 control。
 * 支援 string[] 與 { id, caption }[] 兩種格式。
 * 已替換為 Shadcn UI / Radix (完全一致的 Tailwind 風格與動畫支援)
 */
export function SelectInput({ value, onChange, disabled, field }: IControlProps) {
  const options = field.options ?? []

  // Shadcn 的 Select onValueChange 都是透過 string 傳遞。
  // 我們將空字串 ("") 視為未選擇 (null)。
  const handleValueChange = (v: string) => {
    // 雖然 Radix UI Select 不允許選「空」項目，
    // 但是我們提供了一個清空用的 "none" option，以便對應 optional field。
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
        <SelectValue placeholder="— 請選擇 —" />
      </SelectTrigger>
      <SelectContent>
        {/* 如果不阻擋空值，提供一個可選的空選項 */}
        <SelectItem value="__none__">
          <span className="text-muted-foreground">— 請選擇 —</span>
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
