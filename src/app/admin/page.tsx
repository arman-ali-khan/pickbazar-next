
import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Box } from "lucide-react";
import { createClient } from '@/lib/supabase/server';
import RevenueChart from '@/components/admin/revenue-chart';
import PendingReviews from '@/components/admin/pending-reviews';
import PendingQuestions from '@/components/admin/pending-questions';
import PendingRefunds from '@/components/admin/pending-refunds';
import PendingOrders from '@/components/admin/pending-orders';
import LowStockProducts from '@/components/admin/low-stock-products';
import type { AdminReview, AdminQuestion, OrderStatus } from '@/lib/data';

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

type OrderWithCustomer = {
    id: number;
    order_number: string;
    created_at: string;
    total_amount: number;
    status: OrderStatus;
    customer_name: string | null;
    customer_email: string;
    customer_avatar_url: string | null;
}

type LowStockProduct = {
    id: number;
    name: string;
    stock: number;
    featured_image_url: string;
}


export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function AdminDashboardPage() {
    const supabase = createClient();
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
        revenueData,
        ordersCountData,
        newCustomersCountData,
        productsInStockData,
        reviewsData,
        questionsData,
        refundsData,
        revenueChartData,
        allOrdersData,
        lowStockProductsData
    ] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('status', 'Delivered'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.rpc('get_admin_reviews'),
        supabase.rpc('get_admin_questions'),
        supabase.rpc('get_admin_refunds'),
        supabase.from('orders').select('created_at, total_amount').eq('status', 'Delivered').gte('created_at', ninetyDaysAgo.toISOString()),
        supabase.rpc('get_admin_order_list'),
        supabase.from('products').select('id, name, stock, featured_image_url').lt('stock', 10).order('stock', { ascending: true }).limit(5),
    ]);

    const totalRevenue = revenueData.data?.reduce((acc, order) => acc + order.total_amount, 0) || 0;
    const totalOrders = ordersCountData.count || 0;
    const newCustomers = newCustomersCountData.count || 0;
    const productsInStock = productsInStockData.count || 0;
    
    const pendingReviews = (reviewsData.data as AdminReview[] || []).filter((r) => r.status === 'Pending');
    const pendingQuestions = (questionsData.data as AdminQuestion[] || []).filter((q) => q.status === 'Pending');
    const pendingRefunds = (refundsData.data as AdminRefund[] || []).filter((r) => r.status === 'Pending');
    const pendingOrders = (allOrdersData.data as OrderWithCustomer[] || []).filter(o => o.status === 'Pending').slice(0, 5);
    const lowStockProducts = (lowStockProductsData.data as LowStockProduct[] || []);

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
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers (30d)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">+{newCustomers}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
                        <Box className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{productsInStock}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 mt-6">
                <RevenueChart data={revenueChartData.data || []} />
            </div>
            <div className="grid gap-6 mt-6 lg:grid-cols-2 xl:grid-cols-3">
                <PendingOrders orders={pendingOrders} />
                <LowStockProducts products={lowStockProducts} />
                <PendingReviews reviews={pendingReviews} />
                <PendingQuestions questions={pendingQuestions} />
                <PendingRefunds refunds={pendingRefunds} />
            </div>
        </div>
    );
}
