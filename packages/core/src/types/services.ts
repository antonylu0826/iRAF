// packages/core/src/types/services.ts
// iRAF built-in service contracts (interface definitions)

// ─── Auth ──────────────────────────────────────────────────────────────────────

/** Authenticated user info */
export interface IAuthUser {
  id: string
  name: string
  roles: string[]
}

/**
 * Auth strategy interface.
 *
 * Register via ServiceRegistry after implementing:
 * ```ts
 * ServiceRegistry.register("auth", new JwtAuthProvider({ secret: "..." }))
 * ```
 *
 * AuthContext resolves this provider from ServiceRegistry,
 * so switching auth (JWT -> OAuth -> LDAP) is a one-line register change.
 */
export interface IAuthProvider {
  /**
   * Handle login, returning token and user info.
   * credentials are provided by login page (default { username, password }).
   */
  login(credentials: Record<string, any>): Promise<{ token: string; user: IAuthUser }>

  /**
   * Parse user from HTTP request (server middleware).
   * Return undefined when not authenticated.
   */
  getUser(req: any): Promise<IAuthUser | undefined>

  /**
   * Custom login page React component (optional).
   * core doesn't depend on React, so it's typed as unknown; packages/react will cast.
   * If not provided, the default LoginPage is used.
   */
  loginComponent?: unknown
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

/**
 * UI notifier interface (toast / snackbar).
 *
 * ```ts
 * ServiceRegistry.register("notifier", new SonnerNotifier())
 *
 * // Usage
 * const notifier = ServiceRegistry.resolve<INotifier>("notifier")
 * notifier?.success("Saved")
 * ```
 */
export interface INotifier {
  success(message: string): void
  error(message: string): void
  info(message: string): void
  warn(message: string): void
}

// ─── Password Hasher ─────────────────────────────────────────────────────────

/**
 * Password hash / compare interface.
 * Implementations are registered on the server (bcrypt / argon2, etc.)
 * to avoid bundling node-only deps into the client.
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>
  compare(password: string, hash: string): Promise<boolean>
}

// ─── Service key constants ───────────────────────────────────────────────────

/** Built-in service keys to avoid magic strings */
export const SERVICE_KEYS = {
  AUTH: "auth",
  NOTIFIER: "notifier",
  STORAGE: "storage",
  LOGGER: "logger",
  PASSWORD_HASHER: "passwordHasher",
} as const
