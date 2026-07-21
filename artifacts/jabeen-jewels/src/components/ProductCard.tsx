import { Link } from "wouter";
import { formatPKR } from "@/lib/utils";
import { Gem } from "lucide-react";
import type { Product } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
}

function JewelPlaceholder() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/5 via-muted to-primary/10">
      <Gem className="h-12 w-12 text-primary/30" />
      <span className="text-xs text-muted-foreground/60 tracking-widest uppercase font-serif">Jabeen Jewels</span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0] ?? null;

  return (
    <div className="group relative overflow-hidden rounded-lg bg-card text-card-foreground border border-transparent hover:border-border transition-colors duration-300">
      <Link href={`/product/${product.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {product.name}</span>
      </Link>

      <div className="relative aspect-square overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={primaryImage ? "hidden h-full w-full absolute inset-0" : "h-full w-full"}>
          <JewelPlaceholder />
        </div>

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
