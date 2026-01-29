import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Truck, CheckCircle, XCircle, Clock, Search, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BulkSelectionToolbar from "./BulkSelectionToolbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  payment_method: string;
  payment_transaction_id: string | null;
  is_preorder: boolean;
  notes: string | null;
  created_at: string;
  fraud_score: number;
  is_flagged: boolean;
  address: {
    full_name: string;
    phone: string;
    division: string;
    district: string;
    thana: string;
    address_line: string;
  } | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  is_preorder: boolean;
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { value: "processing", label: "Processing", color: "bg-purple-500" },
  { value: "shipped", label: "Shipped", color: "bg-indigo-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          address:addresses (
            full_name,
            phone,
            division,
            district,
            thana,
            address_line
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Query error:", error);
        throw error;
      }
      
      // Map data to include default values for new columns
      const ordersWithDefaults = (data || []).map((order: any) => ({
        ...order,
        fraud_score: order.fraud_score || 0,
        is_flagged: order.is_flagged || false,
      }));
      
      setOrders(ordersWithDefaults as Order[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (!error) {
      setOrderItems(data || []);
    }
  };

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setDetailsOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order status updated");
      fetchOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.address?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.address?.phone.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((s) => s.value === status);
    return option?.color || "bg-muted";
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredOrders.map(o => o.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkStatusChange = async (status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} orders updated to ${status}`);
      setSelectedIds([]);
      fetchOrders();
    } catch (error) {
      console.error("Error updating orders:", error);
      toast.error("Failed to update orders");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} orders? This cannot be undone.`)) return;
    
    try {
      // First delete order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .in("order_id", selectedIds);

      if (itemsError) throw itemsError;

      // Then delete orders
      const { error } = await supabase
        .from("orders")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} orders deleted`);
      setSelectedIds([]);
      fetchOrders();
    } catch (error) {
      console.error("Error deleting orders:", error);
      toast.error("Failed to delete orders");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
              <div className="h-8 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h1 className="font-display text-2xl text-foreground">Orders</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Selection Toolbar */}
      <BulkSelectionToolbar
        selectedIds={selectedIds}
        totalCount={filteredOrders.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDelete={handleBulkDelete}
        customActions={
          selectedIds.length > 0 && (
            <Select onValueChange={handleBulkStatusChange}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
      />

      {/* Orders List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground w-10">
                  <Checkbox 
                    checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={(checked) => checked ? handleSelectAll() : handleDeselectAll()}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Payment</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Risk</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className={`border-t border-border hover:bg-muted/30 ${selectedIds.includes(order.id) ? 'bg-gold/5' : ''}`}>
                    <td className="p-4">
                      <Checkbox 
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{order.order_number}</p>
                      {order.is_preorder && (
                        <span className="text-xs text-gold">Pre-Order</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-foreground">{order.address?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{order.address?.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gold">৳{order.total.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm uppercase">{order.payment_method}</span>
                      {order.payment_transaction_id && (
                        <p className="text-xs text-muted-foreground">{order.payment_transaction_id}</p>
                      )}
                    </td>
                    <td className="p-4">
                      {order.is_flagged ? (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-medium">High Risk</span>
                        </div>
                      ) : order.fraud_score > 0 ? (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">{order.fraud_score}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-500">
                          <Shield className="h-4 w-4" />
                          <span className="text-xs">Safe</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getStatusColor(order.status)}`} />
                            <span className="capitalize text-sm">{order.status}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${status.color}`} />
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Customer</h4>
                  <p className="text-foreground">{selectedOrder.address?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.address?.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Address</h4>
                  <p className="text-sm text-foreground">
                    {selectedOrder.address?.address_line}<br />
                    {selectedOrder.address?.thana}, {selectedOrder.address?.district}<br />
                    {selectedOrder.address?.division}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Items</h4>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-foreground">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ৳{item.product_price.toLocaleString()} × {item.quantity}
                        </p>
                        {item.is_preorder && (
                          <span className="text-xs text-gold">Pre-Order</span>
                        )}
                      </div>
                      <p className="font-semibold">
                        ৳{(item.product_price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Totals */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment</h4>
                  <p className="uppercase text-foreground">{selectedOrder.payment_method}</p>
                  {selectedOrder.payment_transaction_id && (
                    <p className="text-sm text-muted-foreground">
                      TxnID: {selectedOrder.payment_transaction_id}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>৳{selectedOrder.shipping_cost}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-gold">৳{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                  <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
