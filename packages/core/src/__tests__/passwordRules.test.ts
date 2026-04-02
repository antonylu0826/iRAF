import { describe, it, expect } from "vitest"
import { passwordRules } from "../utils/password"

describe("passwordRules()", () => {
  it("does not validate empty values (returns undefined)", () => {
    const validate = passwordRules({ minLength: 8 })
    expect(validate("")).toBeUndefined()
    expect(validate(null)).toBeUndefined()
    expect(validate(undefined)).toBeUndefined()
  })

  it("returns error when shorter than minLength", () => {
    const validate = passwordRules({ minLength: 8 })
    expect(validate("abc")).toMatch(/8/)
    expect(validate("abcdefgh")).toBeUndefined()
  })

  it("requireUppercase", () => {
    const validate = passwordRules({ minLength: 4, requireUppercase: true })
    expect(validate("abcd")).toMatch(/uppercase/i)
    expect(validate("Abcd")).toBeUndefined()
  })

  it("requireLowercase", () => {
    const validate = passwordRules({ minLength: 4, requireLowercase: true })
    expect(validate("ABCD")).toMatch(/lowercase/i)
    expect(validate("ABCd")).toBeUndefined()
  })

  it("requireNumber", () => {
    const validate = passwordRules({ minLength: 4, requireNumber: true })
    expect(validate("abcd")).toMatch(/number/i)
    expect(validate("abc1")).toBeUndefined()
  })

  it("requireSpecial", () => {
    const validate = passwordRules({ minLength: 4, requireSpecial: true })
    expect(validate("abcd")).toMatch(/special/i)
    expect(validate("ab!d")).toBeUndefined()
  })

  it("multiple rules: returns undefined when all pass", () => {
    const validate = passwordRules({
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
    })
    expect(validate("Abc1!xyz")).toBeUndefined()
  })

  it("multiple rules: returns first failing error message", () => {
    const validate = passwordRules({
      minLength: 8,
      requireUppercase: true,
      requireNumber: true,
    })
    // Too short -> minLength first
    expect(validate("Ab1")).toMatch(/8/)
    // Long enough but no uppercase
    expect(validate("abcdefg1")).toMatch(/uppercase/i)
    // Long enough with uppercase but no number
    expect(validate("Abcdefgh")).toMatch(/number/i)
  })
})
