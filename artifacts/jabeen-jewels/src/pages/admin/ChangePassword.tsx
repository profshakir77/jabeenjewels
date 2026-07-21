import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";

export default function ChangePassword() {
  useEffect(() => {
    document.title = "Change Password | Admin | Jabeen Jewels";
  }, []);

  const { toast } = useToast();

  // ── Change password state ──
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // ── Recovery email state ──
  const [emailLoading, setEmailLoading] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [emailFetched, setEmailFetched] = useState(false);

  // Fetch current recovery email on mount
  useEffect(() => {
    fetch("/api/admin/profile", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setSavedEmail(data.email ?? null);
        setRecoveryEmail(data.email ?? "");
        setEmailFetched(true);
      })
      .catch(() => setEmailFetched(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (form.newPassword.length < 8) {
      toast({ title: "New password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to change password", variant: "destructive" });
      } else {
        toast({ title: "Password changed successfully" });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to save email", variant: "destructive" });
      } else {
        setSavedEmail(recoveryEmail);
        toast({ title: "Recovery email saved" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-md space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <KeyRound className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-serif font-bold">Security</h1>
        </div>

        {/* Recovery Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Recovery Email
            </CardTitle>
            <CardDescription>
              Used to receive a one-time code when you forget your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailFetched ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <form onSubmit={handleSaveEmail} className="space-y-3">
                {savedEmail && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Currently set to <strong>{savedEmail}</strong></span>
                  </div>
                )}
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={emailLoading || recoveryEmail === savedEmail}
                >
                  {emailLoading ? "Saving…" : savedEmail ? "Update Email" : "Save Email"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Choose a strong password with at least 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={form.newPassword}
                    onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
