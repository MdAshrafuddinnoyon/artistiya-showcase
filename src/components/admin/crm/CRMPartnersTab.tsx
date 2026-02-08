import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CRMDataTable from "./CRMDataTable";

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

interface CRMPartnersTabProps {
  partners: DeliveryPartnerStats[];
}

const CRMPartnersTab = ({ partners }: CRMPartnersTabProps) => {
  const partnerColumns = [
    {
      key: "partnerName",
      label: "Partner",
      sortable: true,
      render: (partner: DeliveryPartnerStats) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-gold" />
          </div>
          <span className="font-medium">{partner.partnerName}</span>
        </div>
      ),
    },
    {
      key: "totalSent",
      label: "Total Orders",
      sortable: true,
      render: (partner: DeliveryPartnerStats) => (
        <Badge variant="outline">{partner.totalSent} orders</Badge>
      ),
    },
    {
      key: "delivered",
      label: "Delivered",
      sortable: true,
      render: (partner: DeliveryPartnerStats) => (
        <span className="text-green-500 font-semibold">{partner.delivered}</span>
      ),
    },
    {
      key: "returned",
      label: "Returned",
      sortable: true,
      render: (partner: DeliveryPartnerStats) => (
        <span className="text-orange-500 font-semibold">{partner.returned}</span>
      ),
    },
    {
      key: "successRate",
      label: "Success Rate",
      sortable: true,
      render: (partner: DeliveryPartnerStats) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={partner.successRate} className="h-2 flex-1" />
          <span className="text-sm font-medium text-blue-500">{partner.successRate.toFixed(1)}%</span>
        </div>
      ),
    },
    {
      key: "pendingPayment",
      label: "Pending",
      sortable: true,
      render: (partner: DeliveryPartnerStats) => (
        <span className="text-yellow-500 font-semibold">৳{partner.pendingPayment.toLocaleString()}</span>
      ),
    },
    {
      key: "receivedPayment",
      label: "Received",
      sortable: true,
      render: (partner: DeliveryPartnerStats) => (
        <span className="text-green-500 font-semibold">৳{partner.receivedPayment.toLocaleString()}</span>
      ),
    },
  ];

  const exportData = partners.map((p) => ({
    partner: p.partnerName,
    total_orders: p.totalSent,
    delivered: p.delivered,
    returned: p.returned,
    success_rate: `${p.successRate.toFixed(1)}%`,
    pending_payment: p.pendingPayment,
    received_payment: p.receivedPayment,
  }));

  // Map partners to include id field for the table
  const partnersWithId = partners.map(p => ({ ...p, id: p.partnerId }));

  return (
    <CRMDataTable
      data={partnersWithId}
      columns={partnerColumns as any}
      title="Delivery Partner Performance"
      subtitle="Orders and payments by delivery company"
      idKey="id"
      searchKey="partnerName"
      searchPlaceholder="Search partners..."
      enableSelection={true}
      exportFilename="partner_report"
      maxHeight="400px"
      emptyMessage="No delivery partners configured"
    />
  );
};

export default CRMPartnersTab;
