import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import {
  CreateBannerBody,
  UpdateBannerBody,
  UpdateBannerParams,
  DeleteBannerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const rows = await db.select().from(bannersTable).where(eq(bannersTable.isActive, true)).orderBy(asc(bannersTable.sortOrder));
  res.json(rows);
});

router.post("/banners", async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [banner] = await db.insert(bannersTable).values(parsed.data).returning();
  res.status(201).json(banner);
});

router.put("/banners/:id", async (req, res): Promise<void> => {
  const params = UpdateBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [banner] = await db
    .update(bannersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(bannersTable.id, params.data.id))
    .returning();
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  res.json(banner);
});

router.delete("/banners/:id", async (req, res): Promise<void> => {
  const params = DeleteBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(bannersTable).where(eq(bannersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
