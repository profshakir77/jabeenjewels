import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  customerEmail: z.string().email("Valid email is optional but recommended").optional().or(z.literal("")),
  customerAddress: z.string().min(5, "Complete delivery address is required"),
  customerCity: z.string().min(2, "City is required"),
  notes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createOrder = useCreateOrder();

  useEffect(() => {
    document.title = "Secure Checkout | Jabeen Jewels";
    if (items.length === 0) {
      setLocation("/cart");
    }
  }, [items.length, setLocation]);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      customerCity: "",
      notes: "",
    },
  });

  if (items.length === 0) return null; // Handled by useEffect redirect

  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + shipping;

  const onSubmit = (data: CheckoutValues) => {
    createOrder.mutate(
      {
        data: {
          ...data,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      },
      {
        onSuccess: (order) => {
          clearCart();
          setLocation(`/order-success/${order.id}`);
        },
        onError: () => {
          toast({
            title: "Checkout Failed",
            description: "There was an error creating your order. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <CustomerLayout>
      <div className="bg-muted/30 py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-3xl sm:text-4xl text-center">Secure Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Delivery Details Form */}
          <div className="flex-1 order-2 lg:order-1">
            <h2 className="font-serif text-2xl mb-8 border-b border-border pb-4">Delivery Information</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ayesha Khan" className="rounded-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (WhatsApp preferred) *</FormLabel>
                        <FormControl>
                          <Input placeholder="03XXXXXXXXX" className="rounded-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ayesha@example.com" className="rounded-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complete Delivery Address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="House #, Street, Block, Area" className="rounded-none min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Lahore" className="rounded-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any special instructions for delivery or packaging" className="rounded-none min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={createOrder.isPending}
                    className="w-full h-14 rounded-none text-base tracking-widest uppercase"
                  >
                    {createOrder.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      `Place Order - ${formatPKR(total)}`
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Payment Method: Cash on Delivery
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-96 flex-shrink-0 order-1 lg:order-2">
            <div className="bg-card border border-border p-6 rounded-lg sticky top-28">
              <h2 className="font-serif text-xl mb-6 border-b border-border pb-4">Your Order</h2>
              
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded border border-border shrink-0 relative overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/90 text-[10px] font-bold text-white z-10">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center text-sm">
                      <span className="font-medium line-clamp-1">{item.name}</span>
                      <span className="text-muted-foreground">{formatPKR(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 text-sm border-t border-border pt-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
                </div>
              </div>
              
              <div className="flex justify-between font-serif text-xl border-t border-border pt-4">
                <span>Total</span>
                <span className="text-primary">{formatPKR(total)}</span>
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <Link href="/cart" className="text-sm text-primary hover:underline flex items-center justify-center">
                  Edit Cart
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </CustomerLayout>
  );
}
