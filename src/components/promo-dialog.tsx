'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSupabase } from '@/lib/supabase/provider';
import Image from 'next/image';
import Link from 'next/link';

interface Promo {
  id: number;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
}

const LOCAL_STORAGE_KEY = 'hidePromoDialog';

export default function PromoDialog() {
  const { supabase } = useSupabase();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [loading, setLoading] = useState(true);

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
          // Add a small delay before showing the popup
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

  if (loading || !promo || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {promo.image_url && (
            <div className="relative h-48 w-full">
                <Image src={promo.image_url} alt={promo.title} fill objectFit="contain" className="p-4"/>
            </div>
        )}
        <DialogHeader className="text-center p-6">
          <DialogTitle className="text-2xl font-bold">{promo.title}</DialogTitle>
          {promo.subtitle && <DialogDescription>{promo.subtitle}</DialogDescription>}
        </DialogHeader>
        {promo.button_text && promo.button_link && (
            <DialogFooter className="p-6 pt-0 flex-col gap-4">
                <Button asChild className="w-full" size="lg" onClick={handleClose}>
                    <Link href={promo.button_link}>{promo.button_text}</Link>
                </Button>
                 <div className="flex items-center space-x-2 justify-center">
                    <Checkbox id="dont-show-again" checked={dontShowAgain} onCheckedChange={(checked) => setDontShowAgain(checked as boolean)} />
                    <Label htmlFor="dont-show-again" className="text-sm font-normal text-muted-foreground">
                        Don't show this again
                    </Label>
                </div>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
