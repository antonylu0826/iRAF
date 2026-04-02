import {
  IRAF_ENTITY_KEY,
  IRAF_FIELD_KEY,
  IRAF_ACTION_KEY,
  IRAF_CONTROLLER_KEY,
  type IEntityMeta,
  type IFieldMeta,
  type IActionMeta,
} from "../types/metadata"

/**
 * EntityRegistry — iRAF entity registry.
 *
 * All BOs must be registered here so the framework can:
 * - generate sidebar navigation
 * - create ListView / DetailView routes
 * - apply permission controls
 *
 * Example:
 * ```ts
 * EntityRegistry.register(Customer, Order, Product)
 * ```
 */
export class EntityRegistry {
  private static _entities: Function[] = []
  private static _controllers: Function[] = []

  /** Called by @iController to register controllers directly (independent of _entities). */
  static registerController(ctrl: Function): void {
    if (!this._controllers.includes(ctrl)) {
      this._controllers.push(ctrl)
    }
  }

  /** Register one or more BOs. Duplicate classes are ignored. */
  static register(...entities: Function[]): void {
    for (const entity of entities) {
      if (!this._entities.includes(entity)) {
        this._entities.push(entity)
      }
    }
  }

  /** Get all registered BO classes. */
  static getAll(): Function[] {
    return [...this._entities]
  }

  /** Get all registered BO classes with iRAF entity metadata (for UI). */
  static getAllWithMeta(): Array<{ entityClass: Function; meta: IEntityMeta }> {
    return this._entities
      .map((entityClass) => {
        const meta = Reflect.getMetadata(IRAF_ENTITY_KEY, entityClass) as IEntityMeta | undefined
        return meta ? { entityClass, meta } : null
      })
      .filter((x): x is { entityClass: Function; meta: IEntityMeta } => x !== null)
  }

  /**
   * Get iRAF entity metadata for a BO (caption, icon, etc.).
   * Returns undefined if not decorated by @iEntity.
   */
  static getMeta(entityClass: Function): IEntityMeta | undefined {
    return Reflect.getMetadata(IRAF_ENTITY_KEY, entityClass)
  }

  /**
   * Get field metadata for a BO (group, readOnly, hidden, etc.).
   * Returns empty object if none.
   */
  static getFieldMeta(entityClass: Function): Record<string, IFieldMeta> {
    return Reflect.getOwnMetadata(IRAF_FIELD_KEY, entityClass) ?? {}
  }

  /**
   * Get @iAction list for controllers associated with a BO.
   * Used by DetailView action bar rendering.
   */
  static getActions(
    entityClass: Function
  ): Array<{ controllerClass: Function; meta: IActionMeta }> {
    const controllers: Function[] =
      Reflect.getOwnMetadata(IRAF_CONTROLLER_KEY, entityClass) ?? []
    const actions: Array<{ controllerClass: Function; meta: IActionMeta }> = []
    for (const ctrl of controllers) {
      const metas: IActionMeta[] =
        Reflect.getOwnMetadata(IRAF_ACTION_KEY, ctrl) ?? []
      for (const meta of metas) {
        actions.push({ controllerClass: ctrl, meta })
      }
    }
    return actions
  }

  /**
   * Get all registered controller classes.
   * Used by remultExpress({ controllers: EntityRegistry.getAllControllers() }).
   * Maintained by @iController; does not depend on _entities.
   */
  static getAllControllers(): Function[] {
    return [...this._controllers]
  }

  /**
   * Get entity class by key. Used for LookupInput dynamic resolution.
   */
  static getByKey(key: string): Function | undefined {
    return this._entities.find((e) => {
      const meta = Reflect.getMetadata(IRAF_ENTITY_KEY, e) as IEntityMeta | undefined
      return meta?.key === key
    })
  }

  /** Clear all registrations (mainly for tests). */
  static clear(): void {
    this._entities = []
    this._controllers = []
  }
}
