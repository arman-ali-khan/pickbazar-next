
'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, File, ListFilter, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import type { OrderStatus } from '@/lib/data';
import { Skeleton } from "@/components/ui/skeleton";
import { updateOrderStatus } from "@/app/actions";

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

const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
        case 'Delivered': return 'secondary';
        case 'Cancelled': return 'destructive';
        case 'Pending': return 'default';
        case 'Processing': return 'outline';
        case 'Shipped': return 'default';
        default: return 'default';
    }
};

const OrderList = ({ orders, onStatusUpdate }: { orders: OrderWithCustomer[], onStatusUpdate: () => void }) => {
    const [isUpdating, startTransition] = useTransition();
    const { toast } = useToast();

    const handleStatusChange = (orderId: number, newStatus: OrderStatus) => {
        startTransition(async () => {
            const result = await updateOrderStatus(orderId, newStatus);
            if (result.error) {
                toast({
                    variant: 'destructive',
                    title: 'Error updating status',
                    description: result.error,
                });
            } else {
                toast({
                    title: 'Status Updated',
                    description: `Order #${result.orderNumber} status updated to ${newStatus}.`,
                });
                onStatusUpdate();
            }
        });
    };

    if (orders.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No orders found.</p>
            </div>
        )
    }

    return (
        <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                {orders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={order.customer_avatar_url || undefined} alt={order.customer_name || 'Guest'} />
                                    <AvatarFallback>{(order.customer_name || 'G').charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        {order.customer_name || 'Guest User'}
                                        {!order.customer_name && <Badge variant="secondary">Guest</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{order.order_number}</p>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/orders/${order.order_number}`} className='w-full'>
                                            <div className="flex items-center w-full"><Eye className="mr-2 h-4 w-4" /><span>View Details</span></div>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger disabled={isUpdating}>Change Status</DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuRadioGroup value={order.status} onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}>
                                                    <DropdownMenuRadioItem value="Pending">Pending</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="Processing">Processing</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="Shipped">Shipped</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="Delivered">Delivered</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="Cancelled">Cancelled</DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-bold">${order.total_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span suppressHydrationWarning>{format(new Date(order.created_at), 'PP')}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-muted-foreground">Status</span>
                                 <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.order_number}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={order.customer_avatar_url || undefined} alt={order.customer_name || 'Guest'} />
                                            <AvatarFallback>{(order.customer_name || 'G').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {order.customer_name || 'Guest User'}
                                                 {!order.customer_name && <Badge variant="secondary">Guest</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell suppressHydrationWarning>{format(new Date(order.created_at), 'PP')}</TableCell>
                                <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/orders/${order.order_number}`} className="flex items-center">
                                                    <Eye className="mr-2 h-4 w-4" />View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger disabled={isUpdating}>Change Status</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuRadioGroup value={order.status} onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as OrderStatus)}>
                                                            <DropdownMenuRadioItem value="Pending">Pending</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="Processing">Processing</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="Shipped">Shipped</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="Delivered">Delivered</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="Cancelled">Cancelled</DropdownMenuRadioItem>
                                                        </DropdownMenuRadioGroup>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
};

export default function AdminOrdersPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [allOrders, setAllOrders] = useState<OrderWithCustomer[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ORDERS_PER_PAGE = 10;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .rpc('get_admin_order_list');

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching orders', description: error.message });
            setAllOrders([]);
        } else if (data) {
            setAllOrders(data as OrderWithCustomer[]);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    

    const filteredAndSearchedOrders = useMemo(() => {
        let filtered = allOrders;
        if (activeTab !== 'all') {
            filtered = filtered.filter(order => order.status === activeTab);
        }
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(lowercasedTerm) ||
                (order.customer_name && order.customer_name.toLowerCase().includes(lowercasedTerm)) ||
                order.customer_email.toLowerCase().includes(lowercasedTerm)
            );
        }
        return filtered;
    }, [allOrders, activeTab, searchTerm]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setCurrentPage(1);
    };

    const tabs: (OrderStatus | 'all')[] = ['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    const totalPages = Math.ceil(filteredAndSearchedOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = filteredAndSearchedOrders.slice(
        (currentPage - 1) * ORDERS_PER_PAGE,
        currentPage * ORDERS_PER_PAGE
    );
    
    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center">
                <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap capitalize">
                                    Filter ({activeTab})
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={activeTab} onValueChange={handleTabChange}>
                                {tabs.map(tab => (
                                    <DropdownMenuRadioItem key={tab} value={tab} className="capitalize">{tab}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                        <File className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>Manage your orders and view their details.</CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search orders..."
                            className="w-full appearance-none bg-background pl-8 shadow-none md:w-1/3"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <>
                            {/* Mobile Skeleton */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <CardHeader className="flex flex-row items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-8 w-8" />
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                <Skeleton className="h-4 w-12" />
                                                <Skeleton className="h-5 w-20" />
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                                <div className="flex justify-between items-center text-sm">
                                                <Skeleton className="h-4 w-12" />
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Desktop Skeleton */}
                            <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                                                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Skeleton className="h-8 w-8 rounded-full" />
                                                            <div className="space-y-1">
                                                                <Skeleton className="h-4 w-24" />
                                                                <Skeleton className="h-3 w-32" />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                            </div>
                        </>
                    ) : <OrderList orders={paginatedOrders} onStatusUpdate={fetchOrders} />}
                </CardContent>
                <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>{Math.min((currentPage - 1) * ORDERS_PER_PAGE + 1, filteredAndSearchedOrders.length)}</strong> to <strong>{Math.min(currentPage * ORDERS_PER_PAGE, filteredAndSearchedOrders.length)}</strong> of <strong>{filteredAndSearchedOrders.length}</strong> orders
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </main>
    );
}
