import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Box } from "lucide-react";
import { createClient } from '@/lib/supabase/server';
import LowStockProducts from '@/components/admin/low-stock-products';
import PendingOrders from '@/components/admin/pending-orders';
import RecentMessages from '@/components/admin/recent-messages';
import RevenueChart from '@/components/admin/revenue-chart';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function AdminDashboardPage() {
    const supabase = createClient();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [
        revenueData,
        ordersData,
        newCustomersData,
        stockData,
        lowStockData,
        pendingOrdersData,
        recentMessagesData,
        revenueChartData
    ] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('status', 'Delivered'),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', oneMonthAgo.toISOString()),
        supabase.from('products').select('stock').eq('status', 'active'),
        supabase.from('products').select('id, name, stock, featured_image_url').eq('status', 'active').lt('stock', 10).order('stock', { ascending: true }).limit(5),
        supabase.rpc('get_admin_order_list').filter('status', 'in', '("Pending","Processing")').limit(5).order('created_at', { ascending: false }),
        supabase.rpc('get_contact_messages').eq('status', 'unread').limit(5),
        supabase.from('orders').select('created_at, total_amount').eq('status', 'Delivered').gte('created_at', ninetyDaysAgo.toISOString())
    ]);

    const totalRevenue = revenueData.data?.reduce((acc, order) => acc + order.total_amount, 0) || 0;
    const totalOrders = ordersData.count || 0;
    const newCustomers = newCustomersData.count || 0;
    const productsInStock = stockData.data?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0;

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
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">+{newCustomers}</p>
                        <p className="text-xs text-muted-foreground">in the last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
                        <Box className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{productsInStock}</p>
                        <p className="text-xs text-muted-foreground">across all active products</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 mt-6">
                <RevenueChart data={revenueChartData.data || []} />
            </div>
            <div className="grid gap-6 mt-6 lg:grid-cols-3">
                 <div className="lg:col-span-2">
                    <PendingOrders orders={pendingOrdersData.data || []} />
                </div>
                <div className="lg:col-span-1 grid auto-rows-max gap-6">
                    <LowStockProducts products={lowStockData.data || []} />
                    <RecentMessages messages={recentMessagesData.data || []} />
                </div>
            </div>
        </div>
    );
}