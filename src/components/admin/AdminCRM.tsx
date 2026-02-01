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
  FileText,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  Building2,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CRMStats {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  receivedPayments: number;
}

interface DeliveryPartnerStats {
  partnerId: string;
  partnerName: string;
  totalSent: number;
  delivered: number;
  returned: number;
  pendingPayment: number;
  receivedPayment: number;
}

const AdminCRM = () => {
  const [stats, setStats] = useState<CRMStats>({
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    receivedPayments: 0,
  });
  const [partnerStats, setPartnerStats] = useState<DeliveryPartnerStats[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
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

      const { data: ordersData, error } = await query;

      if (error) throw error;

      setOrders(ordersData || []);

      // Calculate stats
      const allOrders = ordersData || [];
      const delivered = allOrders.filter((o) => o.status === "delivered");
      const cancelled = allOrders.filter((o) => o.status === "cancelled");
      const returned = allOrders.filter((o) => o.return_requested_at);
      const pending = allOrders.filter((o) => o.status === "pending");

      const totalRevenue = delivered.reduce((sum, o) => sum + o.total, 0);
      const pendingPayments = allOrders
        .filter((o) => o.partner_payment_status === "pending" && o.status === "delivered")
        .reduce((sum, o) => sum + (o.partner_payment_amount || o.total), 0);
      const receivedPayments = allOrders
        .filter((o) => o.partner_payment_status === "received")
        .reduce((sum, o) => sum + (o.partner_payment_amount || 0), 0);

      setStats({
        totalOrders: allOrders.length,
        deliveredOrders: delivered.length,
        cancelledOrders: cancelled.length,
        returnedOrders: returned.length,
        pendingOrders: pending.length,
        totalRevenue,
        pendingPayments,
        receivedPayments,
      });

      // Calculate partner stats
      const { data: partners } = await supabase
        .from("delivery_partners")
        .select("id, name")
        .eq("is_active", true);

      if (partners) {
        const pStats: DeliveryPartnerStats[] = partners.map((p) => {
          const partnerOrders = allOrders.filter(
            (o) => o.delivery_partner_id === p.id
          );
          return {
            partnerId: p.id,
            partnerName: p.name,
            totalSent: partnerOrders.length,
            delivered: partnerOrders.filter((o) => o.status === "delivered")
              .length,
            returned: partnerOrders.filter((o) => o.return_requested_at).length,
            pendingPayment: partnerOrders
              .filter((o) => o.partner_payment_status === "pending")
              .reduce((sum, o) => sum + (o.partner_payment_amount || o.total), 0),
            receivedPayment: partnerOrders
              .filter((o) => o.partner_payment_status === "received")
              .reduce((sum, o) => sum + (o.partner_payment_amount || 0), 0),
          };
        });
        setPartnerStats(pStats);
      }
    } catch (error) {
      console.error("Error fetching CRM data:", error);
      toast.error("Failed to fetch CRM data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('crm_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_partners' },
        () => fetchData()
      )
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

  const exportPartnerReport = () => {
    const exportData = partnerStats.map((p) => ({
      partner_name: p.partnerName,
      total_orders: p.totalSent,
      delivered: p.delivered,
      returned: p.returned,
      pending_payment: p.pendingPayment,
      received_payment: p.receivedPayment,
    }));
    exportToCSV(exportData, "partner_report");
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Delivered",
      value: stats.deliveredOrders,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Cancelled",
      value: stats.cancelledOrders,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Returned",
      value: stats.returnedOrders,
      icon: RotateCcw,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Pending",
      value: stats.pendingOrders,
      icon: Truck,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Revenue",
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-gold",
      bg: "bg-gold/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-6 animate-pulse"
          >
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">CRM Dashboard</h1>
          <p className="text-muted-foreground">Track orders, deliveries, and payments</p>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">From:</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">To:</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div
              className={`h-10 w-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Delivery Partners</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Orders Summary</CardTitle>
                <CardDescription>
                  {dateFrom} to {dateTo}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportOrdersReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-500">
                    {stats.deliveredOrders}
                  </p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-500">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-500">
                    {stats.cancelledOrders}
                  </p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-500">
                    {stats.returnedOrders}
                  </p>
                  <p className="text-sm text-muted-foreground">Returned</p>
                </div>
              </div>

              {/* Success Rate */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Success Rate</span>
                  <span className="font-medium">
                    {stats.totalOrders > 0
                      ? Math.round(
                          (stats.deliveredOrders / stats.totalOrders) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${
                        stats.totalOrders > 0
                          ? (stats.deliveredOrders / stats.totalOrders) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Delivery Partner Performance</CardTitle>
                <CardDescription>Orders by delivery company</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportPartnerReport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {partnerStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No delivery partners configured
                </p>
              ) : (
                <div className="space-y-4">
                  {partnerStats.map((partner) => (
                    <div
                      key={partner.partnerId}
                      className="bg-muted/50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-gold" />
                          <span className="font-medium">{partner.partnerName}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {partner.totalSent} orders
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center text-sm">
                        <div>
                          <p className="font-semibold text-green-500">
                            {partner.delivered}
                          </p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                        <div>
                          <p className="font-semibold text-orange-500">
                            {partner.returned}
                          </p>
                          <p className="text-xs text-muted-foreground">Returned</p>
                        </div>
                        <div>
                          <p className="font-semibold text-yellow-500">
                            ৳{partner.pendingPayment.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div>
                          <p className="font-semibold text-green-500">
                            ৳{partner.receivedPayment.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Received</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>
                Track payments from delivery partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pending Payments
                      </p>
                      <p className="text-2xl font-bold text-yellow-500">
                        ৳{stats.pendingPayments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payments expected from delivery partners
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Received Payments
                      </p>
                      <p className="text-2xl font-bold text-green-500">
                        ৳{stats.receivedPayments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payments received from partners
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCRM;