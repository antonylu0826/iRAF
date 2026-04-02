export type TranslateFn = (key: string, options?: Record<string, any>) => string

function translateCode(t: TranslateFn, code: string, fallback?: string): string {
  if (!code) return fallback ?? ""
  const key = code.startsWith("error.") ? code : `error.${code}`
  return t(key, { defaultValue: fallback ?? code })
}

export function translateError(t: TranslateFn, err: unknown): string {
  if (!err) return ""
  if (typeof err === "string") {
    return translateCode(t, err, err)
  }
  if (typeof err === "object") {
    const anyErr = err as { code?: string; message?: string }
    if (anyErr.code) return translateCode(t, anyErr.code, anyErr.message ?? anyErr.code)
    if (anyErr.message) return translateCode(t, anyErr.message, anyErr.message)
  }
  return String(err)
}
