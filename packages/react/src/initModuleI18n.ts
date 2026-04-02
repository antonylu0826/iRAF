import { ModuleRegistry } from "@iraf/core"
import { I18nRegistry } from "./i18n/registry"

let _initialized = false

export function initModuleI18n(): void {
  if (_initialized) return
  _initialized = true

  for (const mod of ModuleRegistry.getAll()) {
    const i18n = mod.i18n
    if (!i18n) continue
    const ns = `iraf:module:${mod.key}`
    for (const [lang, dict] of Object.entries(i18n)) {
      I18nRegistry.addBundle(ns, lang, dict)
    }
  }
}
