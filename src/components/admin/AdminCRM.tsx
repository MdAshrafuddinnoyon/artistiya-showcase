import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  DollarSign,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  ShoppingCart,
  UserPlus,
  Eye,
  AlertTriangle,
  Star,
  BarChart3,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Import new CRM tab components
import CRMProductsTab from "./crm/CRMProductsTab";
import CRMCustomersTab from "./crm/CRMCustomersTab";
import CRMOrdersTab from "./crm/CRMOrdersTab";
import CRMPartnersTab from "./crm/CRMPartnersTab";
import CRMPaymentsTab from "./crm/CRMPaymentsTab";
import CRMExportTools from "./crm/CRMExportTools";

interface CRMStats {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  receivedPayments: number;
  totalCustomers: number;
  newCustomersThisPeriod: number;
  abandonedCarts: number;
  abandonedValue: number;
  avgOrderValue: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  conversionRate: number;
  previousPeriodRevenue: number;
  previousPeriodOrders: number;
}

interface DeliveryPartnerStats {
  partnerId: string;
  partnerName: string;
  totalSent: number;
  delivered: number;
  returned: number;
  pendingPayment: number;
  receivedPayment: number;
  successRate: number;
}

interface TopProduct {
  id: string;
  name: string;
  images: string[];
  totalSold: number;
  revenue: number;
  stockQuantity: number;
}

interface TopCustomer {
  id: string;
  fullName: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  isPremium: boolean;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

const AdminCRM = () => {
  const [stats, setStats] = useState<CRMStats>({
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    receivedPayments: 0,
    totalCustomers: 0,
    newCustomersThisPeriod: 0,
    abandonedCarts: 0,
    abandonedValue: 0,
    avgOrderValue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    conversionRate: 0,
    previousPeriodRevenue: 0,
    previousPeriodOrders: 0,
  });
  const [partnerStats, setPartnerStats] = useState<DeliveryPartnerStats[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      // Calculate previous period for comparison
      const currentFrom = new Date(dateFrom);
      const currentTo = new Date(dateTo);
      const periodDays = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24));
      const previousFrom = new Date(currentFrom.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousTo = new Date(currentFrom.getTime() - 1);

      // Fetch orders with date filter
      let query = supabase
        .from("orders")
        .select(`
          *,
          address:addresses (full_name, phone, district),
          delivery_partner:delivery_partners (id, name)
        `)
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const [ordersResult, previousOrdersResult, customersResult, abandonedResult, productsResult, orderItemsResult] = await Promise.all([
        query,
        supabase
          .from("orders")
          .select("id, total, status")
          .gte("created_at", previousFrom.toISOString())
          .lte("created_at", previousTo.toISOString()),
        supabase.from("customers").select("*").order("total_spent", { ascending: false }),
        supabase.from("abandoned_carts").select("*").eq("is_recovered", false),
        supabase.from("products").select("id, name, images, stock_quantity, price, is_active"),
        supabase.from("order_items").select("product_id, quantity, product_price"),
      ]);

      if (ordersResult.error) throw ordersResult.error;

      const ordersData = ordersResult.data || [];
      const previousOrdersData = previousOrdersResult.data || [];
      const customersData = customersResult.data || [];
      const abandonedData = abandonedResult.data || [];
      const productsData = productsResult.data || [];
      const orderItemsData = orderItemsResult.data || [];

      setOrders(ordersData);

      // Calculate stats
      const delivered = ordersData.filter((o) => o.status === "delivered");
      const cancelled = ordersData.filter((o) => o.status === "cancelled");
      const returned = ordersData.filter((o) => o.return_requested_at);
      const pending = ordersData.filter((o) => o.status === "pending");
      const confirmed = ordersData.filter((o) => o.status === "confirmed");
      const processing = ordersData.filter((o) => o.status === "processing");
      const shipped = ordersData.filter((o) => o.status === "shipped");

      const totalRevenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
      const pendingPayments = ordersData
        .filter((o) => o.partner_payment_status === "pending" && o.status === "delivered")
        .reduce((sum, o) => sum + (o.partner_payment_amount || o.total || 0), 0);
      const receivedPayments = ordersData
        .filter((o) => o.partner_payment_status === "received")
        .reduce((sum, o) => sum + (o.partner_payment_amount || 0), 0);

      // Previous period comparison
      const prevDelivered = previousOrdersData.filter((o) => o.status === "delivered");
      const previousPeriodRevenue = prevDelivered.reduce((sum, o) => sum + (o.total || 0), 0);
      const previousPeriodOrders = previousOrdersData.length;

      // Customer stats
      const totalCustomers = customersData.length;
      const newCustomersThisPeriod = customersData.filter(
        (c) => new Date(c.created_at) >= new Date(`${dateFrom}T00:00:00`)
      ).length;

      // Abandoned cart stats
      const abandonedCarts = abandonedData.length;
      const abandonedValue = abandonedData.reduce((sum, c) => sum + (c.cart_total || 0), 0);

      // Product stats
      const activeProducts = productsData.filter(p => p.is_active);
      const lowStock = activeProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5);
      const outOfStock = activeProducts.filter(p => p.stock_quantity === 0);

