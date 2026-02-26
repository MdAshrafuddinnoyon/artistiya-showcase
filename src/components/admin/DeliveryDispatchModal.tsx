import { useState, useEffect } from "react";
import { Truck, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderForDispatch {
  id: string;
  order_number: string;
  total: number;
  payment_method: string;
  address: {
    full_name: string;
    phone: string;
    division: string;
    district: string;
    thana: string;
    address_line: string;
  } | null;
}

interface DeliveryProvider {
  id: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  config: any;
}

interface DispatchResult {
  orderId: string;
  orderNumber: string;
  success: boolean;
  trackingId?: string;
  error?: string;
}

interface DeliveryDispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: OrderForDispatch[];
  onDispatchComplete: () => void;
}

const DeliveryDispatchModal = ({
  open,
  onOpenChange,
  orders,
  onDispatchComplete,
}: DeliveryDispatchModalProps) => {
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [results, setResults] = useState<DispatchResult[]>([]);
  const [step, setStep] = useState<"select" | "dispatching" | "results">("select");

  useEffect(() => {
    if (open) {
      fetchProviders();
      setStep("select");
      setResults([]);
      setSelectedProviderId("");
    }
  }, [open]);

  const fetchProviders = async () => {
    const { data } = await supabase
      .from("delivery_providers")
      .select("*")
      .eq("is_active", true);
    setProviders(data || []);
  };

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  const buildOrderPayload = (order: OrderForDispatch, providerType: string) => {
    const addr = order.address;
    if (!addr) return null;

    const codAmount = order.payment_method === "cod" ? order.total : 0;

    switch (providerType) {
      case "pathao":
        return {
          order_number: order.order_number,
          recipient_name: addr.full_name,
          recipient_phone: addr.phone,
          recipient_address: `${addr.address_line}, ${addr.thana}, ${addr.district}`,
          recipient_city: addr.district,
          recipient_zone: addr.thana,
          amount_to_collect: codAmount,
          quantity: 1,
          weight: 0.5,
        };
      case "steadfast":
        return {
          order_number: order.order_number,
          recipient_name: addr.full_name,
          recipient_phone: addr.phone,
          recipient_address: `${addr.address_line}, ${addr.thana}, ${addr.district}, ${addr.division}`,
          cod_amount: codAmount,
        };
      case "redx":
        return {
          order_number: order.order_number,
          customer_name: addr.full_name,
          customer_phone: addr.phone,
          customer_address: `${addr.address_line}, ${addr.thana}, ${addr.district}`,
          delivery_area: addr.district,
          cash_collection: codAmount,
          value: order.total,
          weight: 500,
        };
      case "paperfly":
        return {
          order_number: order.order_number,
          customer_name: addr.full_name,
          customer_phone: addr.phone,
          customer_address: addr.address_line,
          customer_thana: addr.thana,
          customer_district: addr.district,
          package_price: codAmount,
        };
      case "ecourier":
        return {
          order_number: order.order_number,
          recipient_name: addr.full_name,
          recipient_mobile: addr.phone,
          recipient_address: addr.address_line,
          recipient_city: addr.district,
          recipient_thana: addr.thana,
          product_price: String(order.total),
          payment_method: order.payment_method === "cod" ? "COD" : "PREPAID",
        };
      case "deliverytiger":
        return {
          order_number: order.order_number,
          customer_name: addr.full_name,
          customer_phone: addr.phone,
          customer_address: `${addr.address_line}, ${addr.thana}, ${addr.district}`,
          cod_amount: codAmount,
          weight: 0.5,
          district: addr.district,
          thana: addr.thana,
        };
      default:
        return null;
    }
  };

  const handleDispatch = async () => {
    if (!selectedProvider) return;

    setDispatching(true);
    setStep("dispatching");
    const dispatchResults: DispatchResult[] = [];

    // For Steadfast bulk support
    if (selectedProvider.provider_type === "steadfast" && orders.length > 1) {
      try {
        const bulkOrders = orders
          .filter((o) => o.address)
          .map((o) => {
            const payload = buildOrderPayload(o, "steadfast");
            return {
              invoice: payload?.order_number,
              recipient_name: payload?.recipient_name,
              recipient_phone: payload?.recipient_phone,
              recipient_address: payload?.recipient_address,
              cod_amount: payload?.cod_amount || 0,
            };
          });

        const { data, error } = await supabase.functions.invoke("delivery-api", {
          body: {
            provider_type: "steadfast",
            action: "bulk_create",
            provider_id: selectedProvider.id,
            orders: bulkOrders,
          },
        });

        if (error) throw error;

        // Process bulk results
        for (const order of orders) {
          const result: DispatchResult = {
            orderId: order.id,
            orderNumber: order.order_number,
            success: !error,
            trackingId: data?.consignment_id,
          };
          dispatchResults.push(result);

          if (result.success) {
            await supabase
              .from("orders")
              .update({
                status: "shipped" as any,
                delivery_partner_id: null,
                tracking_number: result.trackingId || null,
              })
              .eq("id", order.id);
          }
        }
      } catch (err: any) {
        for (const order of orders) {
          dispatchResults.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: err.message || "Bulk dispatch failed",
          });
        }
      }
    } else {
      // Single dispatch for each order
      for (const order of orders) {
        if (!order.address) {
          dispatchResults.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: "No address found",
          });
          continue;
        }

        try {
          const payload = buildOrderPayload(order, selectedProvider.provider_type);
          if (!payload) {
            dispatchResults.push({
              orderId: order.id,
              orderNumber: order.order_number,
              success: false,
              error: "Unsupported provider type",
            });
            continue;
          }

          const actionName =
            selectedProvider.provider_type === "pathao" ? "create_order" :
            selectedProvider.provider_type === "redx" ? "create_parcel" :
            "create_order";

          const { data, error } = await supabase.functions.invoke("delivery-api", {
            body: {
              provider_type: selectedProvider.provider_type,
              action: actionName,
              provider_id: selectedProvider.id,
              ...payload,
            },
          });

          if (error) throw error;

          const trackingId =
            data?.consignment_id ||
            data?.tracking_code ||
            data?.tracking_id ||
            data?.data?.consignment_id ||
            data?.data?.tracking_code ||
            null;

          dispatchResults.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: true,
            trackingId,
          });

          // Update order status and tracking
          await supabase
            .from("orders")
            .update({
              status: "shipped" as any,
              tracking_number: trackingId || null,
            })
            .eq("id", order.id);
        } catch (err: any) {
          dispatchResults.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: err.message || "Dispatch failed",
          });
        }
      }
    }

    setResults(dispatchResults);
    setStep("results");
    setDispatching(false);

    const successCount = dispatchResults.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(`${successCount}/${orders.length} orders dispatched successfully`);
      onDispatchComplete();
    }
    if (successCount < orders.length) {
      toast.error(`${orders.length - successCount} orders failed to dispatch`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Dispatch to Delivery Partner
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {/* Order summary */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">
                {orders.length} order{orders.length > 1 ? "s" : ""} selected
              </p>
              <ScrollArea className="max-h-32 mt-2">
                <div className="space-y-1">
                  {orders.map((o) => (
                    <div key={o.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{o.order_number}</span>
                      <span>{o.address?.full_name || "No address"}</span>
                      <span>৳{o.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Provider selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Select Delivery Provider
              </label>
              {providers.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  No active delivery providers configured. Please add one in Settings → Delivery Providers.
                </div>
              ) : (
                <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {p.name}
                          <Badge variant="outline" className="text-xs ml-1">
                            {p.provider_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Warnings */}
            {orders.some((o) => !o.address) && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                Some orders have no delivery address and will be skipped.
              </div>
            )}
          </div>
        )}

        {step === "dispatching" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Dispatching {orders.length} order{orders.length > 1 ? "s" : ""} to{" "}
              {selectedProvider?.name}...
            </p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-3">
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {results.map((r) => (
                  <div
                    key={r.orderId}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                      r.success
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-destructive/10 border border-destructive/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {r.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium">{r.orderNumber}</span>
                    </div>
                    <div className="text-xs text-right">
                      {r.success && r.trackingId ? (
                        <span className="text-green-600">Tracking: {r.trackingId}</span>
                      ) : r.error ? (
                        <span className="text-destructive">{r.error}</span>
                      ) : r.success ? (
                        <span className="text-green-600">Dispatched</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 justify-between text-sm pt-2 border-t border-border">
              <span className="text-green-600">
                ✓ {results.filter((r) => r.success).length} successful
              </span>
              {results.some((r) => !r.success) && (
                <span className="text-destructive">
                  ✗ {results.filter((r) => !r.success).length} failed
                </span>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "select" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDispatch}
                disabled={!selectedProviderId || providers.length === 0}
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                Dispatch {orders.length > 1 ? `${orders.length} Orders` : "Order"}
              </Button>
            </>
          )}
          {step === "results" && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDispatchModal;
