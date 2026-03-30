import "reflect-metadata"
import { Fields, Validators } from "remult"
import { IRAF_FIELD_KEY, type IFieldMeta, type IFieldOptions } from "../types/metadata"

// ─── 內部工具函式 ──────────────────────────────────────────────────────────────

/** 從 IFieldOptions 中取出 iRAF UI hints（排除 caption 和 required） */
function extractFieldMeta(options: IFieldOptions): IFieldMeta {
  const meta: IFieldMeta = {}
  if (options.group !== undefined) meta.group = options.group
  if (options.readOnly !== undefined) meta.readOnly = options.readOnly
  if (options.hidden !== undefined) meta.hidden = options.hidden
  if (options.order !== undefined) meta.order = options.order
  if (options.displayFormat !== undefined) meta.displayFormat = options.displayFormat
  return meta
}

/** 將 iRAF 欄位 metadata 附加到類別的 Reflect metadata 上 */
function storeFieldMeta(
  target: object,
  propertyKey: string | symbol,
  meta: IFieldMeta
): void {
  const ctor = (target as any).constructor as Function
  const existing: Record<string | symbol, IFieldMeta> =
    Reflect.getOwnMetadata(IRAF_FIELD_KEY, ctor) ?? {}
  existing[propertyKey as string] = meta
  Reflect.defineMetadata(IRAF_FIELD_KEY, existing, ctor)
}

// ─── @iField namespace ────────────────────────────────────────────────────────

export const iField = {
  /**
   * 字串欄位。包裹 Remult `@Fields.string()`。
   * @param options caption（傳給 Remult）、required（傳給 Remult validator）
   *                group/readOnly/hidden/order/displayFormat（iRAF UI metadata）
   */
  string(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.string({
        caption: options.caption,
        ...(options.required ? { validate: Validators.required } : {}),
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },

  /**
   * 數字欄位。包裹 Remult `@Fields.number()`。
   */
  number(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.number({
        caption: options.caption,
        ...(options.required ? { validate: Validators.required } : {}),
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },

  /**
   * 日期欄位。包裹 Remult `@Fields.date()`。
   */
  date(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.date({
        caption: options.caption,
        ...(options.required ? { validate: Validators.required } : {}),
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },

  /**
   * 布林欄位。包裹 Remult `@Fields.boolean()`。
   */
  boolean(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.boolean({
        caption: options.caption,
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },
}
