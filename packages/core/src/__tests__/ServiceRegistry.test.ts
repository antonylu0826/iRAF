import { describe, it, expect, beforeEach } from "vitest"
import { ServiceRegistry } from "../registry/ServiceRegistry"

interface IFoo { value: string }
interface IBar { count: number }

describe("ServiceRegistry", () => {
  beforeEach(() => ServiceRegistry.clear())

  it("register and resolve", () => {
    ServiceRegistry.register<IFoo>("foo", { value: "hello" })
    expect(ServiceRegistry.resolve<IFoo>("foo")?.value).toBe("hello")
  })

  it("resolve returns undefined for unknown key", () => {
    expect(ServiceRegistry.resolve("unknown")).toBeUndefined()
  })

  it("require returns instance", () => {
    ServiceRegistry.register<IBar>("bar", { count: 42 })
    expect(ServiceRegistry.require<IBar>("bar").count).toBe(42)
  })

  it("require throws for unknown key", () => {
    expect(() => ServiceRegistry.require("missing")).toThrow("[ServiceRegistry]")
  })

  it("register throws on duplicate key", () => {
    ServiceRegistry.register("foo", { value: "a" })
    expect(() => ServiceRegistry.register("foo", { value: "b" })).toThrow("[ServiceRegistry]")
  })

  it("override replaces existing service", () => {
    ServiceRegistry.register<IFoo>("foo", { value: "old" })
    ServiceRegistry.override<IFoo>("foo", { value: "new" })
    expect(ServiceRegistry.resolve<IFoo>("foo")?.value).toBe("new")
  })

  it("override registers new service without error", () => {
    expect(() => ServiceRegistry.override("foo", { value: "x" })).not.toThrow()
    expect(ServiceRegistry.resolve<IFoo>("foo")?.value).toBe("x")
  })

  it("clear removes all services", () => {
    ServiceRegistry.register("a", 1)
    ServiceRegistry.register("b", 2)
    ServiceRegistry.clear()
    expect(ServiceRegistry.resolve("a")).toBeUndefined()
    expect(ServiceRegistry.resolve("b")).toBeUndefined()
  })
})
