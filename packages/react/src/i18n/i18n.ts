import i18next from "i18next"
import { initReactI18next } from "react-i18next"

let _initialized = false
const STORAGE_KEY = "iraf-locale"

const coreResources = {
  "zh-TW": {
    "iraf:core": {
      add: "新增",
      edit: "編輯",
      delete: "刪除",
      save: "儲存",
      cancel: "取消",
      back: "返回",
      loading: "載入中…",
      noData: "尚無資料",
      noDetails: "尚無明細",
      confirmDelete: "確定要刪除這筆資料嗎？",
      selectPlaceholder: "請選擇",
      unselected: "未選取",
      choose: "選擇",
      search: "搜尋",
      prevPage: "上一頁",
      nextPage: "下一頁",
      pagePrefix: "第",
      pageSuffix: "頁",
      pending: "筆待寫入",
      noResults: "查無資料",
      generalInfo: "一般資訊",
      recordNotFound: "資料不存在",
      detailCreateDesc: "建立一筆新的 {{name}} 資料",
      detailEditDesc: "修改現有的 {{name}} 詳細資訊",
      noControl: "— 無 control —",
      auditInfo: "稽核資訊",
      fieldRequired: "{{field}} 為必填",
      noRolesAvailable: "尚無可用角色",
      showPassword: "顯示密碼",
      hidePassword: "隱藏密碼",
      loginTitle: "登入",
      loginSubtitle: "請輸入您的帳號與密碼",
      username: "帳號",
      password: "密碼",
      login: "登入",
      loginFailed: "登入失敗",
      "error.ERR_AUTH_REQUIRED": "帳號與密碼為必填",
      "error.ERR_AUTH_INVALID_CREDENTIALS": "帳號或密碼錯誤",
      "error.ERR_AUTH_DISABLED": "帳號已停用，請聯絡管理員",
      "error.ERR_AUTH_UNAUTHENTICATED": "未登入",
      "error.ERR_AUTH_FAILED": "登入失敗",
      "error.ERR_USER_NOT_FOUND": "使用者不存在",
      "error.ERR_PASSWORD_TOO_SHORT": "密碼長度至少需要 6 個字元",
      "error.ERR_RECORD_NOT_FOUND": "資料不存在",
      switchToLight: "切換為亮色",
      switchToDark: "切換為暗色",
      switchToEnglish: "切換為英文",
      switchToTraditionalChinese: "切換為繁體中文",
      langShortZh: "繁",
      langShortEn: "EN",
      logout: "登出",
      toggleSidebar: "切換側邊欄",
    },
  },
  "en-US": {
    "iraf:core": {
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      back: "Back",
      loading: "Loading…",
      noData: "No data",
      noDetails: "No details",
      confirmDelete: "Delete this record?",
      selectPlaceholder: "Select",
      unselected: "None",
      choose: "Choose",
      search: "Search",
      prevPage: "Prev",
      nextPage: "Next",
      pagePrefix: "Page ",
      pageSuffix: "",
      pending: "pending rows",
      noResults: "No results",
      generalInfo: "General Info",
      recordNotFound: "Record not found",
      detailCreateDesc: "Create a new {{name}} record",
      detailEditDesc: "Edit {{name}} details",
      noControl: "— No control —",
      auditInfo: "Audit Info",
      fieldRequired: "{{field}} is required",
      noRolesAvailable: "No roles available",
      showPassword: "Show password",
      hidePassword: "Hide password",
      loginTitle: "Sign in",
      loginSubtitle: "Enter your username and password",
      username: "Username",
      password: "Password",
      login: "Sign in",
      loginFailed: "Login failed",
      "error.ERR_AUTH_REQUIRED": "Username and password are required.",
      "error.ERR_AUTH_INVALID_CREDENTIALS": "Invalid username or password.",
      "error.ERR_AUTH_DISABLED": "Account disabled. Please contact an administrator.",
      "error.ERR_AUTH_UNAUTHENTICATED": "Not authenticated.",
      "error.ERR_AUTH_FAILED": "Login failed.",
      "error.ERR_USER_NOT_FOUND": "User not found.",
      "error.ERR_PASSWORD_TOO_SHORT": "Password must be at least 6 characters.",
      "error.ERR_RECORD_NOT_FOUND": "Record not found.",
      switchToLight: "Switch to light",
      switchToDark: "Switch to dark",
      switchToEnglish: "Switch to English",
      switchToTraditionalChinese: "Switch to Traditional Chinese",
      langShortZh: "ZH",
      langShortEn: "EN",
      logout: "Log out",
      toggleSidebar: "Toggle sidebar",
    },
  },
}

function getStoredLanguage() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(STORAGE_KEY)
}

function getBrowserLanguage() {
  if (typeof navigator === "undefined") return null
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of languages) {
    if (!lang) continue
    const lower = lang.toLowerCase()
    if (lower.startsWith("zh")) return "zh-TW"
    if (lower.startsWith("en")) return "en-US"
  }
  return null
}

export function initI18n(defaultLang: string = "en-US") {
  if (_initialized) return
  _initialized = true

  const stored = getStoredLanguage()
  const browser = getBrowserLanguage()
  const initialLang = stored || browser || defaultLang

  i18next.use(initReactI18next).init({
    lng: initialLang,
    fallbackLng: "en-US",
    interpolation: { escapeValue: false },
    resources: coreResources as any,
    defaultNS: "iraf:core",
  })
}

export const i18nInstance = i18next

export function addResourceBundle(
  ns: string,
  lang: string,
  resources: Record<string, string>
) {
  if (!_initialized) initI18n()
  i18next.addResourceBundle(lang, ns, resources, true, true)
}

export function changeLanguage(lang: string) {
  if (!_initialized) initI18n()
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lang)
  }
  return i18next.changeLanguage(lang)
}

export function getLanguage() {
  if (!_initialized) initI18n()
  return i18next.language
}

export function t(
  key: string,
  options?: Record<string, any> & { defaultValue?: string; ns?: string }
) {
  if (!_initialized) initI18n()
  return i18next.t(key, { defaultValue: key, ...options })
}
