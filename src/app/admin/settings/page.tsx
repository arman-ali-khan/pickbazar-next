
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, Settings as SettingsIcon, Search, CreditCard, Wrench, Megaphone, X } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useState, useEffect, useCallback, useTransition } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { updateSettings } from "@/app/actions";

interface SiteSettings {
    site_title: string;
    site_subtitle: string;
    logo_url: string | null;
    favicon_url: string | null;
    link_preview_image_url: string | null;
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { supabase } = useSupabase();
    const { toast } = useToast();

    const [settings, setSettings] = useState<Partial<SiteSettings>>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();
    
    const activeTab = searchParams.get('tab') || 'general';

    const handleTabChange = (value: string) => {
        router.push(`${pathname}?tab=${value}`);
    };

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_settings');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
        } else {
            setSettings(data as SiteSettings);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, key: keyof SiteSettings) => {
        const file = e.target.files?.[0];
        if (file) {
            setter(file);
            const previewUrl = URL.createObjectURL(file);
            setSettings(prev => ({...prev, [key]: previewUrl}));
        }
    };
    
    const removeImage = (setter: React.Dispatch<React.SetStateAction<File | null>>, key: keyof SiteSettings) => {
        setter(null);
        setSettings(prev => ({...prev, [key]: null}));
    }

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aistudio');

        const response = await fetch('https://api.cloudinary.com/v1_1/dcckbmhft/image/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload image to Cloudinary');
        const data = await response.json();
        return data.secure_url;
    };
    
    const handleSaveChanges = () => {
        startTransition(async () => {
            try {
                let logo_url = settings.logo_url;
                if (logoFile) logo_url = await uploadImage(logoFile);

                let favicon_url = settings.favicon_url;
                if (faviconFile) favicon_url = await uploadImage(faviconFile);

                let link_preview_image_url = settings.link_preview_image_url;
                if (previewFile) link_preview_image_url = await uploadImage(previewFile);
                
                const settingsToUpdate = [
                    { key: 'site_title', value: settings.site_title || '' },
                    { key: 'site_subtitle', value: settings.site_subtitle || '' },
                    { key: 'logo_url', value: logo_url },
                    { key: 'favicon_url', value: favicon_url },
                    { key: 'link_preview_image_url', value: link_preview_image_url },
                ];

                const result = await updateSettings(settingsToUpdate);

                if (result.error) throw new Error(result.error);
                
                toast({ title: 'Settings saved successfully' });
                await fetchSettings(); // re-fetch to get permanent URLs
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
            }
        });
    };

    const renderImageUploader = (label: string, key: keyof SiteSettings, fileSetter: React.Dispatch<React.SetStateAction<File | null>>) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            {settings[key] ? (
                 <div className="relative w-full h-48 border rounded-lg">
                    <Image src={settings[key]!} alt={`${label} preview`} fill className="object-contain rounded-md p-2" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeImage(fileSetter, key)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                 <label htmlFor={`${key}-upload`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                    </div>
                    <Input id={`${key}-upload`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, fileSetter, key)} />
                </label>
            )}
        </div>
    );

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general" className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="hidden md:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span className="hidden md:inline">SEO</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden md:inline">Payments</span>
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <span className="hidden md:inline">Maintenance</span>
                </TabsTrigger>
                <TabsTrigger value="promo" className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    <span className="hidden md:inline">Promotions</span>
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Manage your site's basic information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         {loading ? <p>Loading settings...</p> : (
                            <>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="site-title">Site Title</Label>
                                    <Input id="site-title" value={settings.site_title || ''} onChange={(e) => setSettings(prev => ({...prev, site_title: e.target.value}))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="site-subtitle">Site Subtitle</Label>
                                    <Input id="site-subtitle" value={settings.site_subtitle || ''} onChange={(e) => setSettings(prev => ({...prev, site_subtitle: e.target.value}))} />
                                </div>
                            </div>
                            {renderImageUploader('Site Logo', 'logo_url', setLogoFile)}
                            {renderImageUploader('Favicon', 'favicon_url', setFaviconFile)}
                            {renderImageUploader('Link Preview Image', 'link_preview_image_url', setPreviewFile)}
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="seo">
                <Card>
                    <CardHeader>
                        <CardTitle>SEO Settings</CardTitle>
                        <CardDescription>Optimize your site for search engines.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="meta-title">Meta Title</Label>
                            <Input id="meta-title" placeholder="Pickbazar - Fresh Groceries Delivered" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="meta-description">Meta Description</Label>
                            <Textarea id="meta-description" placeholder="Shop for fresh groceries and get them delivered to your doorstep in 90 minutes." />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="meta-tags">Meta Tags (comma separated)</Label>
                            <Input id="meta-tags" placeholder="groceries, fresh food, delivery" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="canonical-url">Canonical URL</Label>
                            <Input id="canonical-url" placeholder="https://pickbazar.com" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="og-title">OG Title</Label>
                            <Input id="og-title" placeholder="Pickbazar: Groceries delivered fast." />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="og-description">OG Description</Label>
                            <Textarea id="og-description" placeholder="The fastest grocery delivery service in town." />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            
            <TabsContent value="payments">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Enable or disable payment gateways.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="cod" className="flex flex-col gap-1">
                              <span>Cash on Delivery</span>
                              <span className="font-normal text-sm text-muted-foreground">
                                Enable this to accept cash on delivery.
                              </span>
                            </Label>
                            <Switch id="cod" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="mobile-banking" className="font-medium">Mobile Banking</Label>
                                <p className="text-sm text-muted-foreground">
                                    Accept payments through mobile banking apps.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">Manager</Button>
                                <Switch id="mobile-banking" defaultChecked />
                            </div>
                        </div>
                         <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="card-payment" className="flex flex-col gap-1">
                              <span>Card Payment</span>
                              <span className="font-normal text-sm text-muted-foreground">
                                Accept credit/debit card payments.
                              </span>
                            </Label>
                            <Switch id="card-payment" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="sslcommerz" className="flex flex-col gap-1">
                              <span>SSLCommerz</span>
                              <span className="font-normal text-sm text-muted-foreground">
                                Enable SSLCommerz payment gateway.
                              </span>
                            </Label>
                            <Switch id="sslcommerz" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="maintenance">
                 <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Mode</CardTitle>
                        <CardDescription>Put your site in maintenance mode.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="maintenance-mode" className="flex flex-col gap-1">
                              <span>Enable Maintenance Mode</span>
                              <span className="font-normal text-sm text-muted-foreground">
                                This will make your site temporarily unavailable to visitors.
                              </span>
                            </Label>
                            <Switch id="maintenance-mode" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maintenance-title">Maintenance Title</Label>
                            <Input id="maintenance-title" placeholder="We'll be back soon!" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maintenance-description">Maintenance Description</Label>
                            <Textarea id="maintenance-description" placeholder="Sorry for the inconvenience. We're performing some maintenance at the moment." />
                        </div>
                         <div className="space-y-2">
                            <Label>Cover Image</Label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="maintenance-cover" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                    </div>
                                    <Input id="maintenance-cover" type="file" className="hidden" />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maintenance-date">Maintenance End Date</Label>
                            <Input id="maintenance-date" type="datetime-local" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            
            <TabsContent value="promo">
                <Card>
                    <CardHeader>
                        <CardTitle>Promotional Popup</CardTitle>
                        <CardDescription>Configure the promotional popup for your site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="promo-popup" className="flex flex-col gap-1">
                              <span>Enable Promotional Popup</span>
                              <span className="font-normal text-sm text-muted-foreground">
                                Show a promotional offer when users visit your site.
                              </span>
                            </Label>
                            <Switch id="promo-popup" defaultChecked />
                        </div>
                        <Button variant="outline">Promo Manager</Button>
                    </CardContent>
                     <CardFooter className="border-t pt-6">
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

export default function AdminSettingsPage() {
    return (
        <div className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Suspense fallback={<div>Loading...</div>}>
                <SettingsContent />
            </Suspense>
        </div>
    );
}
