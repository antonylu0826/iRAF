import { EntityRegistry } from "@iraf/core"

export function resolveRefLabelField(entityClass: Function, explicit?: string): string {
  if (explicit) return explicit
  const fields = EntityRegistry.getFieldMeta(entityClass)
  return (
    Object.entries(fields)
      .filter(([key, fm]) => !fm.hidden && fm._type === "string" && key !== "id")
      .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
      [0]?.[0] ?? "id"
  )
}
