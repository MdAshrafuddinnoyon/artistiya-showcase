import { DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import CRMDataTable from "./CRMDataTable";

interface PaymentStats {
  pendingPayments: number;
  receivedPayments: number;
}

interface PaymentRecord {
  id: string;
  orderNumber: string;
  partnerName: string;
  amount: number;
  status: "pending" | "received";
  dueDate?: string;
}

interface CRMPaymentsTabProps {
  stats: PaymentStats;
  paymentRecords?: PaymentRecord[];
  orders?: any[];
}

const CRMPaymentsTab = ({ stats, paymentRecords = [], orders = [] }: CRMPaymentsTabProps) => {
  const collectionRate = (stats.pendingPayments + stats.receivedPayments) > 0
    ? (stats.receivedPayments / (stats.pendingPayments + stats.receivedPayments)) * 100
    : 0;

  // Generate payment records from orders if not provided
  const records: PaymentRecord[] = paymentRecords.length > 0 
    ? paymentRecords 
    : orders
        .filter((o) => o.partner_payment_status && o.delivery_partner)
        .map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          partnerName: o.delivery_partner?.name || "Unknown",
          amount: o.partner_payment_amount || o.total || 0,
          status: o.partner_payment_status as "pending" | "received",
          dueDate: o.partner_payment_due_date,
        }));

  const paymentColumns = [
    {
      key: "orderNumber",
      label: "Order #",
      sortable: true,
    },
    {
      key: "partnerName",
      label: "Partner",
      sortable: true,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (record: PaymentRecord) => (
        <span className="font-bold">৳{record.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (record: PaymentRecord) => (
        <Badge 
          variant="outline" 
          className={record.status === "received" 
            ? "border-green-500 text-green-500" 
            : "border-yellow-500 text-yellow-500"
          }
        >
          {record.status === "received" ? (
            <><CheckCircle className="h-3 w-3 mr-1" /> Received</>
          ) : (
            <><Clock className="h-3 w-3 mr-1" /> Pending</>
          )}
        </Badge>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (record: PaymentRecord) => (
        record.dueDate 
          ? new Date(record.dueDate).toLocaleDateString() 
          : "-"
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-7 w-7 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-500">৳{stats.pendingPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Received Payments</p>
                <p className="text-3xl font-bold text-green-500">৳{stats.receivedPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gold/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expected</p>
                <p className="text-3xl font-bold text-gold">
                  ৳{(stats.pendingPayments + stats.receivedPayments).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Collection Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Collection Progress</span>
              <span className="font-bold text-green-500">{collectionRate.toFixed(1)}%</span>
            </div>
            <Progress value={collectionRate} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Received: ৳{stats.receivedPayments.toLocaleString()}</span>
              <span>Pending: ৳{stats.pendingPayments.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records Table */}
      {records.length > 0 && (
        <CRMDataTable
          data={records}
          columns={paymentColumns}
          title="Payment Records"
          subtitle="Individual payment tracking by order"
          searchKey="orderNumber"
          searchPlaceholder="Search order number..."
          enableSelection={true}
          exportFilename="payments_report"
          maxHeight="350px"
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "pending", label: "Pending" },
                { value: "received", label: "Received" },
              ],
            },
          ]}
        />
      )}
    </div>
  );
};

export default CRMPaymentsTab;
