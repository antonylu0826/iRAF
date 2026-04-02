import { useTranslation } from "react-i18next"

export function useI18n(ns?: string) {
  const { t: baseT, i18n } = useTranslation(ns)
  const t = (key: string, options?: Record<string, any>) =>
    baseT(key, { defaultValue: key, ...options })
  return { t, i18n }
}
