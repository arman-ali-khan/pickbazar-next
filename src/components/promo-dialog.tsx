'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSupabase } from '@/lib/supabase/provider';
import Image from 'next/image';
import { Input } from './ui/input';
import { Send, X } from 'lucide-react';

interface Promo {
  id: number;
  title: string;
  subtitle: string | null;
  button_text: string | null; // Not used in new design, but kept for data model consistency
  button_link: string | null; // Not used in new design
  image_url: string | null;
}

const LOCAL_STORAGE_KEY = 'hidePromoDialog';

export default function PromoDialog() {
  const { supabase } = useSupabase();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const shouldShow = !localStorage.getItem(LOCAL_STORAGE_KEY);

    const fetchPromo = async () => {
      const { data: settingsData } = await supabase.rpc('get_all_settings');
      const promoEnabled = settingsData?.enable_promo_popup;

      if (shouldShow && promoEnabled) {
        const { data, error } = await supabase
          .from('promos')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setPromo(data);
          setTimeout(() => setIsOpen(true), 1500);
        }
      }
      setLoading(false);
    };

    fetchPromo();
  }, [supabase]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the email subscription, e.g., send to an API endpoint
    console.log('Subscribing with email:', email);
    handleClose();
  }

  if (loading || !promo || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-background/50 hover:bg-background/80 text-muted-foreground"
        >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </Button>
        <div className="p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">{promo.title || "Get 25% Discount"}</h2>
            <p className="text-muted-foreground mb-8">
                {promo.subtitle || "Subscribe to the mailing list to receive updates on new arrivals, special offers and our promotions."}
            </p>
            <form onSubmit={handleSubscribe}>
                <div className="relative mb-6">
                    <Input 
                        type="email"
                        placeholder="Write your email here"
                        className="h-12 pl-4 pr-12 text-base"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10">
                        <Send className="h-5 w-5"/>
                    </Button>
                </div>
            </form>
            <div className="flex items-center space-x-2">
                <Checkbox id="dont-show-again" checked={dontShowAgain} onCheckedChange={(checked) => setDontShowAgain(checked as boolean)} />
                <Label htmlFor="dont-show-again" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    Don't show this popup again
                </Label>
            </div>
        </div>
        <div className="hidden md:block relative min-h-[400px]">
            {promo.image_url && (
                <Image 
                    src={promo.image_url} 
                    alt={promo.title}
                    fill
                    className="object-cover"
                />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
