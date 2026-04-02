import { addResourceBundle, changeLanguage, getLanguage } from "./i18n"

export class I18nRegistry {
  static addBundle(ns: string, lang: string, resources: Record<string, string>) {
    addResourceBundle(ns, lang, resources)
  }

  static changeLanguage(lang: string) {
    return changeLanguage(lang)
  }

  static getLanguage() {
    return getLanguage()
  }
}
