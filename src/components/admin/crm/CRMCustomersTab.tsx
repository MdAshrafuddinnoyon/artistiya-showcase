import { Users, Star, Mail, Phone, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CRMDataTable from "./CRMDataTable";

interface TopCustomer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  isPremium: boolean;
}

interface CRMCustomersTabProps {
  customers: TopCustomer[];
  allCustomers?: any[];
}

const CRMCustomersTab = ({ customers, allCustomers = [] }: CRMCustomersTabProps) => {
  const customerColumns = [
    {
      key: "rank",
      label: "#",
      width: "50px",
      render: (customer: TopCustomer & { rank?: number }) => (
        <span className="font-bold text-gold">#{customer.rank || 1}</span>
      ),
    },
    {
      key: "fullName",
      label: "Customer",
      sortable: true,
      render: (customer: TopCustomer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{customer.fullName}</span>
              {customer.isPremium && (
                <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                  <Star className="h-3 w-3 mr-1" /> Premium
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{customer.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "totalOrders",
      label: "Orders",
      sortable: true,
      render: (customer: TopCustomer) => (
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <span>{customer.totalOrders}</span>
        </div>
      ),
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      sortable: true,
      render: (customer: TopCustomer) => (
        <span className="font-bold text-gold">৳{customer.totalSpent.toLocaleString()}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (customer: TopCustomer) => (
        <Badge variant={customer.isPremium ? "default" : "outline"}>
          {customer.isPremium ? "Premium" : "Regular"}
        </Badge>
      ),
    },
  ];

  // Add index to customers for ranking
  const customersWithIndex = customers.map((c, i) => ({ ...c, rank: i + 1 }));

  const exportData = allCustomers.length > 0 
    ? allCustomers.map((c) => ({
        name: c.full_name,
        email: c.email,
        phone: c.phone || "N/A",
        total_orders: c.total_orders || 0,
        total_spent: c.total_spent || 0,
        is_premium: c.is_premium_member ? "Yes" : "No",
        discount_percentage: c.discount_percentage || 0,
        created_at: new Date(c.created_at).toLocaleDateString(),
      }))
    : customersWithIndex.map((c) => ({
        name: c.fullName,
        email: c.email,
        total_orders: c.totalOrders,
        total_spent: c.totalSpent,
        is_premium: c.isPremium ? "Yes" : "No",
      }));

  return (
    <CRMDataTable
      data={customersWithIndex}
      columns={customerColumns}
      title="Top Customers"
      subtitle="Customers ranked by total spending"
      searchKey="fullName"
      searchPlaceholder="Search customers..."
      enableSelection={true}
      exportFilename="customers_report"
      maxHeight="500px"
      emptyMessage="No customer data available"
      filters={[
        {
          key: "isPremium",
          label: "Status",
          options: [
            { value: "true", label: "Premium" },
            { value: "false", label: "Regular" },
          ],
        },
      ]}
    />
  );
};

export default CRMCustomersTab;
