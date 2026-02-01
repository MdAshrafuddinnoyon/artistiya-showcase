import { useState, useEffect } from "react";
import { Save, Shield, Clock, Phone, Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FraudSettings {
  id: string;
  guest_checkout_enabled: boolean;
  order_rate_limit_seconds: number;
  max_orders_per_phone_24h: number;
  max_cod_amount_new_customer: number;
  block_suspicious_orders: boolean;
  require_captcha_for_guest: boolean;
}

interface BlockedCustomer {
  id: string;
  phone: string | null;
  email: string | null;
  ip_address: string | null;
  block_reason: string;
  blocked_at: string;
  is_active: boolean;
}

interface FraudFlag {
  id: string;
  order_id: string;
  flag_type: string;
  flag_reason: string;
  severity: string;
  is_resolved: boolean;
  created_at: string;
}

const AdminFraudSettings = () => {
  const [settings, setSettings] = useState<FraudSettings | null>(null);
  const [blockedCustomers, setBlockedCustomers] = useState<BlockedCustomer[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New block form
  const [newBlockPhone, setNewBlockPhone] = useState("");
  const [newBlockEmail, setNewBlockEmail] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, blockedRes, flagsRes] = await Promise.all([
        supabase.from("checkout_fraud_settings").select("*").single(),
        supabase.from("blocked_customers").select("*").eq("is_active", true).order("blocked_at", { ascending: false }),
        supabase.from("order_fraud_flags").select("*").eq("is_resolved", false).order("created_at", { ascending: false }).limit(50),
      ]);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (blockedRes.data) setBlockedCustomers(blockedRes.data);
      if (flagsRes.data) setFraudFlags(flagsRes.data);
    } catch (error) {
      console.error("Error fetching fraud settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("fraud-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_fraud_flags" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "blocked_customers" }, () => fetchData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("checkout_fraud_settings")
        .update({
          guest_checkout_enabled: settings.guest_checkout_enabled,
          order_rate_limit_seconds: settings.order_rate_limit_seconds,
          max_orders_per_phone_24h: settings.max_orders_per_phone_24h,
          max_cod_amount_new_customer: settings.max_cod_amount_new_customer,
          block_suspicious_orders: settings.block_suspicious_orders,
          require_captcha_for_guest: settings.require_captcha_for_guest,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const blockCustomer = async () => {
    if (!newBlockPhone && !newBlockEmail) {
      toast.error("Enter phone or email to block");
      return;
    }
    if (!newBlockReason.trim()) {
      toast.error("Enter a reason");
      return;
    }

    try {
      const { error } = await supabase.from("blocked_customers").insert({
        phone: newBlockPhone || null,
        email: newBlockEmail || null,
        block_reason: newBlockReason,
        is_active: true,
      });

      if (error) throw error;
      toast.success("Customer blocked!");
      setNewBlockPhone("");
      setNewBlockEmail("");
      setNewBlockReason("");
      fetchData();
    } catch (error) {
      console.error("Error blocking customer:", error);
      toast.error("Failed to block customer");
    }
  };

  const unblockCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("blocked_customers")
        .update({ is_active: false, unblocked_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Customer unblocked!");
      fetchData();
    } catch (error) {
      console.error("Error unblocking customer:", error);
      toast.error("Failed to unblock customer");
    }
  };

  const resolveFlag = async (id: string) => {
    try {
      const { error } = await supabase
        .from("order_fraud_flags")
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Flag resolved!");
      fetchData();
    } catch (error) {
      console.error("Error resolving flag:", error);
      toast.error("Failed to resolve flag");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  if (loading) {
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold" />
            Fraud Detection & Guest Checkout
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage checkout security and blocked customers
          </p>
        </div>
        <Button variant="gold" onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="bg-muted">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="blocked">Blocked ({blockedCustomers.length})</TabsTrigger>
          <TabsTrigger value="flags">Fraud Alerts ({fraudFlags.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-6">
          {settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guest Checkout</CardTitle>
                  <CardDescription>Control guest checkout options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Guest Checkout</Label>
                      <p className="text-xs text-muted-foreground">Allow orders without login</p>
                    </div>
                    <Switch
                      checked={settings.guest_checkout_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, guest_checkout_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require CAPTCHA for Guests</Label>
                      <p className="text-xs text-muted-foreground">Add verification step</p>
                    </div>
                    <Switch
                      checked={settings.require_captcha_for_guest}
                      onCheckedChange={(checked) => setSettings({ ...settings, require_captcha_for_guest: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Rate Limiting
                  </CardTitle>
                  <CardDescription>Prevent spam orders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Minimum seconds between orders</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.order_rate_limit_seconds}
                      onChange={(e) => setSettings({ ...settings, order_rate_limit_seconds: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Max orders per phone (24 hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.max_orders_per_phone_24h}
                      onChange={(e) => setSettings({ ...settings, max_orders_per_phone_24h: parseInt(e.target.value) || 1 })}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Max COD amount for new customers (৳)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.max_cod_amount_new_customer}
                      onChange={(e) => setSettings({ ...settings, max_cod_amount_new_customer: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Block Suspicious Orders</Label>
                      <p className="text-xs text-muted-foreground">Auto-flag high-risk orders</p>
                    </div>
                    <Switch
                      checked={settings.block_suspicious_orders}
                      onCheckedChange={(checked) => setSettings({ ...settings, block_suspicious_orders: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocked" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Block Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={newBlockPhone}
                    onChange={(e) => setNewBlockPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={newBlockEmail}
                    onChange={(e) => setNewBlockEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    placeholder="Reason for blocking"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <Button onClick={blockCustomer} variant="destructive">
                <Ban className="h-4 w-4 mr-2" />
                Block Customer
              </Button>
            </CardContent>
          </Card>

          {blockedCustomers.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone/Email</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          {customer.phone || customer.email || customer.ip_address}
                        </TableCell>
                        <TableCell>{customer.block_reason}</TableCell>
                        <TableCell>{new Date(customer.blocked_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => unblockCustomer(customer.id)}>
                            Unblock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No blocked customers
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flags" className="space-y-6 mt-6">
          {fraudFlags.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fraudFlags.map((flag) => (
                      <TableRow key={flag.id}>
                        <TableCell className="font-medium">{flag.flag_type}</TableCell>
                        <TableCell>{flag.flag_reason}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(flag.severity)}>
                            {flag.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(flag.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => resolveFlag(flag.id)}>
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                No fraud alerts - all clear!
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFraudSettings;
