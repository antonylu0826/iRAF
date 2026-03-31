import "reflect-metadata"
import { Fields, Validators } from "remult"
import { IRAF_FIELD_KEY, type IFieldMeta, type IFieldOptions } from "../types/metadata"

// ─── 內部工具函式 ──────────────────────────────────────────────────────────────

/** 從 IFieldOptions 中取出 iRAF UI hints */
function extractFieldMeta(options: IFieldOptions): IFieldMeta {
  const meta: IFieldMeta = {}
  if (options.caption !== undefined) meta.caption = options.caption
  if (options.group !== undefined) meta.group = options.group
  if (options.readOnly !== undefined) meta.readOnly = options.readOnly
  if (options.hidden !== undefined) meta.hidden = options.hidden
  if (options.order !== undefined) meta.order = options.order
  if (options.required !== undefined) meta.required = options.required
  if (options.displayFormat !== undefined) meta.displayFormat = options.displayFormat
  if (options.validate !== undefined) meta.validate = options.validate
  if (options.auditField !== undefined) meta.auditField = options.auditField
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

/** 將 validate 函式轉換為 Remult validator */
function buildRemultValidators(options: IFieldOptions) {
  const validators: any[] = []
  if (options.required) validators.push(Validators.required)
  if (options.validate) {
    const userValidate = options.validate
    validators.push((entity: any, fieldRef: any) => {
      const result = userValidate(fieldRef.value, entity)
      if (result) throw result
    })
  }
  if (validators.length === 0) return undefined
  return validators.length === 1 ? validators[0] : validators
}

// ─── @iField namespace ────────────────────────────────────────────────────────

export const iField = {
  /**
   * 字串欄位。包裹 Remult `@Fields.string()`。
   */
  string(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.string({
        caption: options.caption,
        validate: buildRemultValidators(options),
      })(target, propertyKey as string)
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
        validate: buildRemultValidators(options),
      })(target, propertyKey as string)
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
        validate: buildRemultValidators(options),
      })(target, propertyKey as string)
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
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },

  /**
   * JSON 欄位（陣列、物件）。包裹 Remult `@Fields.json()`。
   */
  json(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.json({
        caption: options.caption,
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },
}
