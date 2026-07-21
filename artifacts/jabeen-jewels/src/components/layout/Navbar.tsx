import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { ShoppingBag, Menu, Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useListCategories } from "@workspace/api-client-react";
import { useState } from "react";

export function Navbar() {
  const { itemCount } = useCart();
  const [location, setLocation] = useLocation();
  const { data: categories } = useListCategories();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-center text-xs sm:text-sm font-medium tracking-wide">
        Free Delivery on orders above Rs. 5,000 - Order via WhatsApp 03338479799
      </div>

      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-6 mt-8">
              <Link href="/" className="text-lg font-medium hover:text-primary transition-colors">Home</Link>
              <Link href="/shop" className="text-lg font-medium hover:text-primary transition-colors">All Jewelry</Link>
              <div className="space-y-3">
                <h4 className="font-serif text-muted-foreground text-sm uppercase tracking-wider">Categories</h4>
                {categories?.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`} className="block text-lg hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Jabeen Jewels Logo" 
              className="h-12 w-12 object-contain rounded-full border border-primary/20 p-1"
            />
            <span className="font-serif text-2xl tracking-tight font-bold hidden sm:inline-block">Jabeen Jewels</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors tracking-wide">Home</Link>
          <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors tracking-wide">Shop All</Link>
          {categories?.slice(0, 4).map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="text-sm font-medium hover:text-primary transition-colors tracking-wide">
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-4 flex-1 lg:flex-none justify-end">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center absolute right-16 sm:relative sm:right-auto bg-background animate-in fade-in zoom-in w-[200px] sm:w-[250px]">
              <input 
                type="search"
                placeholder="Search jewelry..." 
                className="w-full bg-muted/50 border border-border rounded-l-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onBlur={(e) => {
                  // Small delay to allow click on submit button
                  setTimeout(() => {
                    if (!searchQuery) setSearchOpen(false);
                  }, 200);
                }}
              />
              <Button type="submit" size="icon" variant="default" className="rounded-l-none h-[34px] w-[34px]">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
