import React from "react"
import { PluginRegistry } from "../registry/PluginRegistry"

/**
 * ISlotProps — 所有 slot component 都會收到的 props。
 * context 由 Shell 傳入，供 slot 取得所在頁面的上下文資訊。
 */
export interface ISlotProps {
  context?: Record<string, any>
}

/**
 * SlotArea — 渲染指定前綴的所有 slot 插件。
 *
 * Slot 以 PluginRegistry 的 "slot" category 管理，
 * 名稱格式為 `{區域}:{名稱}`，例如 `appbar:notifications`。
 *
 * ```tsx
 * // Shell 元件內使用
 * <SlotArea prefix="appbar" />
 * <SlotArea prefix="detail-toolbar" context={{ entityClass, item }} />
 *
 * // 插件註冊
 * PluginRegistry.register("slot", {
 *   name: "appbar:notifications",
 *   caption: "通知鈴",
 *   component: NotificationBell,
 * })
 * ```
 *
 * Slot 前綴規範：
 * - `appbar`          AppHeader 右側（logout 左側）
 * - `sidebar-header`  Sidebar logo 區下方
 * - `sidebar-footer`  Sidebar 底部
 * - `list-toolbar`    ListView 標題列右側（新增按鈕左側）
 * - `detail-header`   DetailView 標題區右側（返回按鈕左側）
 * - `detail-toolbar`  DetailView Action Bar 之後
 */
export function SlotArea({
  prefix,
  context,
}: {
  prefix: string
  context?: Record<string, any>
}) {
  const slots = PluginRegistry.getAll("slot").filter((p) =>
    p.name.startsWith(`${prefix}:`)
  )
  if (slots.length === 0) return null

  return (
    <>
      {slots.map((slot) => {
        const Comp = slot.component as React.ComponentType<ISlotProps>
        return <Comp key={slot.name} context={context} />
      })}
    </>
  )
}
