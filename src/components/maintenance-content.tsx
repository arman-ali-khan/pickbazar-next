'use client';

import { Wrench } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MaintenanceData {
    title: string;
    description: string;
    endDate: string | null;
}

export default function MaintenanceContent({ data }: { data: MaintenanceData }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        if (!data.endDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(data.endDate!);
            const difference = end.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft(null);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [data.endDate]);

    return (
        <div className="max-w-2xl mx-auto">
            <Wrench className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.title}</h1>
            <p className="text-lg text-gray-300 mb-8">{data.description}</p>
            {timeLeft && (
                <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto bg-white/10 p-4 rounded-lg">
                    <div>
                        <p className="text-4xl font-bold">{String(timeLeft.days).padStart(2, '0')}</p>
                        <p className="text-xs uppercase">Days</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</p>
                        <p className="text-xs uppercase">Hours</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</p>
                        <p className="text-xs uppercase">Minutes</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</p>
                        <p className="text-xs uppercase">Seconds</p>
                    </div>
                </div>
            )}
        </div>
    );
}
