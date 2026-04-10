import { remult } from "remult"
import { AiConfig } from "./entities/AiConfig.js"
import { createProviderInstance } from "./providers/factory.js"
import type { IAiProvider } from "./providers/types.js"

/**
 * AiConfigResolver — reads AiConfig from DB and caches the provider instance.
 *
 * - First access loads from DB + creates provider
 * - When AiConfig is modified, call invalidate() to force rebuild
 * - Next chat request will re-read config and create a new provider
 */
export class AiConfigResolver {
  private static _cachedConfig: AiConfig | null = null
  private static _cachedProvider: IAiProvider | null = null
  private static _configLoaded = false

  static async getConfig(): Promise<AiConfig | null> {
    if (this._configLoaded && this._cachedConfig) return this._cachedConfig
    try {
      const repo = remult.repo(AiConfig)
      this._cachedConfig = await repo.findFirst() ?? null
      this._configLoaded = true
    } catch {
      this._cachedConfig = null
      this._configLoaded = true
    }
    return this._cachedConfig
  }

  static async getProvider(): Promise<IAiProvider | null> {
    const config = await this.getConfig()
    if (!config?.enabled || !config.apiKey) return null

    if (this._cachedProvider) return this._cachedProvider

    this._cachedProvider = createProviderInstance(
      config.provider,
      config.apiKey,
      config.model || undefined,
    )
    return this._cachedProvider
  }

  static invalidate(): void {
    this._cachedConfig = null
    this._cachedProvider = null
    this._configLoaded = false
  }
}
