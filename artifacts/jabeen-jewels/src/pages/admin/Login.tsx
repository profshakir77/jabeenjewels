import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useGetAdminMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp, ArrowLeft, Eye, EyeOff, Mail, KeyRound, CheckCircle2 } from "lucide-react";

type ForgotStep = "idle" | "email" | "otp" | "reset" | "done";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("idle");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: isCheckingAuth, isError } = useGetAdminMe({
    query: { retry: false, staleTime: 0 }
  });

  const redirected = useRef(false);

  useEffect(() => {
    document.title = "Admin Login | Jabeen Jewels";
    if (!isCheckingAuth && !isError && user && !redirected.current) {
      redirected.current = true;
      setLocation("/admin");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingAuth, isError, user]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const login = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: () => {
          toast({ title: "Welcome back", description: "Successfully logged in." });
          setLocation("/admin");
        },
        onError: () => {
          toast({
            title: "Login Failed",
            description: "Invalid credentials.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleToggleForgot = () => {
    setShowForgot(v => !v);
    if (!showForgot) {
      // Reset state when opening
      setForgotStep("email");
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to send OTP", variant: "destructive" });
        return;
      }
      setForgotStep("otp");
      setResendCooldown(60);
      toast({ title: "OTP sent", description: "Check your email for the 6-digit code." });
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to resend OTP", variant: "destructive" });
        return;
      }
      setResendCooldown(60);
      toast({ title: "New OTP sent", description: "Check your email for the new 6-digit code." });
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Enter the 6-digit code from your email.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Invalid OTP", variant: "destructive" });
        return;
      }
      setForgotStep("reset");
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to reset password", variant: "destructive" });
        if (data.error?.includes("start over")) {
          setForgotStep("email");
          setOtp("");
        }
        return;
      }
      setForgotStep("done");
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <span className="font-serif font-bold text-xl">JJ</span>
          </div>
          <h1 className="font-serif text-2xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Log in to manage your store</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-4"
            disabled={login.isPending}
          >
            {login.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Login
          </Button>
        </form>

        {/* ── Forgot Password ── */}
        <div className="mt-6 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleToggleForgot}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-full justify-center transition-colors"
          >
            Forgot password?
            {showForgot ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showForgot && (
            <div className="mt-4 rounded-lg border border-border overflow-hidden">

              {/* Step 1 — Email */}
              {forgotStep === "email" && (
                <form onSubmit={handleSendOtp} className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                    <Mail className="h-4 w-4 text-primary" />
                    Enter your recovery email
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send a 6-digit code to your registered email address.
                  </p>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send OTP
                  </Button>
                </form>
              )}

              {/* Step 2 — OTP */}
              {forgotStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setForgotStep("email")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Enter the 6-digit code
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sent to <span className="font-medium text-foreground">{forgotEmail}</span>. Valid for 10 minutes.
                  </p>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                  <Button type="submit" className="w-full" disabled={forgotLoading || otp.length !== 6}>
                    {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verify Code
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || forgotLoading}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3 — New Password */}
              {forgotStep === "reset" && (
                <form onSubmit={handleResetPassword} className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Set a new password
                  </div>
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      placeholder="New password (min 8 chars)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Input
                    type={showNewPw ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Reset Password
                  </Button>
                </form>
              )}

              {/* Done */}
              {forgotStep === "done" && (
                <div className="p-6 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                  <p className="font-medium text-foreground">Password reset successfully!</p>
                  <p className="text-sm text-muted-foreground">You can now log in with your new password.</p>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => { setShowForgot(false); setForgotStep("idle"); }}
                  >
                    Back to Login
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
