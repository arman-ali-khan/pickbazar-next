import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, RefreshCw, Star, HelpCircle } from "lucide-react";
import { createClient } from '@/lib/supabase/server';
import RevenueChart from '@/components/admin/revenue-chart';
import PendingReviews from '@/components/admin/pending-reviews';
import PendingQuestions from '@/components/admin/pending-questions';
import PendingRefunds from '@/components/admin/pending-refunds';
import type { AdminReview, AdminQuestion } from '@/lib/data';

interface AdminRefund {
    id: number;
    order_id: number;
    order_number: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    reason: string;
    created_at: string;
    user_id: string;
    customer_name: string;
    customer_avatar_url: string;
}


export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function AdminDashboardPage() {
    const supabase = createClient();
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [
        revenueData,
        reviewsData,
        questionsData,
        refundsData,
        revenueChartData
    ] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('status', 'Delivered'),
        supabase.rpc('get_admin_reviews'),
        supabase.rpc('get_admin_questions'),
        supabase.rpc('get_admin_refunds'),
        supabase.from('orders').select('created_at, total_amount').eq('status', 'Delivered').gte('created_at', ninetyDaysAgo.toISOString())
    ]);

    const totalRevenue = revenueData.data?.reduce((acc, order) => acc + order.total_amount, 0) || 0;
    
    const pendingReviews = (reviewsData.data as AdminReview[] || []).filter((r) => r.status === 'Pending');
    const pendingQuestions = (questionsData.data as AdminQuestion[] || []).filter((q) => q.status === 'Pending');
    const pendingRefunds = (refundsData.data as AdminRefund[] || []).filter((r) => r.status === 'Pending');
    
    const pendingReviewsCount = pendingReviews.length;
    const pendingQuestionsCount = pendingQuestions.length;
    const pendingRefundsCount = pendingRefunds.length;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pendingReviewsCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Questions</CardTitle>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pendingQuestionsCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pendingRefundsCount}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 mt-6">
                <RevenueChart data={revenueChartData.data || []} />
            </div>
            <div className="grid gap-6 mt-6 lg:grid-cols-3">
                <PendingReviews reviews={pendingReviews} />
                <PendingQuestions questions={pendingQuestions} />
                <PendingRefunds refunds={pendingRefunds} />
            </div>
        </div>
    );
}
