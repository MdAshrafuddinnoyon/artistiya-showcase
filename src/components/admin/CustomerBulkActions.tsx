import { useState } from "react";
import { Trash2, Percent, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomerBulkActionsProps {
  selectedIds: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

const CustomerBulkActions = ({
  selectedIds,
  onActionComplete,
  onClearSelection,
}: CustomerBulkActionsProps) => {
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} customer(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`Deleted ${selectedIds.length} customer(s)`);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete customers");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDiscount = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({ discount_percentage: discountValue })
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`Updated discount for ${selectedIds.length} customer(s)`);
      setShowDiscountDialog(false);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error("Bulk discount error:", error);
      toast.error("Failed to update discounts");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPremium = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          is_premium_member: isPremium,
          premium_expires_at: premiumExpiry || null,
        })
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`Updated premium status for ${selectedIds.length} customer(s)`);
      setShowPremiumDialog(false);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error("Bulk premium error:", error);
      toast.error("Failed to update premium status");
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-gold/10 border border-gold/30 rounded-lg">
        <span className="text-sm font-medium text-foreground">
          {selectedIds.length} selected
        </span>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDiscountDialog(true)}
          disabled={loading}
        >
          <Percent className="h-4 w-4 mr-1" />
          Set Discount
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPremiumDialog(true)}
          disabled={loading}
        >
          <Crown className="h-4 w-4 mr-1" />
          Premium Status
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-1" />
          )}
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Bulk Discount</DialogTitle>
            <DialogDescription>
              Apply discount percentage to {selectedIds.length} customer(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter 0 to remove discount
              </p>
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={handleBulkDiscount}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Percent className="h-4 w-4 mr-2" />
              )}
              Apply to {selectedIds.length} Customer(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Dialog */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Premium Status</DialogTitle>
            <DialogDescription>
              Update premium membership for {selectedIds.length} customer(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between bg-gold/10 p-3 rounded-lg border border-gold/30">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-gold" />
                <Label className="text-gold">Premium Member</Label>
              </div>
              <Switch
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
            </div>
            {isPremium && (
              <div>
                <Label>Premium Expires On</Label>
                <Input
                  type="date"
                  value={premiumExpiry}
                  onChange={(e) => setPremiumExpiry(e.target.value)}
                />
              </div>
            )}
            <Button
              variant="gold"
              className="w-full"
              onClick={handleBulkPremium}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Apply to {selectedIds.length} Customer(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerBulkActions;
