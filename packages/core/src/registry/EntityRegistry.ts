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
 * EntityRegistry — iRAF 實體登記簿。
 *
 * 所有 BO 必須在此登記，框架才能：
 * - 生成左側導航選單
 * - 為每個實體建立 ListView / DetailView 路由
 * - 套用權限控制
 *
 * 使用方式：
 * ```ts
 * // apps/demo/src/shared/index.ts
 * EntityRegistry.register(Customer, Order, Product)
 * ```
 */
export class EntityRegistry {
  private static _entities: Function[] = []
  private static _controllers: Function[] = []

  /** 由 @iController 呼叫，直接登記 controller（不依賴 _entities）。 */
  static registerController(ctrl: Function): void {
    if (!this._controllers.includes(ctrl)) {
      this._controllers.push(ctrl)
    }
  }

  /** 登記一或多個 BO。重複登記同一個 class 會被忽略。 */
  static register(...entities: Function[]): void {
    for (const entity of entities) {
      if (!this._entities.includes(entity)) {
        this._entities.push(entity)
      }
    }
  }

  /** 取得所有已登記的 BO class。 */
  static getAll(): Function[] {
    return [...this._entities]
  }

  /** 取得所有已登記的 BO class 及其 iRAF entity metadata（供 UI 層使用）。 */
  static getAllWithMeta(): Array<{ entityClass: Function; meta: IEntityMeta }> {
    return this._entities
      .map((entityClass) => {
        const meta = Reflect.getMetadata(IRAF_ENTITY_KEY, entityClass) as IEntityMeta | undefined
        return meta ? { entityClass, meta } : null
      })
      .filter((x): x is { entityClass: Function; meta: IEntityMeta } => x !== null)
  }

  /**
   * 取得指定 BO 的 iRAF 實體 metadata（caption、icon、module 等）。
   * 若該 class 未以 @iEntity 裝飾，回傳 undefined。
   */
  static getMeta(entityClass: Function): IEntityMeta | undefined {
    return Reflect.getMetadata(IRAF_ENTITY_KEY, entityClass)
  }

  /**
   * 取得指定 BO 所有欄位的 iRAF 欄位 metadata（group、readOnly、hidden 等）。
   * 若無 metadata，回傳空物件。
   */
  static getFieldMeta(entityClass: Function): Record<string, IFieldMeta> {
    return Reflect.getOwnMetadata(IRAF_FIELD_KEY, entityClass) ?? {}
  }

  /**
   * 取得指定 BO 所有關聯 Controller 的 @iAction 列表。
   * 供 DetailView 渲染 Action Bar 使用。
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
   * 取得所有已關聯的 Controller class。
   * 供 remultExpress({ controllers: EntityRegistry.getAllControllers() }) 使用。
   * 由 @iController 直接維護，不依賴 _entities 是否已填入。
   */
  static getAllControllers(): Function[] {
    return [...this._controllers]
  }

  /**
   * 依 entity key 取得對應的 class。供 LookupInput 等動態解析使用。
   */
  static getByKey(key: string): Function | undefined {
    return this._entities.find((e) => {
      const meta = Reflect.getMetadata(IRAF_ENTITY_KEY, e) as IEntityMeta | undefined
      return meta?.key === key
    })
  }

  /** 清除所有登記（主要用於測試）。 */
  static clear(): void {
    this._entities = []
    this._controllers = []
  }
}
