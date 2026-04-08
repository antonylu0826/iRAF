import { defineModule } from "@iraf/core"
import { ProductCategory } from "./entities/ProductCategory"
import { Product } from "./entities/Product"

export const ProductModule = defineModule({
  key: "product",
  caption: "Product",
  icon: "Package",
  description: "Product management module including categories and products",
  entities: [Product, ProductCategory],
  menu: [
    {
      type: "entity",
      entity: Product,
      caption: "Products",
    },
    {
      type: "entity",
      entity: ProductCategory,
      caption: "Categories",
    },
  ],
})
