export const dictionary = {
  en: {
    dashboard: "Dashboard",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    theme: "Theme",
    apps: "Apps",
    storefront: "Storefront",
    cart: "Cart",
    checkout: "Checkout",
  },
  zh: {
    dashboard: "仪表盘",
    orders: "订单",
    products: "商品",
    customers: "客户",
    theme: "主题",
    apps: "应用",
    storefront: "独立站",
    cart: "购物车",
    checkout: "结账",
  },
} as const;

export type Locale = keyof typeof dictionary;
