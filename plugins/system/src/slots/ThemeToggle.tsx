import React from "react"
import { Moon, Sun } from "lucide-react"
import { Button, type ISlotProps, useI18n } from "@iraf/react"

const STORAGE_KEY = "iraf-theme"

function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === "dark" ? "dark" : "light"
}

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (theme === "dark") root.classList.add("dark")
  else root.classList.remove("dark")
}

export function ThemeToggle(_props: ISlotProps) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const { t } = useI18n("iraf:core")

  React.useEffect(() => {
    const t = getStoredTheme()
    setTheme(t)
    applyTheme(t)
  }, [])

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
    applyTheme(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-8 w-8"
      aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
      title={theme === "dark" ? t("switchToLight") : t("switchToDark")}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
