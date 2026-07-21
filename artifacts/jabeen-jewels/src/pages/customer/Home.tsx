import { useEffect } from "react";
import { Link } from "wouter";
import { useGetHomepageData } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Sparkles, Gem } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

export default function Home() {
  useEffect(() => {
    document.title = "Jabeen Jewels | Timeless Beauty, Made for You";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Discover exquisite Pakistani jewelry crafted for elegance and luxury.");
    }
  }, []);

  const { data, isLoading, isError } = useGetHomepageData();
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "center" });

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
            <p className="text-muted-foreground font-serif tracking-widest uppercase text-sm">Loading Elegance</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (isError || !data) {
    return (
      <CustomerLayout>
        <div className="h-[70vh] flex items-center justify-center flex-col gap-4 text-center px-4">
          <h2 className="text-2xl font-serif text-destructive">Unable to load collection</h2>
          <p className="text-muted-foreground">We are having trouble reaching our showroom. Please try again.</p>
        </div>
      </CustomerLayout>
    );
  }

  const { banners, featuredProducts, newArrivals, saleProducts, categories } = data;

  const heroBanner = banners?.find(b => b.isActive) || {
    title: "Timeless Beauty",
    subtitle: "Discover pieces that speak to your soul",
    imageUrl: "/attached_assets/generated_images/hero-banner.jpg",
    buttonText: "Shop Collection",
    linkUrl: "/shop"
  };

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-muted">
        <div className="absolute inset-0">
          <img 
            src={heroBanner.imageUrl || "/attached_assets/generated_images/hero-banner.jpg"} 
            alt={heroBanner.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        
        <div className="relative container mx-auto h-full px-4 flex flex-col justify-end pb-24 sm:pb-32">
          <div className="max-w-2xl text-white space-y-6 animate-in slide-in-from-bottom-8 duration-1000">
            {heroBanner.subtitle && (
              <span className="font-serif italic text-lg sm:text-xl tracking-wide text-white/90">
                {heroBanner.subtitle}
              </span>
            )}
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-medium leading-tight">
              {heroBanner.title}
            </h1>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link href={heroBanner.linkUrl || "/shop"}>
                <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-none px-8 py-6 text-sm tracking-widest uppercase transition-all duration-300">
                  {heroBanner.buttonText || "Shop Now"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-12 bg-secondary text-secondary-foreground border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-primary/20">
            <div className="flex flex-col items-center gap-3 py-4 md:py-0">
              <Star className="h-6 w-6 text-primary" />
              <h3 className="font-serif text-lg">Premium Quality</h3>
              <p className="text-sm opacity-80">Exquisite craftsmanship in every detail</p>
            </div>
            <div className="flex flex-col items-center gap-3 py-4 md:py-0">
              <Sparkles className="h-6 w-6 text-primary" />
              <h3 className="font-serif text-lg">Unique Designs</h3>
              <p className="text-sm opacity-80">Modern elegance meets traditional roots</p>
            </div>
            <div className="flex flex-col items-center gap-3 py-4 md:py-0">
              <Gem className="h-6 w-6 text-primary" />
              <h3 className="font-serif text-lg">Secure Delivery</h3>
              <p className="text-sm opacity-80">Free shipping across Pakistan over Rs. 5,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      {categories && categories.length > 0 && (
        <section className="py-20 container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Curated Collections</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Find the perfect piece for every occasion</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {categories.slice(0, 4).map((category, index) => (
              <Link key={category.id} href={`/category/${category.slug}`} className="group relative overflow-hidden aspect-[4/5] bg-muted flex items-center justify-center text-center">
                <img 
                  src={category.imageUrl || (index % 2 === 0 ? "/attached_assets/generated_images/rings.jpg" : "/attached_assets/generated_images/necklaces.jpg")} 
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="relative z-10 p-4 border border-white/30 bg-white/10 backdrop-blur-sm transform transition-transform duration-500 group-hover:scale-105">
                  <h3 className="font-serif text-xl sm:text-2xl text-white">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-20 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="font-serif text-3xl sm:text-4xl">Featured Elegance</h2>
                <p className="text-muted-foreground">Our most loved and sought-after pieces.</p>
              </div>
              <Link href="/shop" className="hidden sm:inline-flex">
                <Button variant="outline" className="rounded-none tracking-widest uppercase text-xs">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              {featuredProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="mt-8 text-center sm:hidden">
              <Link href="/shop">
                <Button variant="outline" className="rounded-none tracking-widest uppercase text-xs w-full">
                  View All Collection
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA Section */}
      <section className="py-24 relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8 max-w-3xl">
          <h2 className="font-serif text-4xl sm:text-5xl font-medium leading-tight">Need Help Choosing?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Our jewelry consultants are available on WhatsApp to help you find the perfect piece or answer any questions about our collection.
          </p>
          <a href="https://wa.me/923338479799" target="_blank" rel="noreferrer" className="inline-block">
            <Button size="lg" variant="secondary" className="rounded-none px-8 py-6 text-sm tracking-widest uppercase">
              Chat on WhatsApp
            </Button>
          </a>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals && newArrivals.length > 0 && (
        <section className="py-20 container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Just Arrived</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Be the first to wear our latest creations</p>
          </div>
          
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 sm:gap-8 cursor-grab active:cursor-grabbing">
              {newArrivals.map(product => (
                <div key={product.id} className="flex-[0_0_80%] sm:flex-[0_0_40%] md:flex-[0_0_25%] min-w-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </CustomerLayout>
  );
}
