import { describe, it, expect, beforeEach } from "vitest"
import { PluginRegistry } from "../registry/PluginRegistry"

// Fake component for tests (no real React component needed).
const FakeComp = () => null

describe("PluginRegistry", () => {
  beforeEach(() => {
    PluginRegistry.clear()
  })

  // ─── register / resolve ─────────────────────────────────────────────────────

  it("registers and resolves plugins", () => {
    PluginRegistry.register("control", { name: "text", caption: "Text", component: FakeComp })
    const plugin = PluginRegistry.resolve("control", "text")
    expect(plugin).toBeDefined()
    expect(plugin?.name).toBe("text")
    expect(plugin?.caption).toBe("Text")
    expect(plugin?.component).toBe(FakeComp)
  })

  it("returns undefined for missing category/name", () => {
    expect(PluginRegistry.resolve("control", "nonexistent")).toBeUndefined()
    expect(PluginRegistry.resolve("nonexistent-category", "text")).toBeUndefined()
  })

  // ─── duplicate throws ───────────────────────────────────────────────────────

  it("throws when registering duplicate name in same category", () => {
    PluginRegistry.register("control", { name: "text", caption: "Text", component: FakeComp })
    expect(() =>
      PluginRegistry.register("control", { name: "text", caption: "Text2", component: FakeComp })
    ).toThrow(/already exists/)
  })

  it("allows same name under different categories", () => {
    PluginRegistry.register("control",     { name: "list", caption: "Control List", component: FakeComp })
    PluginRegistry.register("list-view",   { name: "list", caption: "List View",    component: FakeComp })
    expect(PluginRegistry.resolve("control",   "list")?.caption).toBe("Control List")
    expect(PluginRegistry.resolve("list-view", "list")?.caption).toBe("List View")
  })

  // ─── getAll ─────────────────────────────────────────────────────────────────

  it("getAll returns all plugins under a category", () => {
    PluginRegistry.register("control", { name: "text",   caption: "Text", component: FakeComp })
    PluginRegistry.register("control", { name: "number", caption: "Number", component: FakeComp })
    const all = PluginRegistry.getAll("control")
    expect(all).toHaveLength(2)
    expect(all.map((p) => p.name)).toContain("text")
    expect(all.map((p) => p.name)).toContain("number")
  })

  it("getAll returns empty array for missing category", () => {
    expect(PluginRegistry.getAll("nonexistent")).toEqual([])
  })

  // ─── setDefault / resolveDefault ────────────────────────────────────────────

  it("resolveDefault returns after setDefault", () => {
    PluginRegistry.register("control", { name: "text", caption: "Text", component: FakeComp })
    PluginRegistry.setDefault("control", "string", "text")
    const plugin = PluginRegistry.resolveDefault("control", "string")
    expect(plugin?.name).toBe("text")
  })

  it("resolveDefault falls back to *", () => {
    PluginRegistry.register("list-view", { name: "list", caption: "Table", component: FakeComp })
    PluginRegistry.setDefault("list-view", "*", "list")
    expect(PluginRegistry.resolveDefault("list-view", "kanban")).toBeDefined()
    expect(PluginRegistry.resolveDefault("list-view", "kanban")?.name).toBe("list")
  })

  it("resolveDefault returns undefined when no defaults are set", () => {
    expect(PluginRegistry.resolveDefault("control", "string")).toBeUndefined()
  })

  // ─── unregister / clear ─────────────────────────────────────────────────────

  it("allows re-register after unregister", () => {
    PluginRegistry.register("control", { name: "text", caption: "Old", component: FakeComp })
    PluginRegistry.unregister("control", "text")
    expect(() =>
      PluginRegistry.register("control", { name: "text", caption: "New", component: FakeComp })
    ).not.toThrow()
    expect(PluginRegistry.resolve("control", "text")?.caption).toBe("New")
  })

  it("clear removes all registrations", () => {
    PluginRegistry.register("control",   { name: "text", caption: "Text",  component: FakeComp })
    PluginRegistry.register("list-view", { name: "list", caption: "Table",  component: FakeComp })
    PluginRegistry.setDefault("control", "string", "text")
    PluginRegistry.clear()
    expect(PluginRegistry.getAll("control")).toEqual([])
    expect(PluginRegistry.resolveDefault("control", "string")).toBeUndefined()
  })
})
