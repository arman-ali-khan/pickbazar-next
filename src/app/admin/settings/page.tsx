
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, Settings as SettingsIcon, Search, CreditCard, Wrench, Megaphone, X, Share2, Plus, Trash2, Truck, ShieldCheck } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useState, useEffect, useCallback, useTransition } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { updateSettings } from "@/app/actions/settings";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { iconList } from "@/lib/icon-list";
import LucideIcon from "@/components/lucide-icon";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface SocialLink {
    url: string;
    icon: string;
}

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
    social_links: SocialLink[] | null;
    mobile_banking_number: string | null;
    mobile_banking_options: string[];
    shipping_cost: number | null;
    sslcommerz_mode: 'sandbox' | 'production';
    sslcommerz_sandbox_store_id: string | null;
    sslcommerz_sandbox_store_password: string | null;
    sslcommerz_production_store_id: string | null;
    sslcommerz_production_store_password: string | null;
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { supabase } = useSupabase();
    const { toast } = useToast();

    const [settings, setSettings] = useState<Partial<AllSettings>>({});
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [mobileBankingOptions, setMobileBankingOptions] = useState<string[]>([]);
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
        } else if (data && data.length > 0) {
            const settingsData = data[0];
            setSettings(settingsData);
            setSocialLinks(Array.isArray(settingsData.social_links) ? settingsData.social_links : []);
            setMobileBankingOptions(Array.isArray(settingsData.mobile_banking_options) ? settingsData.mobile_banking_options : []);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target as HTMLInputElement;
        if (type === 'number') {
             setSettings(prev => ({...prev, [id]: value === '' ? null : parseFloat(value)}));
        } else {
             setSettings(prev => ({...prev, [id]: value}));
        }
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
                let updatedSettings: Partial<AllSettings> = { ...settings };

                if (logoFile) updatedSettings.logo_url = await uploadImage(logoFile);
                if (faviconFile) updatedSettings.favicon_url = await uploadImage(faviconFile);
                if (previewFile) updatedSettings.link_preview_image_url = await uploadImage(previewFile);
                if (maintenanceCoverFile) updatedSettings.maintenance_cover_image_url = await uploadImage(maintenanceCoverFile);
                
                const settingsToUpdate = Object.entries(updatedSettings)
                    .filter(([key]) => !['social_links', 'mobile_banking_options'].includes(key))
                    .map(([key, value]) => ({
                        key,
                        value: value === null || value === undefined ? null : String(value),
                    }));
                
                settingsToUpdate.push({
                    key: 'social_links',
                    value: JSON.stringify(socialLinks)
                });
                settingsToUpdate.push({
                    key: 'mobile_banking_options',
                    value: JSON.stringify(mobileBankingOptions)
                });

                const result = await updateSettings(settingsToUpdate);

                if (result.error) throw new Error(result.error);
                
                toast({ title: 'Settings saved successfully' });
                await fetchSettings();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
            }
        });
    };

    const handleSocialLinkChange = (index: number, field: 'url' | 'icon', value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index][field] = value;
        setSocialLinks(newLinks);
    }
    
    const addSocialLink = () => {
        setSocialLinks([...socialLinks, { url: '', icon: 'Link' }]);
    }

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    }

    const handleMobileBankingOptionChange = (option: string) => {
        setMobileBankingOptions(prev => 
            prev.includes(option)
            ? prev.filter(item => item !== option)
            : [...prev, option]
        );
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

    const availableMobileProviders = ['bKash', 'Nagad', 'Rocket', 'Upay'];

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="sm:grdi flex justify-between w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-7">
                <TabsTrigger value="general" className="flex items-center gap-2"><SettingsIcon className="h-4 w-4" /><span className="hidden md:inline">General</span></TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2"><Search className="h-4 w-4" /><span className="hidden md:inline">SEO</span></TabsTrigger>
                <TabsTrigger value="shipping" className="flex items-center gap-2"><Truck className="h-4 w-4" /><span className="hidden md:inline">Shipping</span></TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><span className="hidden md:inline">Payments</span></TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-2"><Wrench className="h-4 w-4" /><span className="hidden md:inline">Maintenance</span></TabsTrigger>
                <TabsTrigger value="promo" className="flex items-center gap-2"><Megaphone className="h-4 w-4" /><span className="hidden md:inline">Promotions</span></TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-2"><Share2 className="h-4 w-4" /><span className="hidden md:inline">Social</span></TabsTrigger>
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
                               <div className='flex flex-col sm:flex-row w-full gap-6 *:w-full'>
                               {renderImageUploader('Site Logo', 'logo_url', setLogoFile)}
                                {renderImageUploader('Favicon', 'favicon_url', setFaviconFile)}
                                {renderImageUploader('Link Preview Image', 'link_preview_image_url', setPreviewFile)}
                               </div>
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
            
            <TabsContent value="shipping">
                {loading ? renderSkeleton() : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Settings</CardTitle>
                            <CardDescription>Manage shipping costs and options for your store.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 max-w-sm">
                                <Label htmlFor="shipping_cost">Standard Shipping Cost ($)</Label>
                                <Input id="shipping_cost" type="number" value={settings.shipping_cost ?? ''} onChange={handleInputChange} step="0.01" placeholder="e.g., 5.00" />
                                <p className="text-xs text-muted-foreground">This is the flat rate shipping cost applied to all orders.</p>
                            </div>
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
                            
                            <div className="space-y-2 pt-4">
                                <Label htmlFor="mobile_banking_number">Mobile Banking Number</Label>
                                <Input id="mobile_banking_number" value={settings.mobile_banking_number || ''} onChange={handleInputChange} placeholder="e.g. 01234567890" />
                                <p className="text-xs text-muted-foreground">The number customers will send money to.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Enabled Mobile Banking Providers</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal h-auto">
                                            {mobileBankingOptions.length > 0 ? `${mobileBankingOptions.length} providers selected` : "Select providers"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 p-2">
                                        {availableMobileProviders.map(opt => (
                                            <DropdownMenuCheckboxItem
                                                key={opt}
                                                checked={mobileBankingOptions.includes(opt)}
                                                onCheckedChange={() => handleMobileBankingOptionChange(opt)}
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                {opt}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <Separator className="my-6" />
                            <div className="space-y-4">
                                <h4 className="text-md font-semibold">SSLCommerz Settings</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="sslcommerz_mode">Gateway Mode</Label>
                                    <Select value={settings.sslcommerz_mode || 'sandbox'} onValueChange={(value) => setSettings(prev => ({...prev, sslcommerz_mode: value as any}))}>
                                        <SelectTrigger id="sslcommerz_mode">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox</SelectItem>
                                            <SelectItem value="production">Production</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sslcommerz_sandbox_store_id">Sandbox Store ID</Label>
                                        <Input id="sslcommerz_sandbox_store_id" value={settings.sslcommerz_sandbox_store_id || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sslcommerz_sandbox_store_password">Sandbox Store Password</Label>
                                        <Input id="sslcommerz_sandbox_store_password" type="password" value={settings.sslcommerz_sandbox_store_password || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
                                 <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sslcommerz_production_store_id">Production Store ID</Label>
                                        <Input id="sslcommerz_production_store_id" value={settings.sslcommerz_production_store_id || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sslcommerz_production_store_password">Production Store Password</Label>
                                        <Input id="sslcommerz_production_store_password" type="password" value={settings.sslcommerz_production_store_password || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
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

            <TabsContent value="social">
                {loading ? renderSkeleton() : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>Manage the social media links shown in your site's footer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {socialLinks.map((link, index) => (
                                <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                                    <div className="grid gap-2 flex-1">
                                        <Label htmlFor={`social-url-${index}`}>URL</Label>
                                        <Input
                                            id={`social-url-${index}`}
                                            value={link.url}
                                            onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Icon</Label>
                                        <Select value={link.icon} onValueChange={(value) => handleSocialLinkChange(index, 'icon', value)}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="Select icon" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {iconList.map(iconName => (
                                                    <SelectItem key={iconName} value={iconName}>
                                                        <div className="flex items-center gap-2">
                                                            <LucideIcon name={iconName} className="h-4 w-4" />
                                                            {iconName}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeSocialLink(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addSocialLink}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Link
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

    