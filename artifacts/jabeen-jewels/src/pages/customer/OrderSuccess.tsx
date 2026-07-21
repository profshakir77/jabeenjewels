import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";
import { CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";

export default function OrderSuccess() {
  const { id } = useParams();
  const orderId = parseInt(id || "0");

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId }
  });

  useEffect(() => {
    document.title = "Order Confirmed | Jabeen Jewels";
  }, []);

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-3xl mb-4 text-destructive">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">We couldn't find the details for this order.</p>
          <Link href="/">
            <Button className="rounded-none tracking-widest uppercase">Return Home</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const handleWhatsAppUpdate = () => {
    const message = encodeURIComponent(`Hi! I just placed an order on Jabeen Jewels.\nOrder ID: #${order.id}\nName: ${order.customerName}\nAmount: ${formatPKR(order.total)}\n\nPlease confirm my order status.`);
    window.open(`https://wa.me/923338479799?text=${message}`, '_blank');
  };

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-16 lg:py-24 max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 text-center space-y-8">
          
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for shopping with Jabeen Jewels, {order.customerName.split(' ')[0]}.
            </p>
            <p className="text-sm text-muted-foreground">
              Your order <span className="font-semibold text-foreground">#{order.id}</span> has been received and is being processed.
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-6 text-left my-8">
            <h3 className="font-serif text-lg font-medium border-b border-border pb-3 mb-4">Order Details</h3>
            <div className="space-y-3 mb-6">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.quantity}x {item.productName}</span>
                  <span className="font-medium">{formatPKR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPKR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{order.shippingFee === 0 ? "Free" : formatPKR(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-serif text-lg font-medium pt-2 text-primary">
                <span>Total</span>
                <span>{formatPKR(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              onClick={handleWhatsAppUpdate}
              className="bg-[#25D366] text-white hover:bg-[#128C7E] h-12 rounded-none px-8 tracking-widest uppercase text-xs"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Receive Updates on WhatsApp
            </Button>
            <Link href="/shop">
              <Button variant="outline" className="h-12 rounded-none px-8 tracking-widest uppercase text-xs w-full sm:w-auto">
                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
        </div>
      </div>
    </CustomerLayout>
  );
}
