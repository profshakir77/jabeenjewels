import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useGetAdminMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp, Terminal } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user, isLoading: isCheckingAuth } = useGetAdminMe({
    query: { retry: false }
  });

  useEffect(() => {
    document.title = "Admin Login | Jabeen Jewels";
    if (user) {
      setLocation("/admin");
    }
  }, [user, setLocation]);

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

        <div className="mt-6 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowForgot(!showForgot)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-full justify-center transition-colors"
          >
            Forgot password?
            {showForgot ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showForgot && (
            <div className="mt-3 rounded-lg bg-muted/60 border border-border p-4 text-sm space-y-2">
              <p className="text-muted-foreground">
                Open the <strong>Shell</strong> tab in Replit and run:
              </p>
              <div className="flex items-start gap-2 bg-background rounded-md border border-border px-3 py-2 font-mono text-xs break-all">
                <Terminal className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>node scripts/reset-admin-password.mjs admin <em>NewPassword</em></span>
              </div>
              <p className="text-muted-foreground text-xs">
                Replace <em>NewPassword</em> with your new password (min 8 characters).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
