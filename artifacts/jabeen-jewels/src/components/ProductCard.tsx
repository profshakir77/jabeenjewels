import { Link } from "wouter";
import { formatPKR } from "@/lib/utils";
import type { Product } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0] || "/placeholder.jpg"; // Placeholder image logic can be refined later if needed.
  
  return (
    <div className="group relative overflow-hidden rounded-lg bg-card text-card-foreground border border-transparent hover:border-border transition-colors duration-300">
      <Link href={`/product/${product.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {product.name}</span>
      </Link>

      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {product.isOnSale && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 text-xs font-semibold rounded-full z-20">
            Sale
          </div>
        )}
        {product.isNewArrival && !product.isOnSale && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold rounded-full z-20">
            New
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 text-center">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{product.categoryName}</p>
        <h3 className="font-serif text-lg leading-tight truncate">{product.name}</h3>
        
        <div className="flex items-center justify-center gap-2 mt-1">
          {product.isOnSale && product.salePrice ? (
            <>
              <span className="text-muted-foreground line-through text-sm">
                {formatPKR(product.price)}
              </span>
              <span className="font-semibold text-primary">
                {formatPKR(product.salePrice)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-primary">
              {formatPKR(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
