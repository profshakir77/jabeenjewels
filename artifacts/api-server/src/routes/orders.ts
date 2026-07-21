import { Router, type IRouter } from "express";
import { eq, desc, type SQL } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  ListOrdersQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

const FREE_DELIVERY_THRESHOLD = 5000;
const SHIPPING_FEE = 200;

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    subtotal: Number(o.subtotal),
    shippingFee: Number(o.shippingFee),
    total: Number(o.total),
    createdAt: o.createdAt?.toISOString(),
    items: (o.items as any) ?? [],
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { status, page = 1, limit = 20 } = query.data;
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));

  const rows = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  res.json(rows.map(formatOrder));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { items, customerName, customerPhone, customerEmail, customerAddress, customerCity, notes } = parsed.data;

  // Build enriched items
  const enrichedItems: Array<{ productId: number; productName: string; productImage: string; quantity: number; price: number }> = [];
  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    enrichedItems.push({
      productId: item.productId,
      productName: product?.name ?? "Unknown",
      productImage: product?.images?.[0] ?? "",
      quantity: item.quantity,
      price: item.price,
    });
  }

  const subtotal = enrichedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const [order] = await db.insert(ordersTable).values({
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    customerCity,
    notes,
    items: enrichedItems as any,
    subtotal: String(subtotal),
    shippingFee: String(shippingFee),
    total: String(total),
    status: "pending",
  }).returning();

  res.status(201).json(formatOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(formatOrder(order));
});

router.patch("/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(formatOrder(order));
});

export default router;
