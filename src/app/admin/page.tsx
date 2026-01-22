
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Box } from "lucide-react";
import { createClient } from '@/lib/supabase/server';
import RecentReviews from '@/components/admin/recent-reviews';
import type { AdminReview } from "@/lib/data";
import RecentRefundRequests from "@/components/admin/recent-refund-requests";

export default async function AdminDashboardPage() {
    const supabase = createClient();
    const { data: allReviewsData } = await supabase.rpc('get_admin_reviews');
    const { data: allRefundsData } = await supabase.rpc('get_admin_refunds');

    const pendingReviews = (allReviewsData || []).filter((review: AdminReview) => review.status === 'Pending').slice(0, 5);
    const pendingRefunds = (allRefundsData || []).filter((refund) => refund.status === 'Pending').slice(0, 5);

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
                        <p className="text-2xl font-bold">$45,231.89</p>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">+2350</p>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">+120</p>
                        <p className="text-xs text-muted-foreground">+10% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
                        <Box className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">573</p>
                        <p className="text-xs text-muted-foreground">201 active</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 mt-6 lg:grid-cols-2">
                <div className="lg:col-span-1">
                    <RecentReviews reviews={pendingReviews} />
                </div>
                <div className="lg:col-span-1">
                    <RecentRefundRequests refunds={pendingRefunds} />
                </div>
            </div>
        </div>
    );
}
