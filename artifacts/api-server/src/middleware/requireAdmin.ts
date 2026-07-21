import { type Request, type Response, type NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const admin = (req.session as any)?.admin;
  if (!admin?.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
