import { Link } from "wouter";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <CustomerLayout>
      <div className="flex items-center justify-center min-h-[70vh] bg-background">
        <div className="w-full max-w-md mx-auto px-4 py-8 text-center space-y-6">
          <div className="flex justify-center mb-6">
            <span className="font-serif text-6xl text-primary font-bold">404</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground text-base">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <div className="pt-6">
            <Link href="/">
              <Button className="rounded-none px-8 py-6 uppercase tracking-widest text-sm">
                Return to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
