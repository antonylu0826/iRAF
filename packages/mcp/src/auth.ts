// auth.ts — JWT token management for iRAF API
// Supports static token (IRAF_API_TOKEN) or auto-login (IRAF_USERNAME + IRAF_PASSWORD)

let _token: string | null = null
let _tokenExpiry = 0

export function getBaseUrl(): string {
  return process.env.IRAF_BASE_URL ?? "http://localhost:3001"
}

export async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token

  const staticToken = process.env.IRAF_API_TOKEN
  if (staticToken) {
    _token = staticToken
    _tokenExpiry = Date.now() + 24 * 60 * 60 * 1000
    return _token
  }

  const username = process.env.IRAF_USERNAME
  const password = process.env.IRAF_PASSWORD
  if (!username || !password) {
    throw new Error(
      "Set IRAF_API_TOKEN, or both IRAF_USERNAME and IRAF_PASSWORD environment variables."
    )
  }

  const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    throw new Error(`iRAF login failed (${res.status}): ${await res.text()}`)
  }

  const data = await res.json() as { token: string }
  _token = data.token
  // Refresh 5 minutes before 1-hour expiry
  _tokenExpiry = Date.now() + 55 * 60 * 1000
  return _token
}

export function invalidateToken(): void {
  _token = null
  _tokenExpiry = 0
}
