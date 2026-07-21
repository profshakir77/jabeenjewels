import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get("q") || "";
  const [location, setLocation] = useLocation();

  useEffect(() => {
    document.title = q ? `Search: ${q} | Jabeen Jewels` : "Search | Jabeen Jewels";
  }, [q]);

  const { data: productsData, isLoading } = useListProducts({
    search: q,
    limit: 50,
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString();
    if (query) {
      setLocation(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <CustomerLayout>
      <div className="bg-muted/30 py-12 mb-8 border-b border-border">
        <div className="container mx-auto px-4 max-w-2xl text-center space-y-6">
          <h1 className="font-serif text-3xl sm:text-4xl">Search Our Collection</h1>
          <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              name="q"
              defaultValue={q}
              placeholder="Search for rings, necklaces, kundans..." 
              className="pl-12 h-14 rounded-none text-base bg-background"
            />
          </form>
          {q && (
            <p className="text-sm text-muted-foreground">
              Showing results for <span className="font-semibold text-foreground">"{q}"</span>
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="bg-muted aspect-square rounded-lg" />
                <div className="h-4 bg-muted w-2/3 mx-auto" />
                <div className="h-4 bg-muted w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : !q ? (
          <div className="text-center py-24 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
            Enter a search term above to find jewelry.
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-24 space-y-4 border border-dashed border-border rounded-lg bg-muted/10">
            <h3 className="font-serif text-2xl text-muted-foreground">No matches found</h3>
            <p className="text-muted-foreground">We couldn't find anything matching "{q}". Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {productsData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
