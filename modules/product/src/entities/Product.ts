import { BaseObject, iEntity, iField, iController, iAction } from "@iraf/core";

@iEntity("product", {
  caption: "產品",
  icon: "box",
  allowedRoles: ["admin", "manager", "staff"],
})
export class Product extends BaseObject {
  // ── 基本資訊 ──────────────────────────────────────
  @iField.string({
    caption: "產品名稱",
    required: true,
    order: 1,
    group: "基本資訊",
  })
  name: string = "";

  @iField.string({
    caption: "產品編號 (SKU)",
    required: true,
    order: 2,
    group: "基本資訊",
    validate: (val) => val.length >= 3 || "SKU 至少需要 3 個字元",
  })
  sku: string = "";

  @iField.string({
    caption: "條碼 (Barcode)",
    order: 3,
    group: "基本資訊",
  })
  barcode: string = "";

  @iField.string({
    caption: "產品分類",
    required: true,
    order: 4,
    group: "基本資訊",
    control: "ref",
    refEntity: "product-category",
  })
  categoryId: string = "";

  @iField.string({
    caption: "品牌",
    order: 5,
    group: "基本資訊",
  })
  brand: string = "";

  @iField.string({
    caption: "產品狀態",
    order: 6,
    group: "基本資訊",
    control: "options",
    options: [
      { label: "草稿", value: "draft" },
      { label: "上架中", value: "active" },
      { label: "已下架", value: "inactive" },
      { label: "缺貨", value: "out_of_stock" },
      { label: "停產", value: "discontinued" },
    ],
    defaultValue: "draft",
  })
  status: string = "draft";

  @iField.string({
    caption: "簡短描述",
    order: 7,
    group: "基本資訊",
    control: "textarea",
  })
  shortDescription: string = "";

  @iField.string({
    caption: "詳細描述",
    order: 8,
    group: "基本資訊",
    control: "textarea",
  })
  description: string = "";

  // ── 價格 ──────────────────────────────────────────
  @iField.number({
    caption: "售價",
    required: true,
    order: 1,
    group: "價格",
    validate: (val) => val >= 0 || "售價不能為負數",
  })
  price: number = 0;

  @iField.number({
    caption: "原價 / 市場價",
    order: 2,
    group: "價格",
  })
  originalPrice: number = 0;

  @iField.number({
    caption: "成本價",
    order: 3,
    group: "價格",
    writeRoles: ["admin", "manager"],
  })
  costPrice: number = 0;

  @iField.string({
    caption: "幣別",
    order: 4,
    group: "價格",
    control: "options",
    options: [
      { label: "新台幣 (TWD)", value: "TWD" },
      { label: "美元 (USD)", value: "USD" },
      { label: "日圓 (JPY)", value: "JPY" },
      { label: "人民幣 (CNY)", value: "CNY" },
    ],
    defaultValue: "TWD",
  })
  currency: string = "TWD";

  @iField.number({
    caption: "稅率 (%)",
    order: 5,
    group: "價格",
    defaultValue: 5,
  })
  taxRate: number = 5;

  // ── 庫存 ──────────────────────────────────────────
  @iField.number({
    caption: "庫存數量",
    order: 1,
    group: "庫存",
    defaultValue: 0,
  })
  stockQuantity: number = 0;

  @iField.number({
    caption: "安全庫存量",
    order: 2,
    group: "庫存",
    defaultValue: 0,
  })
  safetyStock: number = 0;

  @iField.number({
    caption: "最低訂購量 (MOQ)",
    order: 3,
    group: "庫存",
    defaultValue: 1,
  })
  minimumOrderQuantity: number = 1;

  @iField.string({
    caption: "庫存單位",
    order: 4,
    group: "庫存",
    control: "options",
    options: [
      { label: "個", value: "pcs" },
      { label: "箱", value: "box" },
      { label: "公斤", value: "kg" },
      { label: "公升", value: "liter" },
      { label: "公尺", value: "meter" },
    ],
    defaultValue: "pcs",
  })
  stockUnit: string = "pcs";

  @iField.boolean({
    caption: "追蹤庫存",
    order: 5,
    group: "庫存",
    defaultValue: true,
  })
  trackInventory: boolean = true;

