import { createClient } from '@/lib/supabase/server';
import MaintenanceContent from '@/components/maintenance-content';
import Image from 'next/image';

export default async function MaintenancePage() {
    const supabase = createClient();
    const { data: settings } = await supabase.rpc('get_all_settings');

    const maintenanceData = {
        title: settings?.maintenance_title || 'We are currently down for maintenance',
        description: settings?.maintenance_description || 'We are working hard to improve our website and will be back shortly.',
        coverImageUrl: settings?.maintenance_cover_image_url,
        endDate: settings?.maintenance_end_date,
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center text-center text-white p-4">
            {maintenanceData.coverImageUrl && (
                <Image
                    src={maintenanceData.coverImageUrl}
                    alt="Maintenance background"
                    fill
                    className="object-cover z-0"
                />
            )}
            <div className="absolute inset-0 bg-black/60 z-10" />
            <div className="relative z-20">
                <MaintenanceContent data={maintenanceData} />
            </div>
        </div>
    );
}
