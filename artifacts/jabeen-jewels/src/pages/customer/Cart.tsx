import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "Your Shopping Cart | Jabeen Jewels";
  }, []);

  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + (items.length > 0 ? shipping : 0);

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-32 max-w-lg text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6 text-primary">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-4xl">Your Cart is Empty</h1>
          <p className="text-muted-foreground text-lg">
            Looks like you haven't added anything to your cart yet.
          </p>
          <div className="pt-8">
            <Link href="/shop">
              <Button size="lg" className="rounded-none px-8 tracking-widest uppercase">
                Explore Collection
              </Button>
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="bg-muted/30 py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-3xl sm:text-4xl text-center">Shopping Cart ({itemCount})</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Cart Items */}
          <div className="flex-1 space-y-6">
            <div className="hidden md:grid grid-cols-12 text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border pb-4">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="space-y-6 md:space-y-0 divide-y divide-border">
              {items.map((item) => (
                <div key={item.productId} className="py-6 md:grid md:grid-cols-12 md:items-center gap-4 relative">
                  
                  {/* Mobile delete button */}
                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="absolute top-6 right-0 md:hidden text-muted-foreground hover:text-destructive p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="col-span-6 flex gap-4">
                    <Link href={`/product/${item.productId}`}>
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-muted rounded border border-border shrink-0 overflow-hidden cursor-pointer">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    </Link>
                    <div className="flex flex-col justify-center pr-8 md:pr-0">
                      <Link href={`/product/${item.productId}`} className="font-serif text-lg hover:text-primary transition-colors line-clamp-2">
                        {item.name}
                      </Link>
                      <div className="text-primary font-medium mt-1 md:hidden">
                        {formatPKR(item.price)}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-center hidden md:block text-muted-foreground">
                    {formatPKR(item.price)}
                  </div>

                  <div className="col-span-2 flex justify-start md:justify-center mt-4 md:mt-0">
                    <div className="flex items-center border border-border rounded-none h-9 w-28">
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                      >-</button>
                      <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                      >+</button>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-between items-center md:justify-end mt-4 md:mt-0">
                    <span className="md:hidden text-sm text-muted-foreground uppercase">Subtotal</span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-foreground">{formatPKR(item.price * item.quantity)}</span>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="hidden md:flex text-muted-foreground hover:text-destructive p-2 rounded-full hover:bg-muted transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-card border border-border p-6 rounded-lg sticky top-28">
              <h2 className="font-serif text-2xl mb-6 border-b border-border pb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Standard Delivery</span>
                  <span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
                </div>
                
                {subtotal < 5000 && (
                  <div className="text-xs text-primary/80 bg-primary/10 p-3 rounded mt-2">
                    Add {formatPKR(5000 - subtotal)} more to your cart to get Free Delivery!
                  </div>
                )}
                {subtotal >= 5000 && (
                  <div className="text-xs text-green-600 bg-green-50 p-3 rounded mt-2 font-medium">
                    You have unlocked Free Delivery!
                  </div>
                )}
              </div>
              
              <div className="flex justify-between font-serif text-xl border-t border-border pt-4 mb-8">
                <span>Total</span>
                <span className="text-primary">{formatPKR(total)}</span>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/checkout")}
                  className="w-full h-12 rounded-none text-sm tracking-widest uppercase"
                >
                  Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                
                <Link href="/shop" className="block text-center mt-4">
                  <Button variant="ghost" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </CustomerLayout>
  );
}
