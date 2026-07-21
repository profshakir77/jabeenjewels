import { useEffect } from "react";
import { useParams } from "wouter";
import { useGetCategory } from "@workspace/api-client-react";
import Shop from "./Shop";
import { CustomerLayout } from "@/components/layout/CustomerLayout";

// Wrapper that simply redirects the visual rendering to Shop but forces the category filter
export default function CategoryPage() {
  const { slug } = useParams();
  
  // We can fetch category to show its name in title
  // But wait, the Shop page handles filtering by ID. We need the ID from slug or let Shop handle it.
  // Actually, our API takes categoryId for filtering, not slug.
  // The Shop page code I wrote uses URL ?category=ID. 
  // Let me modify this to pass the category ID by first looking up the category.

  // Wait, I don't have a direct getCategoryBySlug hook. I'll just redirect to /shop if we can't find it, or list all categories to find the ID.
  
  // Actually, we'll just redirect to the Shop page with the appropriate ID if we know it.
  // Since we want this to be seamless, let's fetch listCategories, find by slug, and render Shop component with that ID.
  // Wait, let's just make a dedicated layout for Category for better SEO.
  return <CategoryContent slug={slug!} />;
}

import { useListCategories, useListProducts } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";

function CategoryContent({ slug }: { slug: string }) {
  const { data: categories, isLoading: catsLoading } = useListCategories();
  
  const category = categories?.find(c => c.slug === slug);
  
  useEffect(() => {
    if (category) {
      document.title = `${category.name} | Jabeen Jewels`;
    }
  }, [category]);

  const { data: productsData, isLoading: prodsLoading } = useListProducts({
    categoryId: category?.id,
    limit: 50,
  }, {
    query: {
      enabled: !!category?.id
    }
  });

  if (catsLoading) {
    return (
      <CustomerLayout>
         <div className="h-[50vh] flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  if (!category) {
    return (
      <CustomerLayout>
        <div className="py-24 text-center">
          <h1 className="font-serif text-3xl">Category Not Found</h1>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="relative bg-muted py-16 lg:py-24 overflow-hidden border-b border-border">
        {category.imageUrl && (
          <>
            <img src={category.imageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </>
        )}
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <span className="text-sm text-muted-foreground">
            {productsData?.total || 0} pieces in collection
          </span>
        </div>

        {prodsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="bg-muted aspect-square rounded-lg" />
                <div className="h-4 bg-muted w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
            We are curating new pieces for this collection. Check back soon.
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
