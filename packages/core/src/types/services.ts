// packages/core/src/types/services.ts
// iRAF 內建服務合約（介面定義）

// ─── Auth ──────────────────────────────────────────────────────────────────────

/** 認證後的使用者資訊 */
export interface IAuthUser {
  id: string
  name: string
  roles: string[]
}

/**
 * 認證策略介面。
 *
 * 實作此介面後透過 ServiceRegistry 登記：
 * ```ts
 * ServiceRegistry.register("auth", new JwtAuthProvider({ secret: "..." }))
 * ```
 *
 * 框架的 AuthContext 會從 ServiceRegistry 取得此 provider，
 * 因此切換認證方式（JWT → OAuth → LDAP）只需換一行 register 呼叫。
 */
export interface IAuthProvider {
  /**
   * 處理登入，回傳 token 與使用者資訊。
   * credentials 由登入頁傳入（預設 { username, password }）。
   */
  login(credentials: Record<string, any>): Promise<{ token: string; user: IAuthUser }>

  /**
   * 從 HTTP request 解析使用者（server 側 middleware）。
   * 無法解析時回傳 undefined。
   */
  getUser(req: any): Promise<IAuthUser | undefined>

  /**
   * 自訂登入頁 React 元件（選填）。
   * core 不依賴 React，以 unknown 宣告；packages/react 層轉型使用。
   * 未提供時使用框架預設 LoginPage。
   */
  loginComponent?: unknown
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

/**
 * UI 通知介面（toast / snackbar）。
 *
 * ```ts
 * ServiceRegistry.register("notifier", new SonnerNotifier())
 *
 * // 使用
 * const notifier = ServiceRegistry.resolve<INotifier>("notifier")
 * notifier?.success("儲存成功")
 * ```
 */
export interface INotifier {
  success(message: string): void
  error(message: string): void
  info(message: string): void
  warn(message: string): void
}

// ─── Service key 常數 ─────────────────────────────────────────────────────────

/** 內建服務 key 常數，避免魔法字串 */
export const SERVICE_KEYS = {
  AUTH: "auth",
  NOTIFIER: "notifier",
  STORAGE: "storage",
  LOGGER: "logger",
} as const
