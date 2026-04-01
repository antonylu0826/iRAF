// packages/core/src/utils/password.ts

export interface PasswordRulesOptions {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumber?: boolean
  requireSpecial?: boolean
}

/**
 * 回傳符合 IFieldMeta.validate 簽名的密碼強度驗證函式。
 *
 * ```ts
 * @iField.string({
 *   caption: "新密碼",
 *   control: "password",
 *   validate: passwordRules({ minLength: 8, requireUppercase: true, requireSpecial: true }),
 * })
 * newPassword = ""
 * ```
 */
export function passwordRules(options: PasswordRulesOptions = {}) {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options

  return (value: any): string | undefined => {
    if (typeof value !== "string" || value === "") return undefined
    if (value.length < minLength) return `密碼長度至少需要 ${minLength} 個字元`
    if (requireUppercase && !/[A-Z]/.test(value)) return "密碼必須包含至少一個大寫字母"
    if (requireLowercase && /[a-z]/.test(value) === false) return "密碼必須包含至少一個小寫字母"
    if (requireNumber && !/[0-9]/.test(value)) return "密碼必須包含至少一個數字"
    if (requireSpecial && !/[^A-Za-z0-9]/.test(value)) return "密碼必須包含至少一個特殊符號"
    return undefined
  }
}
