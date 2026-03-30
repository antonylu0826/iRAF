import { describe, it, expect } from "vitest"
import { IRAF_REACT_VERSION } from "../index"

describe("@iraf/react", () => {
  it("exports a version string", () => {
    expect(IRAF_REACT_VERSION).toBe("0.0.1")
  })
})
