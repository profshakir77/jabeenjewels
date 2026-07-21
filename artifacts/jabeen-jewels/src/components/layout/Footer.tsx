import { Link } from "wouter";
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/attached_assets/jabeen_jewels_1784614581920.png" 
                alt="Jabeen Jewels Logo" 
                className="h-10 w-10 object-contain rounded-full border border-primary/20 p-1 bg-background"
              />
              <span className="font-serif text-xl tracking-tight font-bold">Jabeen Jewels</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pr-4">
              Timeless Beauty, Made for You. Discover our exquisite collection of handcrafted Pakistani jewelry, designed to make you shine, sparkle, and treasure every moment.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Shop</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">All Collections</Link>
              <Link href="/category/necklaces" className="text-sm text-muted-foreground hover:text-primary transition-colors">Necklaces</Link>
              <Link href="/category/rings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Rings</Link>
              <Link href="/category/earrings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Earrings</Link>
              <Link href="/category/bracelets" className="text-sm text-muted-foreground hover:text-primary transition-colors">Bracelets & Bangles</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Customer Care</h4>
            <nav className="flex flex-col gap-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Shipping & Delivery</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Returns & Exchanges</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Jewelry Care Guide</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Ring Size Guide</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold">Contact Us</h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <a href="https://wa.me/923338479799" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                  +92 333 8479799
                  <span className="block text-xs mt-0.5">(WhatsApp Available)</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:sf9517771@gmail.com" className="hover:text-primary transition-colors">
                  sf9517771@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>Lahore, Pakistan</span>
              </li>
            </ul>
          </div>
          
        </div>
        
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} Jabeen Jewels. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Payment icons placeholder */}
            <span className="text-xs text-muted-foreground font-semibold px-2 py-1 bg-muted rounded">Cash on Delivery</span>
            <span className="text-xs text-muted-foreground font-semibold px-2 py-1 bg-muted rounded">Bank Transfer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
