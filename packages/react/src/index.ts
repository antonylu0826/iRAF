// @iraf/react — iRAF React UI 層（框架殼）
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

// ─── UI Components（供 plugins/system 使用）───────────────────────────────────
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
export { cn } from "./lib/utils"
