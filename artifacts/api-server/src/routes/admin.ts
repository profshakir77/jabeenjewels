import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "node:crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + process.env.SESSION_SECRET).digest("hex");
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  if (!admin || admin.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  (req.session as any).admin = { username: admin.username, isAdmin: true };
  res.json({ username: admin.username, isAdmin: true });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
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

export default router;
