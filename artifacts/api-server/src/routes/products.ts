import { Router, type IRouter } from "express";
import { eq, like, and, gte, lte, desc, asc, sql, getTableColumns, type SQL } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
  GetProductsByCategoryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

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

async function selectProductsWithCategory(extra?: SQL) {
  return db
    .select({ ...productCols, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(extra);
}

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await selectProductsWithCategory(eq(productsTable.isFeatured, true));
  const sorted = rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).slice(0, 12);
  res.json(sorted.map(formatProduct));
});

router.get("/products/new-arrivals", async (_req, res): Promise<void> => {
  const rows = await selectProductsWithCategory(eq(productsTable.isNewArrival, true));
  const sorted = rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).slice(0, 12);
  res.json(sorted.map(formatProduct));
});

router.get("/products/on-sale", async (_req, res): Promise<void> => {
  const rows = await selectProductsWithCategory(eq(productsTable.isOnSale, true));
  const sorted = rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).slice(0, 12);
  res.json(sorted.map(formatProduct));
});

router.get("/products/by-category/:categoryId", async (req, res): Promise<void> => {
  const params = GetProductsByCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await selectProductsWithCategory(eq(productsTable.categoryId, params.data.categoryId));
  const sorted = rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  res.json(sorted.map(formatProduct));
});

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { categoryId, search, featured, onSale, newArrival, minPrice, maxPrice, sort, page = 1, limit = 20 } = query.data;

  const conditions: SQL[] = [];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (search) conditions.push(like(productsTable.name, `%${search}%`));
  if (featured) conditions.push(eq(productsTable.isFeatured, true));
  if (onSale) conditions.push(eq(productsTable.isOnSale, true));
  if (newArrival) conditions.push(eq(productsTable.isNewArrival, true));
  if (minPrice != null) conditions.push(gte(sql`${productsTable.price}::numeric`, minPrice));
  if (maxPrice != null) conditions.push(lte(sql`${productsTable.price}::numeric`, maxPrice));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let orderByCol: SQL;
  if (sort === "price_asc") orderByCol = asc(productsTable.price) as unknown as SQL;
  else if (sort === "price_desc") orderByCol = desc(productsTable.price) as unknown as SQL;
  else orderByCol = desc(productsTable.createdAt) as unknown as SQL;

  const offset = ((page ?? 1) - 1) * (limit ?? 20);
  const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where);
  const rows = await db
    .select({ ...productCols, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(where)
    .orderBy(orderByCol)
    .limit(limit ?? 20)
    .offset(offset);

  res.json({ products: rows.map(formatProduct), total: countRow?.count ?? 0, page, limit });
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    price: String(parsed.data.price),
    salePrice: parsed.data.salePrice != null ? String(parsed.data.salePrice) : null,
  };
  const [product] = await db.insert(productsTable).values(data).returning();
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  res.status(201).json(formatProduct({ ...product, categoryName: cat?.name ?? "" }));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ ...productCols, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(row));
});

router.put("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    price: String(parsed.data.price),
    salePrice: parsed.data.salePrice != null ? String(parsed.data.salePrice) : null,
    updatedAt: new Date(),
  };
  const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  res.json(formatProduct({ ...product, categoryName: cat?.name ?? "" }));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
