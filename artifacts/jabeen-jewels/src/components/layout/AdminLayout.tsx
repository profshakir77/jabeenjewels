import { Link, useLocation } from "wouter";
import { useAdminLogout } from "@workspace/api-client-react";
import { LayoutDashboard, ShoppingBag, FolderTree, Package, Image as ImageIcon, LogOut, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const logout = useAdminLogout();
  const { toast } = useToast();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Logged out successfully" });
        setLocation("/admin/login");
      }
    });
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "Change Password", href: "/admin/change-password", icon: KeyRound },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex-shrink-0 md:h-[100dvh] sticky top-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/admin" className="font-serif font-bold text-xl flex items-center gap-2">
            <span className="bg-primary text-primary-foreground h-8 w-8 rounded flex items-center justify-center text-sm">JJ</span>
            Admin Panel
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/admin");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-muted/20">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
