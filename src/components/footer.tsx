'use client';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { Button } from './ui/button';
import Image from 'next/image';
import LucideIcon from './lucide-icon';

interface SocialLink {
  url: string;
  icon: string;
}

interface FooterProps {
  settings?: {
    site_title?: string | null;
    site_subtitle?: string | null;
    logo_url?: string | null;
    social_links?: SocialLink[] | null;
  } | null;
}

export default function Footer({ settings }: FooterProps) {
  const socialLinks: SocialLink[] = (settings?.social_links || []) as SocialLink[];

  return (
    <footer className="bg-muted/40">
      <div className="container py-8 mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {settings?.logo_url ? (
                  <Image src={settings.logo_url} alt={settings.site_title || 'Logo'} width={28} height={28} className="h-7 w-auto"/>
              ) : (
                  <Leaf className="h-7 w-7 text-primary" />
              )}
              <span className="font-bold text-xl">{settings?.site_title || 'Karwanbazar'}</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              {settings?.site_subtitle || 'Your one-stop shop for fresh, high-quality groceries delivered to your door.'}
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
             © {new Date().getFullYear()} {settings?.site_title || 'Karwanbazar'}. All rights reserved.
          </p>
          <div className="flex space-x-2 order-1 md:order-2">
              {socialLinks.map((link, index) => (
                <Button key={index} variant="ghost" size="icon" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.icon}>
                    <LucideIcon name={link.icon} className="h-5 w-5 text-muted-foreground" />
                  </a>
                </Button>
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
