import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, adminsTable, passwordResetOtpsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../middleware/requireAdmin";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();

// ─── Login / Session ─────────────────────────────────────────────────────────

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  if (!admin) {
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

// ─── Admin Profile (email) ────────────────────────────────────────────────────

router.get("/admin/profile", requireAdmin, async (req, res): Promise<void> => {
  const username = (req.session as any).admin.username;
  const [admin] = await db.select({ username: adminsTable.username, email: adminsTable.email })
    .from(adminsTable).where(eq(adminsTable.username, username));
  if (!admin) { res.status(404).json({ error: "Admin not found" }); return; }
  res.json(admin);
});

router.patch("/admin/profile", requireAdmin, async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const username = (req.session as any).admin.username;
  await db.update(adminsTable).set({ email: email.toLowerCase().trim() }).where(eq(adminsTable.username, username));
  res.json({ ok: true });
});

// ─── Change Password (requires login) ────────────────────────────────────────

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

// ─── Forgot Password OTP Flow (public) ───────────────────────────────────────

function generateOtp(): string {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/admin/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Look up admin by email
  const [admin] = await db.select()
    .from(adminsTable)
    .where(eq(adminsTable.email, normalizedEmail));

  // Always respond with same message to prevent email enumeration
  const genericResponse = { ok: true, message: "If that email is registered, an OTP has been sent." };

  if (!admin) {
    // Timing-safe: still do some work
    await bcrypt.hash("dummy", 4);
    res.json(genericResponse);
    return;
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing unused OTPs for this email
  await db.delete(passwordResetOtpsTable).where(eq(passwordResetOtpsTable.email, normalizedEmail));

  // Store new OTP
  await db.insert(passwordResetOtpsTable).values({
    email: normalizedEmail,
    otpHash,
    expiresAt,
  });

  // Send email via Resend
  try {
    const connectors = new ReplitConnectors();
    const emailRes = await connectors.proxy("resend", "/emails", {
      method: "POST",
      body: JSON.stringify({
        from: "Jabeen Jewels Admin <onboarding@resend.dev>",
        to: [normalizedEmail],
        subject: "Your Jabeen Jewels password reset OTP",
        html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff;">
            <h2 style="font-size: 22px; color: #1a1a1a; margin-bottom: 8px;">Password Reset</h2>
            <p style="color: #555; margin-bottom: 24px;">Use the code below to reset your Jabeen Jewels admin password. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: #f8f4f0; border: 1px solid #e0d9d1; border-radius: 8px; padding: 24px; text-align: center; letter-spacing: 8px; font-size: 36px; font-weight: bold; color: #8b5e3c;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 24px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text().catch(() => "unknown");
      console.error("Resend error:", errBody);
      // Clean up OTP record if email failed
      await db.delete(passwordResetOtpsTable).where(eq(passwordResetOtpsTable.email, normalizedEmail));
      res.status(500).json({ error: "Failed to send OTP email. Please try again." });
      return;
    }
  } catch (err) {
    console.error("Email send failed:", err);
    await db.delete(passwordResetOtpsTable).where(eq(passwordResetOtpsTable.email, normalizedEmail));
    res.status(500).json({ error: "Failed to send OTP email. Please try again." });
    return;
  }

  res.json(genericResponse);
});

router.post("/admin/verify-otp", async (req, res): Promise<void> => {
  const { email, otp } = req.body ?? {};
  if (!email || !otp) {
    res.status(400).json({ error: "email and otp are required" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  const [record] = await db.select()
    .from(passwordResetOtpsTable)
    .where(and(
      eq(passwordResetOtpsTable.email, normalizedEmail),
      eq(passwordResetOtpsTable.used, false),
      gt(passwordResetOtpsTable.expiresAt, now),
    ));

  if (!record) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  const valid = await bcrypt.compare(String(otp), record.otpHash);
  if (!valid) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  // Mark OTP as used
  await db.update(passwordResetOtpsTable)
    .set({ used: true })
    .where(eq(passwordResetOtpsTable.id, record.id));

  // Store verified state in session so reset-password can use it
  (req.session as any).passwordReset = { email: normalizedEmail, verifiedAt: now.toISOString() };

  res.json({ ok: true });
});

router.post("/admin/reset-password", async (req, res): Promise<void> => {
  const passwordReset = (req.session as any)?.passwordReset;
  if (!passwordReset?.email) {
    res.status(401).json({ error: "OTP not verified. Please start over." });
    return;
  }

  // Ensure the verification is not older than 15 minutes
  const verifiedAt = new Date(passwordReset.verifiedAt);
  if (Date.now() - verifiedAt.getTime() > 15 * 60 * 1000) {
    delete (req.session as any).passwordReset;
    res.status(401).json({ error: "Session expired. Please start over." });
    return;
  }

  const { newPassword } = req.body ?? {};
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }

  const [admin] = await db.select()
    .from(adminsTable)
    .where(eq(adminsTable.email, passwordReset.email));

  if (!admin) {
    res.status(404).json({ error: "Admin not found." });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(adminsTable).set({ passwordHash: newHash }).where(eq(adminsTable.id, admin.id));

  // Clear the password reset session state
  delete (req.session as any).passwordReset;

  res.json({ ok: true });
});

export default router;
