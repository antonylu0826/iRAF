import React from "react"
import { Languages } from "lucide-react"
import { Button, I18nRegistry, useI18n, type ISlotProps } from "@iraf/react"

export function LanguageToggle(_props: ISlotProps) {
  const { t, i18n } = useI18n("iraf:core")
  const currentLang = i18n.language || "en-US"
  const toggle = () => {
    const next = currentLang === "zh-TW" ? "en-US" : "zh-TW"
    I18nRegistry.changeLanguage(next)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
      aria-label={currentLang === "zh-TW" ? t("switchToEnglish") : t("switchToTraditionalChinese")}
      title={currentLang === "zh-TW" ? t("switchToEnglish") : t("switchToTraditionalChinese")}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-semibold">
        {currentLang === "zh-TW" ? t("langShortZh") : t("langShortEn")}
      </span>
    </Button>
  )
}
