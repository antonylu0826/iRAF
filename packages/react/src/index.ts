// @iraf/react — iRAF React UI layer (shell)
import "reflect-metadata"

export const IRAF_REACT_VERSION = "0.2.0"

// ─── App Shell ────────────────────────────────────────────────────────────────
export { iRAFApp } from "./components/iRAFApp"
export { AppShell } from "./components/AppShell"
export { Sidebar } from "./components/Sidebar"
export { LoginPage } from "./components/LoginPage"

// ─── Auth ─────────────────────────────────────────────────────────────────────
export { useAuth } from "./context/AuthContext"
export type { AuthUser } from "./context/AuthContext"

// ─── Plugin Registry ──────────────────────────────────────────────────────────
export { PluginRegistry } from "./registry/PluginRegistry"
export type { IPluginMeta, IControlProps, IListViewProps, IDetailViewProps } from "./registry/PluginRegistry"
export { initModulePlugins } from "./initModulePlugins"
export { initI18n, t } from "./i18n/i18n"
export { I18nRegistry } from "./i18n/registry"
export { useI18n } from "./i18n/useI18n"

// ─── UI Components (used by plugins/system) ──────────────────────────────────
export { Button } from "./components/ui/button"
export { Separator } from "./components/ui/separator"
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./components/ui/table"
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./components/ui/select"
export { SlotArea } from "./components/SlotArea"
export type { ISlotProps } from "./components/SlotArea"
export { cn } from "./lib/utils"
