import { describe, it, expect, beforeEach } from "vitest"
import { PluginRegistry } from "../registry/PluginRegistry"

// 測試用假 component（不需要實際的 React component）
const FakeComp = () => null

describe("PluginRegistry", () => {
  beforeEach(() => {
    PluginRegistry.clear()
  })

  // ─── register / resolve ─────────────────────────────────────────────────────

  it("可以登記並解析插件", () => {
    PluginRegistry.register("control", { name: "text", caption: "文字", component: FakeComp })
    const plugin = PluginRegistry.resolve("control", "text")
    expect(plugin).toBeDefined()
    expect(plugin?.name).toBe("text")
    expect(plugin?.caption).toBe("文字")
    expect(plugin?.component).toBe(FakeComp)
  })

  it("找不到的 category/name 回傳 undefined", () => {
    expect(PluginRegistry.resolve("control", "nonexistent")).toBeUndefined()
    expect(PluginRegistry.resolve("nonexistent-category", "text")).toBeUndefined()
  })

  // ─── duplicate throws ───────────────────────────────────────────────────────

  it("重複登記同 category + name 時拋出錯誤", () => {
    PluginRegistry.register("control", { name: "text", caption: "文字", component: FakeComp })
    expect(() =>
      PluginRegistry.register("control", { name: "text", caption: "文字2", component: FakeComp })
    ).toThrow(/插件 "text" 在 category "control" 已存在/)
  })

  it("不同 category 下相同 name 不衝突", () => {
    PluginRegistry.register("control",     { name: "list", caption: "Control List", component: FakeComp })
    PluginRegistry.register("list-view",   { name: "list", caption: "List View",    component: FakeComp })
    expect(PluginRegistry.resolve("control",   "list")?.caption).toBe("Control List")
    expect(PluginRegistry.resolve("list-view", "list")?.caption).toBe("List View")
  })

  // ─── getAll ─────────────────────────────────────────────────────────────────

  it("getAll 回傳該 category 所有插件", () => {
    PluginRegistry.register("control", { name: "text",   caption: "文字", component: FakeComp })
    PluginRegistry.register("control", { name: "number", caption: "數字", component: FakeComp })
    const all = PluginRegistry.getAll("control")
    expect(all).toHaveLength(2)
    expect(all.map((p) => p.name)).toContain("text")
    expect(all.map((p) => p.name)).toContain("number")
  })

  it("空 category 的 getAll 回傳空陣列", () => {
    expect(PluginRegistry.getAll("nonexistent")).toEqual([])
  })

  // ─── setDefault / resolveDefault ────────────────────────────────────────────

  it("setDefault 設定後 resolveDefault 可找到", () => {
    PluginRegistry.register("control", { name: "text", caption: "文字", component: FakeComp })
    PluginRegistry.setDefault("control", "string", "text")
    const plugin = PluginRegistry.resolveDefault("control", "string")
    expect(plugin?.name).toBe("text")
  })

  it("resolveDefault 找不到具體 type 時 fallback 到 *", () => {
    PluginRegistry.register("list-view", { name: "list", caption: "表格", component: FakeComp })
    PluginRegistry.setDefault("list-view", "*", "list")
    expect(PluginRegistry.resolveDefault("list-view", "kanban")).toBeDefined()
    expect(PluginRegistry.resolveDefault("list-view", "kanban")?.name).toBe("list")
  })

  it("resolveDefault 沒有 defaults 時回傳 undefined", () => {
    expect(PluginRegistry.resolveDefault("control", "string")).toBeUndefined()
  })

  // ─── unregister / clear ─────────────────────────────────────────────────────

  it("unregister 後可重新登記", () => {
    PluginRegistry.register("control", { name: "text", caption: "舊", component: FakeComp })
    PluginRegistry.unregister("control", "text")
    expect(() =>
      PluginRegistry.register("control", { name: "text", caption: "新", component: FakeComp })
    ).not.toThrow()
    expect(PluginRegistry.resolve("control", "text")?.caption).toBe("新")
  })

  it("clear 後所有登記消失", () => {
    PluginRegistry.register("control",   { name: "text", caption: "文字",  component: FakeComp })
    PluginRegistry.register("list-view", { name: "list", caption: "表格",  component: FakeComp })
    PluginRegistry.setDefault("control", "string", "text")
    PluginRegistry.clear()
    expect(PluginRegistry.getAll("control")).toEqual([])
    expect(PluginRegistry.resolveDefault("control", "string")).toBeUndefined()
  })
})
