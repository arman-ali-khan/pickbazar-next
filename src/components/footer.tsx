import Link from 'next/link';
import { Leaf, Twitter, Facebook, Instagram } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export default function Footer() {
  const socialLinks = [
    { icon: Facebook, href: '#' },
    { icon: Twitter, href: '#' },
    { icon: Instagram, href: '#' },
  ];

  const footerLinks = [
    { title: 'About Us', href: '#' },
    { title: 'Contact Us', href: '#' },
    { title: 'Privacy Policy', href: '#' },
    { title: 'Terms of Service', href: '#' },
  ];

  return (
    <footer className="bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">BazaarClone</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Freshness delivered to your doorstep.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <Link key={index} href={social.href} className="text-muted-foreground hover:text-primary">
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.title}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
             <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">My Account</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Order History</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Wishlist</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">Subscribe for updates and special offers.</p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="Email" />
              <Button type="submit">Subscribe</Button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BazaarClone. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