      // Calculate conversion rate (orders / abandoned carts + orders)
      const totalAttempts = ordersData.length + abandonedCarts;
      const conversionRate = totalAttempts > 0 ? (ordersData.length / totalAttempts) * 100 : 0;

      // Average order value
      const avgOrderValue = ordersData.length > 0 ? totalRevenue / delivered.length : 0;

      setStats({
        totalOrders: ordersData.length,
        deliveredOrders: delivered.length,
        cancelledOrders: cancelled.length,
        returnedOrders: returned.length,
        pendingOrders: pending.length,
        confirmedOrders: confirmed.length,
        processingOrders: processing.length,
        shippedOrders: shipped.length,
        totalRevenue,
        pendingPayments,
        receivedPayments,
        totalCustomers,
        newCustomersThisPeriod,
        abandonedCarts,
        abandonedValue,
        avgOrderValue: isNaN(avgOrderValue) ? 0 : avgOrderValue,
        totalProducts: activeProducts.length,
        lowStockProducts: lowStock.length,
        outOfStockProducts: outOfStock.length,
        conversionRate,
        previousPeriodRevenue,
        previousPeriodOrders,
      });

      // Calculate top products by sales
      const productSales: Record<string, { quantity: number; revenue: number }> = {};
      orderItemsData.forEach((item: any) => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { quantity: 0, revenue: 0 };
        }
        productSales[item.product_id].quantity += item.quantity || 0;
        productSales[item.product_id].revenue += (item.quantity || 0) * (item.product_price || 0);
      });

      const topProductsList: TopProduct[] = productsData
        .filter(p => productSales[p.id])
        .map((p) => ({
          id: p.id,
          name: p.name,
          images: p.images || [],
          totalSold: productSales[p.id]?.quantity || 0,
          revenue: productSales[p.id]?.revenue || 0,
          stockQuantity: p.stock_quantity || 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setTopProducts(topProductsList);

      // Top customers
      const topCustomersList: TopCustomer[] = customersData
        .slice(0, 10)
        .map((c) => ({
          id: c.id,
          fullName: c.full_name,
          email: c.email,
          totalOrders: c.total_orders || 0,
          totalSpent: c.total_spent || 0,
          isPremium: c.is_premium_member || false,
        }));
      setTopCustomers(topCustomersList);

      // Recent orders
      const recentOrdersList: RecentOrder[] = ordersData.slice(0, 10).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.address?.full_name || "N/A",
        total: o.total,
        status: o.status,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
      }));
      setRecentOrders(recentOrdersList);

      // Calculate daily revenue for chart
      const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
      ordersData.forEach((o) => {
        const date = new Date(o.created_at).toISOString().split("T")[0];
        if (!revenueByDay[date]) {
          revenueByDay[date] = { revenue: 0, orders: 0 };
        }
        if (o.status === "delivered") {
          revenueByDay[date].revenue += o.total || 0;
        }
        revenueByDay[date].orders += 1;
      });

      const dailyRevenueList = Object.entries(revenueByDay)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setDailyRevenue(dailyRevenueList);

      // Calculate partner stats
      const { data: partners } = await supabase
        .from("delivery_partners")
        .select("id, name")
        .eq("is_active", true);

      if (partners) {
        const pStats: DeliveryPartnerStats[] = partners.map((p) => {
          const partnerOrders = ordersData.filter(
            (o) => o.delivery_partner_id === p.id
          );
          const deliveredCount = partnerOrders.filter((o) => o.status === "delivered").length;
          return {
            partnerId: p.id,
            partnerName: p.name,
            totalSent: partnerOrders.length,
            delivered: deliveredCount,
            returned: partnerOrders.filter((o) => o.return_requested_at).length,
            pendingPayment: partnerOrders
              .filter((o) => o.partner_payment_status === "pending")
              .reduce((sum, o) => sum + (o.partner_payment_amount || o.total || 0), 0),
            receivedPayment: partnerOrders
              .filter((o) => o.partner_payment_status === "received")
              .reduce((sum, o) => sum + (o.partner_payment_amount || 0), 0),
            successRate: partnerOrders.length > 0 ? (deliveredCount / partnerOrders.length) * 100 : 0,
          };
        });
        setPartnerStats(pStats);
      }
    } catch (error) {
      console.error("Error fetching CRM data:", error);
      toast.error("Failed to fetch CRM data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('crm_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'abandoned_carts' }, () => fetchData(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateFrom, dateTo, statusFilter]);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Export completed");
  };

  const exportOrdersReport = () => {
    const exportData = orders.map((o) => ({
      order_number: o.order_number,
      customer: o.address?.full_name || "N/A",
      phone: o.address?.phone || "N/A",
      district: o.address?.district || "N/A",
      total: o.total,
      status: o.status,
      payment_method: o.payment_method,
      delivery_partner: o.delivery_partner?.name || "N/A",
      partner_payment: o.partner_payment_status || "N/A",
      created_at: new Date(o.created_at).toLocaleDateString(),
    }));
    exportToCSV(exportData, "orders_report");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "confirmed": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "processing": return "bg-purple-500/20 text-purple-600 border-purple-500/30";
      case "shipped": return "bg-cyan-500/20 text-cyan-600 border-cyan-500/30";
      case "delivered": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "cancelled": return "bg-red-500/20 text-red-600 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const revenueChange = stats.previousPeriodRevenue > 0 
    ? ((stats.totalRevenue - stats.previousPeriodRevenue) / stats.previousPeriodRevenue) * 100 
    : 0;
  const ordersChange = stats.previousPeriodOrders > 0 
    ? ((stats.totalOrders - stats.previousPeriodOrders) / stats.previousPeriodOrders) * 100 
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">CRM Dashboard</h1>
          <p className="text-muted-foreground">Complete business overview and analytics</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Label className="text-sm">From:</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">To:</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-gold">৳{stats.totalRevenue.toLocaleString()}</p>
                <div className={`flex items-center text-xs mt-1 ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(revenueChange).toFixed(1)}% vs previous
                </div>
              </div>
              <div className="h-12 w-12 bg-gold/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <div className={`flex items-center text-xs mt-1 ${ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {ordersChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(ordersChange).toFixed(1)}% vs previous
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">৳{stats.avgOrderValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Per delivered order</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Orders / Total attempts</p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Order Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Pending", value: stats.pendingOrders, color: "yellow" },
              { label: "Confirmed", value: stats.confirmedOrders, color: "blue" },
              { label: "Processing", value: stats.processingOrders, color: "purple" },
              { label: "Shipped", value: stats.shippedOrders, color: "cyan" },
              { label: "Delivered", value: stats.deliveredOrders, color: "green" },
              { label: "Cancelled", value: stats.cancelledOrders, color: "red" },
              { label: "Returned", value: stats.returnedOrders, color: "orange" },
            ].map((status) => (
              <div
                key={status.label}
                className={`bg-${status.color}-500/10 border border-${status.color}-500/30 rounded-lg p-3 text-center`}
              >
                <p className={`text-2xl font-bold text-${status.color}-500`}>{status.value}</p>
                <p className="text-xs text-muted-foreground">{status.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Order Success Rate</span>
              <span className="font-medium text-green-500">
                {stats.totalOrders > 0 ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%
              </span>
            </div>
            <Progress value={stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue and orders over time</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyRevenue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data for selected period</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {dailyRevenue.slice(-14).map((day) => {
                      const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
                      const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-20">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex-1">
                            <div className="h-6 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-medium w-24 text-right">
                            ৳{day.revenue.toLocaleString()}
                          </span>
                          <Badge variant="outline" className="text-xs">{day.orders}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span>Total Customers</span>
                  </div>
                  <span className="font-bold">{stats.totalCustomers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-green-500" />
                    <span>New This Period</span>
                  </div>
                  <span className="font-bold text-green-500">+{stats.newCustomersThisPeriod}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-orange-500" />
                    <span>Abandoned Carts</span>
                  </div>
                  <span className="font-bold text-orange-500">{stats.abandonedCarts}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-red-500" />
                    <span>Lost Revenue</span>
                  </div>
                  <span className="font-bold text-red-500">৳{stats.abandonedValue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <CRMProductsTab 
            products={topProducts}
            stats={{
              totalProducts: stats.totalProducts,
              lowStockProducts: stats.lowStockProducts,
              outOfStockProducts: stats.outOfStockProducts,
            }}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CRMCustomersTab customers={topCustomers} />
        </TabsContent>

        <TabsContent value="orders">
          <CRMOrdersTab orders={recentOrders} allOrders={orders} />
        </TabsContent>

        <TabsContent value="partners">
          <CRMPartnersTab partners={partnerStats} />
        </TabsContent>

        <TabsContent value="payments">
          <CRMPaymentsTab 
            stats={{
              pendingPayments: stats.pendingPayments,
              receivedPayments: stats.receivedPayments,
            }}
            orders={orders}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCRM;
