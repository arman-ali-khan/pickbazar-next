import Link from 'next/link';
import { Leaf, Facebook, Twitter, Instagram } from 'lucide-react';
import { Button } from './ui/button';

export default function Footer() {
  return (
    <footer className="bg-muted/40">
      <div className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Leaf className="h-7 w-7 text-primary" />
              <span className="font-bold text-xl">Pickbazar</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your one-stop shop for fresh, high-quality groceries delivered to your door.
            </p>
          </div>
          <div className="grid grid-cols-2 md:col-span-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/shop" className="text-sm text-muted-foreground hover:text-primary">Shop</Link></li>
                <li><Link href="/offers" className="text-sm text-muted-foreground hover:text-primary">Offers</Link></li>
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact</Link></li>
              </ul>
            </div>
             <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="/terms-and-conditions" className="text-sm text-muted-foreground hover:text-primary">Terms & Conditions</Link></li>
                <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary">FAQ</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground order-2 md:order-1 mt-4 md:mt-0">
             © {new Date().getFullYear()} Pickbazar. All rights reserved.
          </p>
          <div className="flex space-x-2 order-1 md:order-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="#"><Facebook className="h-5 w-5 text-muted-foreground" /></a>
              </Button>
               <Button variant="ghost" size="icon" asChild>
                <a href="#"><Twitter className="h-5 w-5 text-muted-foreground" /></a>
              </Button>
               <Button variant="ghost" size="icon" asChild>
                <a href="#"><Instagram className="h-5 w-5 text-muted-foreground" /></a>
              </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
