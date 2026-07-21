import { Router, type IRouter } from "express";
import { eq, desc, sql, getTableColumns } from "drizzle-orm";
import { db, productsTable, categoriesTable, ordersTable, bannersTable } from "@workspace/db";

const router: IRouter = Router();

const productCols = getTableColumns(productsTable);

type ProductRow = typeof productsTable.$inferSelect & { categoryName: string | null };

function formatProduct(p: ProductRow) {
  return {
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    categoryName: p.categoryName ?? "",
    images: p.images ?? [],
    tags: p.tags ?? [],
    createdAt: p.createdAt?.toISOString(),
  };
}

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    subtotal: Number(o.subtotal),
    shippingFee: Number(o.shippingFee),
    total: Number(o.total),
    createdAt: o.createdAt?.toISOString(),
    items: (o.items as unknown[]) ?? [],
  };
}

router.get("/store/homepage", async (_req, res): Promise<void> => {
  const [banners, featuredRaw, newArrivalsRaw, saleRaw, catsRaw] = await Promise.all([
    db.select().from(bannersTable).where(eq(bannersTable.isActive, true)).orderBy(bannersTable.sortOrder),
    db.select({ ...productCols, categoryName: categoriesTable.name }).from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.isFeatured, true)).orderBy(desc(productsTable.createdAt)).limit(12),
    db.select({ ...productCols, categoryName: categoriesTable.name }).from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.isNewArrival, true)).orderBy(desc(productsTable.createdAt)).limit(8),
    db.select({ ...productCols, categoryName: categoriesTable.name }).from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.isOnSale, true)).orderBy(desc(productsTable.createdAt)).limit(8),
    db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder),
  ]);

  const counts = await db
    .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)::int` })
    .from(productsTable)
    .groupBy(productsTable.categoryId);
  const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));

  res.json({
    banners,
    featuredProducts: featuredRaw.map(formatProduct),
    newArrivals: newArrivalsRaw.map(formatProduct),
    saleProducts: saleRaw.map(formatProduct),
    categories: catsRaw.map((c) => ({ ...c, productCount: countMap.get(c.id) ?? 0 })),
  });
});

router.get("/store/stats", async (_req, res): Promise<void> => {
  const [[totProds], [totOrders], [totCats], [pendOrders], [revRow], recentOrders] = await Promise.all([
    db.select({ totalProducts: sql<number>`count(*)::int` }).from(productsTable),
    db.select({ totalOrders: sql<number>`count(*)::int` }).from(ordersTable),
    db.select({ totalCategories: sql<number>`count(*)::int` }).from(categoriesTable),
    db.select({ pendingOrders: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.status, "pending")),
    db.select({ totalRevenue: sql<number>`COALESCE(SUM(total::numeric), 0)::float` }).from(ordersTable).where(eq(ordersTable.status, "delivered")),
    db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10),
  ]);

  res.json({
    totalProducts: totProds?.totalProducts ?? 0,
    totalOrders: totOrders?.totalOrders ?? 0,
    totalCategories: totCats?.totalCategories ?? 0,
    pendingOrders: pendOrders?.pendingOrders ?? 0,
    totalRevenue: revRow?.totalRevenue ?? 0,
    recentOrders: recentOrders.map(formatOrder),
  });
});

export default router;
