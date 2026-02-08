import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CRMDataTable from "./CRMDataTable";

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface CRMOrdersTabProps {
  orders: RecentOrder[];
  allOrders?: any[];
}

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

const CRMOrdersTab = ({ orders, allOrders = [] }: CRMOrdersTabProps) => {
  const orderColumns = [
    {
      key: "orderNumber",
      label: "Order #",
      sortable: true,
      render: (order: RecentOrder) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{order.orderNumber}</span>
          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
            {order.status}
          </Badge>
        </div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (order: RecentOrder) => (
        <span className="font-bold">৳{order.total.toLocaleString()}</span>
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment",
      render: (order: RecentOrder) => (
        <Badge variant="outline" className="capitalize">
          {order.paymentMethod}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (order: RecentOrder) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "50px",
      render: (order: RecentOrder) => (
        <Link to={`/order/${order.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  const exportData = allOrders.length > 0
    ? allOrders.map((o) => ({
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
      }))
    : orders.map((o) => ({
        order_number: o.orderNumber,
        customer: o.customerName,
        total: o.total,
        status: o.status,
        payment_method: o.paymentMethod,
        created_at: new Date(o.createdAt).toLocaleDateString(),
      }));

  return (
    <CRMDataTable
      data={orders}
      columns={orderColumns}
      title="Recent Orders"
      subtitle="Latest orders in selected period"
      searchKey="orderNumber"
      searchPlaceholder="Search order number..."
      enableSelection={true}
      exportFilename="orders_report"
      maxHeight="500px"
      emptyMessage="No orders found"
      filters={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "processing", label: "Processing" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ],
        },
        {
          key: "paymentMethod",
          label: "Payment",
          options: [
            { value: "cod", label: "COD" },
            { value: "bkash", label: "bKash" },
            { value: "nagad", label: "Nagad" },
          ],
        },
      ]}
    />
  );
};

export default CRMOrdersTab;
