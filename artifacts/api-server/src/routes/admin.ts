import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  if (!admin) {
    // constant-time comparison even when user not found
    await bcrypt.compare(password, "$2a$12$invalidhashfortimingprotection0000000000000000000000000");
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  (req.session as any).admin = { username: admin.username, isAdmin: true };
  res.json({ username: admin.username, isAdmin: true });
});

router.post("/admin/logout", requireAdmin, async (req, res): Promise<void> => {
  req.session?.destroy(() => {});
  res.json({ ok: true });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  const admin = (req.session as any)?.admin;
  if (!admin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(admin);
});

router.post("/admin/change-password", requireAdmin, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }
  const username = (req.session as any).admin.username;
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  if (!admin) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }
  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(adminsTable).set({ passwordHash: newHash }).where(eq(adminsTable.username, username));
  res.json({ ok: true });
});

export default router;
