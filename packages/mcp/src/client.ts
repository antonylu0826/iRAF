// client.ts — Authenticated HTTP client for iRAF REST API

import { getBaseUrl, getToken, invalidateToken } from "./auth.js"

export async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const doRequest = async (token: string) =>
    fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> | undefined),
      },
    })

  let res = await doRequest(await getToken())

  // Token expired — invalidate and retry once
  if (res.status === 401) {
    invalidateToken()
    res = await doRequest(await getToken())
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`iRAF API ${res.status}: ${body}`)
  }

  return res.json()
}
