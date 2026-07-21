import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProduct, useGetProductsByCategory } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPKR } from "@/lib/utils";
import { ShoppingBag, MessageCircle, ChevronRight, Truck, ShieldCheck, Heart, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ColorEntry = { name: string; quantity: number };

export default function ProductDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { addItem } = useCart();
  const { toast } = useToast();

  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");

  const { data: product, isLoading, isError } = useGetProduct(id, {
    query: { enabled: !!id }
  });

  const { data: relatedProducts } = useGetProductsByCategory(product?.categoryId || 0, {
    query: { enabled: !!product?.categoryId }
  });

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Jabeen Jewels`;
      if (product.images?.length > 0 && !mainImage) {
        setMainImage(product.images[0]);
      }
      const colors = normaliseColors((product as any).colors);
      if (colors.length > 0 && !selectedColor) {
        setSelectedColor(colors[0].name);
      }
    }
  }, [product]);

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  if (isError || !product) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-32 text-center space-y-4">
          <h2 className="font-serif text-3xl">Product Not Found</h2>
          <p className="text-muted-foreground">The piece you're looking for might have been moved or removed.</p>
          <Link href="/shop">
            <Button className="rounded-none mt-4">Return to Shop</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const productColors = normaliseColors((product as any).colors);
  const priceToUse = product.isOnSale && product.salePrice ? product.salePrice : product.price;

  // Per-color stock: if a color is selected, use its quantity; otherwise fall back to overall stockQuantity
  const selectedColorEntry = productColors.find(c => c.name === selectedColor);
  const colorStock = selectedColorEntry?.quantity ?? null;
  const effectiveStock = productColors.length > 0
    ? (colorStock ?? 0)
    : (product.stockQuantity ?? 999);

  const maxQty = effectiveStock > 0 ? effectiveStock : (productColors.length === 0 ? 999 : 0);
  const isOutOfColorStock = productColors.length > 0 && effectiveStock === 0;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 10;

  // Reset quantity when color changes
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (isOutOfColorStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: priceToUse,
      image: product.images?.[0] || "/placeholder.jpg",
      quantity
    });
    toast({
      title: "Added to Cart",
      description: `${quantity}× ${product.name}${selectedColor ? ` (${selectedColor})` : ""} added to your cart.`,
      duration: 3000,
    });
  };

  const handleWhatsAppOrder = () => {
    const colorLine = selectedColor ? `\nColor: ${selectedColor}` : "";
    const message = encodeURIComponent(
      `Hi Jabeen Jewels! I would like to order:\n\n*${product.name}*\nPrice: ${formatPKR(priceToUse)}\nQuantity: ${quantity}${colorLine}\nLink: ${window.location.href}\n\nPlease let me know the next steps.`
    );
    window.open(`https://wa.me/923338479799?text=${message}`, "_blank");
  };

  return (
    <CustomerLayout>
      {/* Breadcrumbs */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/category/${product.categoryId}`} className="hover:text-primary transition-colors">{product.categoryName}</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-foreground truncate">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
              <img
                src={mainImage || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${mainImage === img ? "border-primary" : "border-transparent hover:border-primary/50"}`}
                  >
                    <img src={img} alt={`${product.name} thumbnail`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">{product.categoryName}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              {product.isOnSale && product.salePrice ? (
                <>
                  <span className="font-serif text-2xl text-primary font-medium">{formatPKR(product.salePrice)}</span>
                  <span className="text-lg text-muted-foreground line-through">{formatPKR(product.price)}</span>
                  <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded">SALE</span>
                </>
              ) : (
                <span className="font-serif text-2xl text-primary font-medium">{formatPKR(product.price)}</span>
              )}
            </div>

            <div className="prose prose-sm sm:prose-base text-muted-foreground mb-8">
              <p>{product.description || "An exquisite piece crafted with attention to detail. Perfect for adding a touch of elegance to any outfit."}</p>
            </div>

            <div className="space-y-6 mb-8">
              {/* Stock status — only shown when no per-color stock */}
              {productColors.length === 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20 shrink-0">Status:</span>
                  {product.inStock ? (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> In Stock
                      {product.stockQuantity != null && product.stockQuantity > 0 && (
                        <span className="text-muted-foreground font-normal ml-1">({product.stockQuantity} available)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-destructive font-medium">Out of Stock</span>
                  )}
                </div>
              )}

              {/* Overall low-stock warning (no colors) */}
              {productColors.length === 0 && product.inStock && product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">Only {product.stockQuantity} left — order soon!</span>
                </div>
              )}

              {/* Material */}
              {product.material && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20 shrink-0">Material:</span>
                  <span className="text-sm text-muted-foreground">{product.material}</span>
                </div>
              )}

              {/* Color selector with per-color stock */}
              {productColors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-20 shrink-0">Color:</span>
                    <span className="text-sm text-foreground font-medium">{selectedColor}</span>
                    {selectedColorEntry && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        selectedColorEntry.quantity === 0
                          ? "bg-destructive/10 text-destructive"
                          : selectedColorEntry.quantity <= 10
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}>
                        {selectedColorEntry.quantity === 0
                          ? "Out of stock"
                          : selectedColorEntry.quantity <= 10
                            ? `Only ${selectedColorEntry.quantity} left`
                            : `${selectedColorEntry.quantity} in stock`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pl-24">
                    {productColors.map(color => {
                      const outOfStock = color.quantity === 0;
                      const lowStock = color.quantity > 0 && color.quantity <= 10;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleColorSelect(color.name)}
                          disabled={outOfStock}
                          className={`relative px-4 py-1.5 text-sm rounded-none border transition-all ${
                            selectedColor === color.name
                              ? "border-primary bg-primary text-primary-foreground font-medium"
                              : outOfStock
                                ? "border-border text-muted-foreground/40 line-through cursor-not-allowed"
                                : "border-border text-muted-foreground hover:border-primary/60"
                          }`}
                        >
                          {color.name}
                          {lowStock && !outOfStock && (
                            <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-amber-500" title={`Only ${color.quantity} left`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected color out-of-stock warning */}
                  {isOutOfColorStock && (
                    <div className="flex items-center gap-2 text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">This color is currently out of stock. Please select another color.</span>
                    </div>
                  )}

                  {/* Low stock warning for selected color */}
                  {isLowStock && !isOutOfColorStock && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">Only {effectiveStock} left in {selectedColor} — order soon!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-20 shrink-0">Quantity:</span>
                <div className="flex items-center border border-border rounded-none h-10 w-32">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                    disabled={quantity >= maxQty || isOutOfColorStock}
                    className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >+</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock || isOutOfColorStock}
                className="flex-1 h-14 rounded-none text-sm tracking-widest uppercase"
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
              </Button>
              <Button
                onClick={handleWhatsAppOrder}
                disabled={isOutOfColorStock}
                variant="secondary"
                className="flex-1 h-14 rounded-none text-sm tracking-widest uppercase bg-[#25D366] text-white hover:bg-[#128C7E] hover:text-white disabled:opacity-50"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Order via WhatsApp
              </Button>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Free Delivery</h4>
                  <p className="text-xs text-muted-foreground mt-1">On all orders above Rs. 5,000 anywhere in Pakistan.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Crafted with Love</h4>
                  <p className="text-xs text-muted-foreground mt-1">Each piece is carefully inspected before shipping.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 1 && (
        <section className="py-16 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl mb-8 text-center">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </div>
        </section>
      )}
    </CustomerLayout>
  );
}

// Normalise: handles both old string[] and new {name,quantity}[] from DB
function normaliseColors(raw: any): ColorEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c: any) =>
    typeof c === "string"
      ? { name: c, quantity: 0 }
      : { name: String(c.name ?? ""), quantity: Number(c.quantity ?? 0) }
  );
}
