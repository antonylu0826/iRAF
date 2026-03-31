// @iraf/react — iRAF React UI 層
import "reflect-metadata"

export const IRAF_REACT_VERSION = "0.2.0"

export { iRAFApp } from "./components/iRAFApp"
export { AppShell } from "./components/AppShell"
export { Sidebar } from "./components/Sidebar"
export { ListView } from "./components/ListView"
export { DetailView } from "./components/DetailView"
export { useAuth } from "./context/AuthContext"
export type { AuthUser } from "./context/AuthContext"
export { PluginRegistry } from "./registry/PluginRegistry"
export type { IPluginMeta, IControlProps, IListViewProps, IDetailViewProps } from "./registry/PluginRegistry"
export { initPlugins } from "./initPlugins"
