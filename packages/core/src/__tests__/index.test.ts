import { describe, it, expect } from "vitest"
import { IRAF_VERSION } from "../index"

describe("@iraf/core", () => {
  it("exports a version string", () => {
    expect(IRAF_VERSION).toBe("0.1.0")
  })
})
