import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Shop() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category");
  
  useEffect(() => {
    document.title = "Shop Collection | Jabeen Jewels";
  }, []);

  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategory ? parseInt(initialCategory) : undefined
  );
  const [sort, setSort] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [debouncedPrice, setDebouncedPrice] = useState<[number, number]>([0, 200000]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrice(priceRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange]);

  const { data: categories } = useListCategories();
  
  const { data: productsData, isLoading } = useListProducts({
    categoryId: categoryId || undefined,
    sort: sort as any,
    minPrice: debouncedPrice[0] > 0 ? debouncedPrice[0] : undefined,
    maxPrice: debouncedPrice[1] < 200000 ? debouncedPrice[1] : undefined,
    limit: 50,
  });

  const handleClearFilters = () => {
    setCategoryId(undefined);
    setSort("newest");
    setPriceRange([0, 200000]);
  };

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif text-lg font-medium mb-4">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => setCategoryId(undefined)}
            className={`block w-full text-left text-sm py-1 transition-colors ${!categoryId ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            All Products
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`block w-full text-left text-sm py-1 transition-colors ${categoryId === cat.id ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg font-medium mb-4">Price Range</h3>
        <Slider
          min={0}
          max={200000}
          step={1000}
          value={[priceRange[0], priceRange[1]]}
          onValueChange={(val: [number, number]) => setPriceRange(val)}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Rs. {priceRange[0].toLocaleString()}</span>
          <span>Rs. {priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <Button variant="outline" className="w-full rounded-none" onClick={handleClearFilters}>
        <X className="mr-2 h-4 w-4" /> Clear Filters
      </Button>
    </div>
  );

  return (
    <CustomerLayout>
      <div className="bg-muted/50 py-12 mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl mb-4">Our Collection</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover pieces that elevate your everyday style and make special occasions unforgettable.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-24">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-28">
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden rounded-none">
                      <Filter className="mr-2 h-4 w-4" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px]">
                    <SheetHeader className="mb-8 border-b pb-4 text-left">
                      <SheetTitle className="font-serif">Filter Products</SheetTitle>
                    </SheetHeader>
                    <FilterContent />
                  </SheetContent>
                </Sheet>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  {productsData?.total || 0} products found
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">Sort by:</span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[160px] rounded-none">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="bg-muted aspect-square rounded-lg" />
                    <div className="h-4 bg-muted w-2/3 mx-auto" />
                    <div className="h-4 bg-muted w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : productsData?.products.length === 0 ? (
              <div className="text-center py-24 space-y-4 border border-dashed border-border rounded-lg bg-muted/10">
                <h3 className="font-serif text-2xl text-muted-foreground">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                <Button variant="outline" onClick={handleClearFilters} className="rounded-none mt-4">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                {productsData?.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </CustomerLayout>
  );
}
