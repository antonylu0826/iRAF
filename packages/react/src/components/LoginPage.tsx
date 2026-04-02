import React, { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Loader2 } from "lucide-react"
import { useI18n } from "../i18n/useI18n"

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n("iraf:core")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("loginFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-lg bg-card shadow-sm">
        <div className="space-y-1.5 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-bold">i</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("loginTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("username")}</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("password")}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("login")}
          </Button>
        </form>

      </div>
    </div>
  )
}
