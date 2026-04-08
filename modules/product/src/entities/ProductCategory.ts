import { BaseObject, iEntity, iField, iController, iAction } from "@iraf/core";

@iEntity("product-category", {
  caption: "產品分類",
  icon: "tag",
  allowedRoles: ["admin", "manager", "staff"],
})
export class ProductCategory extends BaseObject {
  @iField.string({
    caption: "分類名稱",
    required: true,
    order: 1,
    group: "基本資訊",
  })
  name: string = "";

  @iField.string({
    caption: "分類代碼",
    required: true,
    order: 2,
    group: "基本資訊",
    validate: (val) => /^[A-Z0-9_]+$/.test(val) || "代碼只能包含大寫字母、數字和底線",
  })
  code: string = "";

  @iField.string({
    caption: "上層分類",
    order: 3,
    group: "基本資訊",
    control: "ref",
    refEntity: "product-category",
  })
  parentCategoryId: string = "";

  @iField.string({
    caption: "分類描述",
    order: 4,
    group: "基本資訊",
    control: "textarea",
  })
  description: string = "";

  @iField.string({
    caption: "封面圖片 URL",
    order: 5,
    group: "基本資訊",
  })
  imageUrl: string = "";

  @iField.number({
    caption: "排列順序",
    order: 6,
    group: "基本資訊",
    defaultValue: 0,
  })
  sortOrder: number = 0;

  @iField.boolean({
    caption: "啟用",
    order: 7,
    group: "基本資訊",
    defaultValue: true,
  })
  isActive: boolean = true;

  @iField.string({
    caption: "SEO 標題",
    order: 1,
    group: "SEO",
  })
  seoTitle: string = "";

  @iField.string({
    caption: "SEO 描述",
    order: 2,
    group: "SEO",
    control: "textarea",
  })
  seoDescription: string = "";

  @iField.string({
    caption: "SEO 關鍵字",
    order: 3,
    group: "SEO",
  })
  seoKeywords: string = "";
}

@iController(ProductCategory)
class ProductCategoryController {
  @iAction({
    caption: "停用分類",
    allowedRoles: ["admin", "manager"],
    confirm: "確定要停用此分類嗎？",
  })
  async deactivate(record: ProductCategory) {
    record.isActive = false;
    return record;
  }

  @iAction({
    caption: "啟用分類",
    allowedRoles: ["admin", "manager"],
  })
  async activate(record: ProductCategory) {
    record.isActive = true;
    return record;
  }
}