  @iField.boolean({
    caption: "允許負庫存",
    order: 6,
    group: "庫存",
    defaultValue: false,
  })
  allowBackorder: boolean = false;

  // ── 規格 ──────────────────────────────────────────
  @iField.number({
    caption: "重量 (kg)",
    order: 1,
    group: "規格",
  })
  weight: number = 0;

  @iField.number({
    caption: "長度 (cm)",
    order: 2,
    group: "規格",
  })
  length: number = 0;

  @iField.number({
    caption: "寬度 (cm)",
    order: 3,
    group: "規格",
  })
  width: number = 0;

  @iField.number({
    caption: "高度 (cm)",
    order: 4,
    group: "規格",
  })
  height: number = 0;

  @iField.string({
    caption: "材質",
    order: 5,
    group: "規格",
  })
  material: string = "";

  @iField.string({
    caption: "顏色",
    order: 6,
    group: "規格",
  })
  color: string = "";

  @iField.string({
    caption: "尺寸",
    order: 7,
    group: "規格",
  })
  size: string = "";

  @iField.json({
    caption: "自訂規格屬性",
    order: 8,
    group: "規格",
  })
  customAttributes: Record<string, any> = {};

  // ── 媒體 ──────────────────────────────────────────
  @iField.string({
    caption: "主圖 URL",
    order: 1,
    group: "媒體",
  })
  mainImageUrl: string = "";

  @iField.json({
    caption: "圖片集",
    order: 2,
    group: "媒體",
  })
  imageGallery: string[] = [];

  @iField.string({
    caption: "影片 URL",
    order: 3,
    group: "媒體",
  })
  videoUrl: string = "";

  // ── SEO ───────────────────────────────────────────
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

  @iField.string({
    caption: "網址 Slug",
    order: 4,
    group: "SEO",
    validate: (val) => !val || /^[a-z0-9-]+$/.test(val) || "Slug 只能包含小寫字母、數字和連字號",
  })
  slug: string = "";

  // ── 其他 ──────────────────────────────────────────
  @iField.boolean({
    caption: "精選產品",
    order: 1,
    group: "其他",
    defaultValue: false,
  })
  isFeatured: boolean = false;

  @iField.boolean({
    caption: "新品",
    order: 2,
    group: "其他",
    defaultValue: false,
  })
  isNew: boolean = false;

  @iField.date({
    caption: "上架日期",
    order: 3,
    group: "其他",
  })
  publishedAt: Date | null = null;

  @iField.date({
    caption: "下架日期",
    order: 4,
    group: "其他",
  })
  unpublishedAt: Date | null = null;

  @iField.string({
    caption: "供應商",
    order: 5,
    group: "其他",
  })
  supplier: string = "";

  @iField.string({
    caption: "產地",
    order: 6,
    group: "其他",
  })
  origin: string = "";

  @iField.string({
    caption: "保固期",
    order: 7,
    group: "其他",
  })
  warrantyPeriod: string = "";

  @iField.string({
    caption: "備註",
    order: 8,
    group: "其他",
    control: "textarea",
    writeRoles: ["admin", "manager"],
  })
  notes: string = "";
}

@iController(Product)
class ProductController {
  @iAction({
    caption: "上架產品",
    allowedRoles: ["admin", "manager"],
    confirm: "確定要上架此產品嗎？",
  })
  async publish(record: Product) {
    record.status = "active";
    record.publishedAt = new Date();
    return record;
  }

  @iAction({
    caption: "下架產品",
    allowedRoles: ["admin", "manager"],
    confirm: "確定要下架此產品嗎？",
  })
  async unpublish(record: Product) {
    record.status = "inactive";
    record.unpublishedAt = new Date();
    return record;
  }

  @iAction({
    caption: "標記為精選",
    allowedRoles: ["admin", "manager"],
  })
  async markFeatured(record: Product) {
    record.isFeatured = true;
    return record;
  }

  @iAction({
    caption: "標記缺貨",
    allowedRoles: ["admin", "manager"],
    confirm: "確定要將此產品標記為缺貨嗎？",
  })
  async markOutOfStock(record: Product) {
    record.status = "out_of_stock";
    record.stockQuantity = 0;
    return record;
  }
}
