import { describe, it, expect } from "vitest"
import { passwordRules } from "../utils/password"

describe("passwordRules()", () => {
  it("空值不驗證（回傳 undefined）", () => {
    const validate = passwordRules({ minLength: 8 })
    expect(validate("")).toBeUndefined()
    expect(validate(null)).toBeUndefined()
    expect(validate(undefined)).toBeUndefined()
  })

  it("短於 minLength 時回傳錯誤訊息", () => {
    const validate = passwordRules({ minLength: 8 })
    expect(validate("abc")).toMatch(/8/)
    expect(validate("abcdefgh")).toBeUndefined()
  })

  it("requireUppercase", () => {
    const validate = passwordRules({ minLength: 4, requireUppercase: true })
    expect(validate("abcd")).toMatch(/大寫/)
    expect(validate("Abcd")).toBeUndefined()
  })

  it("requireLowercase", () => {
    const validate = passwordRules({ minLength: 4, requireLowercase: true })
    expect(validate("ABCD")).toMatch(/小寫/)
    expect(validate("ABCd")).toBeUndefined()
  })

  it("requireNumber", () => {
    const validate = passwordRules({ minLength: 4, requireNumber: true })
    expect(validate("abcd")).toMatch(/數字/)
    expect(validate("abc1")).toBeUndefined()
  })

  it("requireSpecial", () => {
    const validate = passwordRules({ minLength: 4, requireSpecial: true })
    expect(validate("abcd")).toMatch(/特殊/)
    expect(validate("ab!d")).toBeUndefined()
  })

  it("多規則組合：全通過時回傳 undefined", () => {
    const validate = passwordRules({
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
    })
    expect(validate("Abc1!xyz")).toBeUndefined()
  })

  it("多規則組合：第一個失敗條件回傳對應訊息", () => {
    const validate = passwordRules({
      minLength: 8,
      requireUppercase: true,
      requireNumber: true,
    })
    // 太短 → minLength 先
    expect(validate("Ab1")).toMatch(/8/)
    // 夠長但無大寫
    expect(validate("abcdefg1")).toMatch(/大寫/)
    // 夠長有大寫但無數字
    expect(validate("Abcdefgh")).toMatch(/數字/)
  })
})
