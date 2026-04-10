import "reflect-metadata"
import { Fields, Validators } from "remult"
import { IRAF_FIELD_KEY, type IFieldMeta, type IFieldOptions, type ICollectionMeta } from "../types/metadata"

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Extract iRAF UI hints from IFieldOptions */
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
  if (options.control !== undefined) meta.control = options.control
  if (options.placeholder !== undefined) meta.placeholder = options.placeholder
  if (options.writeRoles !== undefined) meta.writeRoles = options.writeRoles
  if (options.options !== undefined) meta.options = options.options
  if (options.ref !== undefined) meta.ref = options.ref
  if (options.refLabel !== undefined) meta.refLabel = options.refLabel
  if (options.refThreshold !== undefined) meta.refThreshold = options.refThreshold
  if (options.progressColor !== undefined) meta.progressColor = options.progressColor
  return meta
}

/** Attach iRAF field metadata to class Reflect metadata */
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

/** Convert validate function into Remult validator */
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
   * String field. Wraps Remult `@Fields.string()`.
   */
  string(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.string({
        caption: options.caption,
        validate: buildRemultValidators(options),
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, { ...extractFieldMeta(options), _type: "string" })
    }
  },

  /**
   * Number field. Wraps Remult `@Fields.number()`.
   */
  number(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.number({
        caption: options.caption,
        validate: buildRemultValidators(options),
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, { ...extractFieldMeta(options), _type: "number" })
    }
  },

  /**
   * Date field. Wraps Remult `@Fields.date()`.
   */
  date(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.date({
        caption: options.caption,
        validate: buildRemultValidators(options),
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, { ...extractFieldMeta(options), _type: "date" })
    }
  },

  /**
   * Boolean field. Wraps Remult `@Fields.boolean()`.
   */
  boolean(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.boolean({
        caption: options.caption,
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, { ...extractFieldMeta(options), _type: "boolean" })
    }
  },

  /**
   * JSON field (array/object). Wraps Remult `@Fields.json()`.
   */
  json(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.json({
        caption: options.caption,
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, { ...extractFieldMeta(options), _type: "json" })
    }
  },

  /**
   * Collection field (Master-Detail SubGrid).
   *
   * This field doesn't store data directly; child items are stored in a separate entity
   * via a foreign key. DetailView renders it as a SubGrid control.
   *
   * ```ts
   * @iField.collection({
   *   caption: "Detail Items",
   *   entity: () => DetailItem,
   *   foreignKey: "masterId",
   *   order: 10,
   * })
   * details: DetailItem[] = []
   * ```
   */
  collection(options: IFieldOptions & ICollectionMeta): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      // Use Fields.json() so Remult recognizes this property; SubGrid reads from child table directly
      Fields.json({ caption: options.caption })(target, propertyKey as string)
      const { entity, foreignKey, ...rest } = options
      storeFieldMeta(target, propertyKey, {
        ...extractFieldMeta(rest as IFieldOptions),
        _type: "collection",
        collection: { entity, foreignKey },
      })
    }
  },

  /**
   * Progress Bar (read-only visualization of numeric value 0-100).
   */
  progress(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.number({
        caption: options.caption,
        validate: buildRemultValidators(options),
      })(target, propertyKey as string)
      storeFieldMeta(target, propertyKey, {
        ...extractFieldMeta(options),
        _type: "number",
        control: "progress",
      })
    }
  },
}
