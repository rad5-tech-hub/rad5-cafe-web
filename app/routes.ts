import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("dashboard", "routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("setup-pin", "routes/setup-pin.tsx"),
  route("cafe", "routes/cafe.tsx"),
  route("profile", "routes/profile.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/products/add", "routes/add-product.tsx"),
  route("admin/users", "routes/users.tsx"),
  route("admin/audit-logs", "routes/audit-logs.tsx"),
  route("inventory", "routes/inventory.tsx"),
  route("analytics", "routes/analytics.tsx"),
  route("sales", "routes/sales.tsx"),
  route("reports", "routes/reports.tsx"),
  route("admin/updates", "routes/updates.tsx"),
  route("history", "routes/history.tsx"),
  route("notifications", "routes/notifications.tsx"),
  route("admin/cash-orders", "routes/cash-orders.tsx"),
] satisfies RouteConfig;
