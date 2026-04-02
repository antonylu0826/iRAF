// app/src/server/JwtAuthProvider.ts
// JWT auth strategy — implements IAuthProvider
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { remult } from "remult"
import type { IAuthProvider, IAuthUser } from "@iraf/core"
import { AppUser } from "@iraf/module-system"

interface JwtAuthProviderOptions {
  secret: string
  expiresIn?: string
}

export class JwtAuthProvider implements IAuthProvider {
  private secret: string
  private expiresIn: string

  constructor({ secret, expiresIn = "8h" }: JwtAuthProviderOptions) {
    this.secret = secret
    this.expiresIn = expiresIn
  }

  private signToken(user: AppUser): string {
    return jwt.sign(
      { id: user.id, name: user.displayName || user.username, roles: user.roles },
      this.secret,
      { expiresIn: this.expiresIn as any }
    )
  }

  async login(credentials: Record<string, any>): Promise<{ token: string; user: IAuthUser }> {
    const { username, password } = credentials as { username?: string; password?: string }
    if (!username || !password) throw new Error("ERR_AUTH_REQUIRED")

    const repo = remult.repo(AppUser)
    const user = await repo.findFirst({ username })
    if (!user) throw new Error("ERR_AUTH_INVALID_CREDENTIALS")

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error("ERR_AUTH_INVALID_CREDENTIALS")

    if (user.isActive === false) throw new Error("ERR_AUTH_DISABLED")

    const token = this.signToken(user)
    return {
      token,
      user: { id: user.id, name: user.displayName || user.username, roles: user.roles },
    }
  }

  async getUser(req: { headers: Record<string, string | string[] | undefined> }): Promise<IAuthUser | undefined> {
    const authHeader = req.headers["authorization"]
    if (!authHeader || typeof authHeader !== "string") return undefined
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader
    try {
      const payload = jwt.verify(token, this.secret) as { id: string; name: string; roles: string[] }
      return { id: payload.id, name: payload.name, roles: payload.roles }
    } catch {
      return undefined
    }
  }
}
