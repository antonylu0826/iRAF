import { describe, it, expect, beforeEach, vi } from "vitest"
import { EventBus } from "../events/EventBus"

describe("EventBus", () => {
  beforeEach(() => EventBus.clear())

  it("on + emit calls handler", async () => {
    const fn = vi.fn()
    EventBus.on("test", fn)
    await EventBus.emit("test", { value: 1 })
    expect(fn).toHaveBeenCalledWith({ value: 1 })
  })

  it("multiple handlers called in parallel", async () => {
    const results: number[] = []
    EventBus.on("test", async () => { await Promise.resolve(); results.push(1) })
    EventBus.on("test", async () => { await Promise.resolve(); results.push(2) })
    await EventBus.emit("test", {})
    expect(results).toHaveLength(2)
  })

  it("emit on unknown event does not throw", async () => {
    await expect(EventBus.emit("no-listeners", {})).resolves.toBeUndefined()
  })

  it("off removes handler", async () => {
    const fn = vi.fn()
    EventBus.on("test", fn)
    EventBus.off("test", fn)
    await EventBus.emit("test", {})
    expect(fn).not.toHaveBeenCalled()
  })

  it("on returns unsubscribe function", async () => {
    const fn = vi.fn()
    const unsubscribe = EventBus.on("test", fn)
    unsubscribe()
    await EventBus.emit("test", {})
    expect(fn).not.toHaveBeenCalled()
  })

  it("once fires exactly once", async () => {
    const fn = vi.fn()
    EventBus.once("test", fn)
    await EventBus.emit("test", { n: 1 })
    await EventBus.emit("test", { n: 2 })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({ n: 1 })
  })

  it("once unsubscribe before fire prevents call", async () => {
    const fn = vi.fn()
    const unsub = EventBus.once("test", fn)
    unsub()
    await EventBus.emit("test", {})
    expect(fn).not.toHaveBeenCalled()
  })

  it("clear removes all handlers", async () => {
    const fn = vi.fn()
    EventBus.on("a", fn)
    EventBus.on("b", fn)
    EventBus.clear()
    await EventBus.emit("a", {})
    await EventBus.emit("b", {})
    expect(fn).not.toHaveBeenCalled()
  })
})
