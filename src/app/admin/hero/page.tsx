'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";
import { useState, useEffect, useCallback, useTransition } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { updateSettings } from "@/app/actions/settings";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroSettings {
    hero_title?: string;
    hero_subtitle?: string;
    hero_button_text?: string;
    hero_button_url?: string;
    hero_image_url?: string | null;
}

export default function HeroSettingsPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();

    const [settings, setSettings] = useState<HeroSettings>({});
    const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_settings');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
        } else if (data && data.length > 0) {
            const settingsData = data[0];
            setSettings({
                hero_title: settingsData.hero_title,
                hero_subtitle: settingsData.hero_subtitle,
                hero_button_text: settingsData.hero_button_text,
                hero_button_url: settingsData.hero_button_url,
                hero_image_url: settingsData.hero_image_url,
            });
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({...prev, [id]: value}));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHeroImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setSettings(prev => ({...prev, hero_image_url: previewUrl}));
        }
    };
    
    const removeImage = () => {
        setHeroImageFile(null);
        setSettings(prev => ({...prev, hero_image_url: null}));
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
                let updatedSettings: HeroSettings = { ...settings };

                if (heroImageFile) {
                    updatedSettings.hero_image_url = await uploadImage(heroImageFile);
                }
                
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

    const renderImageUploader = () => (
        <div className="space-y-2">
            <Label>Hero Background Image</Label>
            {settings.hero_image_url ? (
                 <div className="relative w-full h-64 border rounded-lg">
                    <Image src={settings.hero_image_url} alt="Hero image preview" fill className="object-cover rounded-md" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeImage}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                 <label htmlFor="hero_image_url-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                    </div>
                    <Input id="hero_image_url-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );

    if (loading) {
        return (
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
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Hero Section Manager</CardTitle>
                <CardDescription>Customize the main hero section of your homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {renderImageUploader()}
                <div className="space-y-2">
                    <Label htmlFor="hero_title">Title</Label>
                    <Input id="hero_title" value={settings.hero_title || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hero_subtitle">Subtitle</Label>
                    <Input id="hero_subtitle" value={settings.hero_subtitle || ''} onChange={handleInputChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="hero_button_text">Button Text</Label>
                        <Input id="hero_button_text" value={settings.hero_button_text || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hero_button_url">Button URL</Label>
                        <Input id="hero_button_url" value={settings.hero_button_url || ''} onChange={handleInputChange} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardFooter>
        </Card>
    )
}
