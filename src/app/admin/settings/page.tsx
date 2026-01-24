
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
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface AllSettings {
    site_title: string;
    site_subtitle: string;
    logo_url: string | null;
    favicon_url: string | null;
    link_preview_image_url: string | null;
    meta_title: string;
    meta_description: string;
    meta_tags: string;
    canonical_url: string;
    og_title: string;
    og_description: string;
    enable_cod: boolean;
    enable_mobile_banking: boolean;
    enable_card_payment: boolean;
    enable_sslcommerz: boolean;
    maintenance_mode: boolean;
    maintenance_title: string;
    maintenance_description: string;
    maintenance_cover_image_url: string | null;
    maintenance_end_date: string | null;
    enable_promo_popup: boolean;
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { supabase } = useSupabase();
    const { toast } = useToast();

    const [settings, setSettings] = useState<Partial<AllSettings>>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [maintenanceCoverFile, setMaintenanceCoverFile] = useState<File | null>(null);
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
        } else if (data) {
            const parsedData = { ...data };
            for (const key in parsedData) {
                if (parsedData[key] === 'true') {
                    parsedData[key] = true;
                } else if (parsedData[key] === 'false') {
                    parsedData[key] = false;
                }
            }
            setSettings(parsedData as AllSettings);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({...prev, [id]: value}));
    };

    const handleSwitchChange = (key: keyof AllSettings, checked: boolean) => {
        setSettings(prev => ({ ...prev, [key]: checked }));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, key: keyof AllSettings) => {
        const file = e.target.files?.[0];
        if (file) {
            setter(file);
            const previewUrl = URL.createObjectURL(file);
            setSettings(prev => ({...prev, [key]: previewUrl}));
        }
    };
    
    const removeImage = (fileSetter: React.Dispatch<React.SetStateAction<File | null>>, key: keyof AllSettings) => {
        fileSetter(null);
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
                const updatedSettings: Partial<AllSettings> = { ...settings };

                if (logoFile) updatedSettings.logo_url = await uploadImage(logoFile);
                if (faviconFile) updatedSettings.favicon_url = await uploadImage(faviconFile);
                if (previewFile) updatedSettings.link_preview_image_url = await uploadImage(previewFile);
                if (maintenanceCoverFile) updatedSettings.maintenance_cover_image_url = await uploadImage(maintenanceCoverFile);
                
                const settingsToUpdate = Object.entries(updatedSettings)
                    .map(([key, value]) => ({
                        key,
                        value: value === null || value === undefined ? null : String(value),
                    }));

                const result = await updateSettings(settingsToUpdate);

                if (result.error) throw new Error(result.error);
                
                toast({ title: 'Settings saved successfully' });
                await fetchSettings();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
            }
        });
    };
    
    const renderImageUploader = (label: string, key: keyof AllSettings, fileSetter: React.Dispatch<React.SetStateAction<File | null>>) => (
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
                    <Input id={`${key}-upload`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, fileSetter, key as keyof AllSettings)} />
                </label>
            )}
        </div>
    );
    
    const renderSkeleton = () => (
        <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    )

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="general" className="flex items-center gap-2"><SettingsIcon className="h-4 w-4" /><span className="hidden md:inline">General</span></TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2"><Search className="h-4 w-4" /><span className="hidden md:inline">SEO</span></TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><span className="hidden md:inline">Payments</span></TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-2"><Wrench className="h-4 w-4" /><span className="hidden md:inline">Maintenance</span></TabsTrigger>
                <TabsTrigger value="promo" className="flex items-center gap-2"><Megaphone className="h-4 w-4" /><span className="hidden md:inline">Promotions</span></TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
                {loading ? renderSkeleton() : (
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Manage your site's basic information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="site_title">Site Title</Label>
                                        <Input id="site_title" value={settings.site_title || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="site_subtitle">Site Subtitle</Label>
                                        <Input id="site_subtitle" value={settings.site_subtitle || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
                                {renderImageUploader('Site Logo', 'logo_url', setLogoFile)}
                                {renderImageUploader('Favicon', 'favicon_url', setFaviconFile)}
                                {renderImageUploader('Link Preview Image', 'link_preview_image_url', setPreviewFile)}
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="seo">
                {loading ? renderSkeleton() : (
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Settings</CardTitle>
                            <CardDescription>Optimize your site for search engines.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2"><Label htmlFor="meta_title">Meta Title</Label><Input id="meta_title" value={settings.meta_title || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="meta_description">Meta Description</Label><Textarea id="meta_description" value={settings.meta_description || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="meta_tags">Meta Tags (comma separated)</Label><Input id="meta_tags" value={settings.meta_tags || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="canonical_url">Canonical URL</Label><Input id="canonical_url" value={settings.canonical_url || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="og_title">OG Title</Label><Input id="og_title" value={settings.og_title || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="og_description">OG Description</Label><Textarea id="og_description" value={settings.og_description || ''} onChange={handleInputChange} /></div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                        </CardFooter>
                    </Card>
                )}
            </TabsContent>
            
            <TabsContent value="payments">
                {loading ? renderSkeleton() : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Methods</CardTitle>
                            <CardDescription>Enable or disable payment gateways.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="enable_cod" className="flex flex-col gap-1"><span>Cash on Delivery</span><span className="font-normal text-sm text-muted-foreground">Enable this to accept cash on delivery.</span></Label><Switch id="enable_cod" checked={settings.enable_cod} onCheckedChange={(c) => handleSwitchChange('enable_cod', c)} /></div>
                            <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="enable_mobile_banking" className="flex flex-col gap-1"><span>Mobile Banking</span><span className="font-normal text-sm text-muted-foreground">Accept payments through mobile banking apps.</span></Label><Switch id="enable_mobile_banking" checked={settings.enable_mobile_banking} onCheckedChange={(c) => handleSwitchChange('enable_mobile_banking', c)} /></div>
                            <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="enable_card_payment" className="flex flex-col gap-1"><span>Card Payment</span><span className="font-normal text-sm text-muted-foreground">Accept credit/debit card payments.</span></Label><Switch id="enable_card_payment" checked={settings.enable_card_payment} onCheckedChange={(c) => handleSwitchChange('enable_card_payment', c)} /></div>
                            <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="enable_sslcommerz" className="flex flex-col gap-1"><span>SSLCommerz</span><span className="font-normal text-sm text-muted-foreground">Enable SSLCommerz payment gateway.</span></Label><Switch id="enable_sslcommerz" checked={settings.enable_sslcommerz} onCheckedChange={(c) => handleSwitchChange('enable_sslcommerz', c)} /></div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                        </CardFooter>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="maintenance">
                 {loading ? renderSkeleton() : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Maintenance Mode</CardTitle>
                            <CardDescription>Put your site in maintenance mode.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="maintenance_mode" className="flex flex-col gap-1"><span>Enable Maintenance Mode</span><span className="font-normal text-sm text-muted-foreground">This will make your site temporarily unavailable to visitors.</span></Label><Switch id="maintenance_mode" checked={settings.maintenance_mode} onCheckedChange={(c) => handleSwitchChange('maintenance_mode', c)} /></div>
                            <div className="space-y-2"><Label htmlFor="maintenance_title">Maintenance Title</Label><Input id="maintenance_title" value={settings.maintenance_title || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="maintenance_description">Maintenance Description</Label><Textarea id="maintenance_description" value={settings.maintenance_description || ''} onChange={handleInputChange} /></div>
                            {renderImageUploader('Maintenance Cover Image', 'maintenance_cover_image_url', setMaintenanceCoverFile)}
                            <div className="space-y-2"><Label htmlFor="maintenance_end_date">Maintenance End Date</Label><Input id="maintenance_end_date" type="datetime-local" value={settings.maintenance_end_date || ''} onChange={handleInputChange} /></div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                        </CardFooter>
                    </Card>
                 )}
            </TabsContent>
            
            <TabsContent value="promo">
                {loading ? renderSkeleton() : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Promotional Popup</CardTitle>
                            <CardDescription>Configure the promotional popup for your site.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="enable_promo_popup" className="flex flex-col gap-1"><span>Enable Promotional Popup</span><span className="font-normal text-sm text-muted-foreground">Show a promotional offer when users visit your site.</span></Label><Switch id="enable_promo_popup" checked={settings.enable_promo_popup} onCheckedChange={(c) => handleSwitchChange('enable_promo_popup', c)} /></div>
                            <Button asChild variant="outline">
                                <Link href="/admin/promos">Manage Promos</Link>
                            </Button>
                        </CardContent>
                         <CardFooter className="border-t pt-6">
                            <Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                        </CardFooter>
                    </Card>
                )}
            </TabsContent>
        </Tabs>
    );
}

export default function AdminSettingsPage() {
    return (
        <div className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Suspense fallback={<div className="text-center p-8">Loading settings...</div>}>
                <SettingsContent />
            </Suspense>
        </div>
    );
}
