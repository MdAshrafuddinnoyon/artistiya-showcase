import { useState } from "react";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderExportToolsProps {
  selectedIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  statusFilter?: string;
}

const OrderExportTools = ({ selectedIds = [], dateFrom, dateTo, statusFilter }: OrderExportToolsProps) => {
  const [exporting, setExporting] = useState(false);

  const fetchOrdersForExport = async () => {
    let query = supabase
      .from("orders")
      .select(`
        *,
        address:addresses (full_name, phone, division, district, thana, address_line),
        order_items:order_items (product_name, product_price, quantity)
      `)
      .order("created_at", { ascending: false });

    if (selectedIds.length > 0) {
      query = query.in("id", selectedIds);
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter as any);
    }

    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const exportToJSON = async () => {
    setExporting(true);
    try {
      const orders = await fetchOrdersForExport();
      const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
      downloadBlob(blob, `orders_export_${new Date().toISOString().split("T")[0]}.json`);
      toast.success(`Exported ${orders.length} orders to JSON`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export orders");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const orders = await fetchOrdersForExport();
      
      const headers = [
        "Order Number", "Status", "Total", "Subtotal", "Shipping", 
        "Payment Method", "Customer Name", "Phone", "Division", "District", 
        "Thana", "Address", "Items", "Created At"
      ];

      const rows = orders.map((order: any) => [
        order.order_number,
        order.status,
        order.total,
        order.subtotal,
        order.shipping_cost,
        order.payment_method,
        order.address?.full_name || "",
        order.address?.phone || "",
        order.address?.division || "",
        order.address?.district || "",
        order.address?.thana || "",
        order.address?.address_line || "",
        (order.order_items || []).map((i: any) => `${i.product_name} x${i.quantity}`).join("; "),
        new Date(order.created_at).toLocaleString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `orders_export_${new Date().toISOString().split("T")[0]}.csv`);
      toast.success(`Exported ${orders.length} orders to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export orders");
    } finally {
      setExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="h-4 w-4 mr-2" />
          Export to CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export to JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrderExportTools;
