// packages/core/src/utils/password.ts

export interface PasswordRulesOptions {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumber?: boolean
  requireSpecial?: boolean
}

/**
 * Returns a password strength validator compatible with IFieldMeta.validate.
 *
 * ```ts
 * @iField.string({
 *   caption: "New Password",
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
    if (value.length < minLength) return `Password must be at least ${minLength} characters.`
    if (requireUppercase && !/[A-Z]/.test(value)) return "Password must include at least one uppercase letter."
    if (requireLowercase && /[a-z]/.test(value) === false) return "Password must include at least one lowercase letter."
    if (requireNumber && !/[0-9]/.test(value)) return "Password must include at least one number."
    if (requireSpecial && !/[^A-Za-z0-9]/.test(value)) return "Password must include at least one special character."
    return undefined
  }
}
