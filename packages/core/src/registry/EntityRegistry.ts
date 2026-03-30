import { IRAF_ENTITY_KEY, IRAF_FIELD_KEY, type IEntityMeta, type IFieldMeta } from "../types/metadata"

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

  /** 清除所有登記（主要用於測試）。 */
  static clear(): void {
    this._entities = []
  }
}
