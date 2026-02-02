import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users, Settings, Download, Trash2, Search, RefreshCw } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  subscribed_at: string;
  source: string | null;
}

interface NewsletterSettings {
  id: string;
  is_enabled: boolean;
  title: string | null;
  title_bn: string | null;
  subtitle: string | null;
  subtitle_bn: string | null;
  button_text: string | null;
  button_text_bn: string | null;
  placeholder_text: string | null;
  success_message: string | null;
}

const AdminNewsletterSubscribers = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [settings, setSettings] = useState<NewsletterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("subscribers");

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("newsletter-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "newsletter_subscribers" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "newsletter_settings" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, settingsRes] = await Promise.all([
        supabase
          .from("newsletter_subscribers")
          .select("*")
          .order("subscribed_at", { ascending: false }),
        supabase.from("newsletter_settings").select("*").single(),
      ]);

      if (subsRes.data) setSubscribers(subsRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (error) {
      console.error("Error fetching newsletter data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscriberStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ 
        is_active: !currentStatus,
        unsubscribed_at: !currentStatus ? null : new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Subscriber status updated" });
    }
  };

  const deleteSubscriber = async (id: string) => {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Subscriber removed" });
    }
  };

  const updateSettings = async () => {
    if (!settings) return;

    const { error } = await supabase
      .from("newsletter_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Newsletter settings updated" });
    }
  };

  const exportSubscribers = () => {
    const activeSubscribers = subscribers.filter((s) => s.is_active);
    const csvContent = [
      ["Email", "Name", "Subscribed At", "Source"],
      ...activeSubscribers.map((s) => [
        s.email,
        s.full_name || "",
        new Date(s.subscribed_at).toLocaleDateString(),
        s.source || "footer",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: `${activeSubscribers.length} subscribers exported` });
  };

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.full_name && s.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = subscribers.filter((s) => s.is_active).length;
  const totalCount = subscribers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Newsletter</h2>
          <p className="text-muted-foreground">Manage subscribers and settings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/10 rounded-lg">
                <Users className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Mail className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Users className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount - activeCount}</p>
                <p className="text-sm text-muted-foreground">Unsubscribed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Subscriber List</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" onClick={exportSubscribers}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No subscribers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.email}</TableCell>
                        <TableCell>{sub.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {sub.source || "footer"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(sub.subscribed_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sub.is_active ? "default" : "secondary"}
                            className={sub.is_active ? "bg-green-500" : ""}
                          >
                            {sub.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={sub.is_active}
                              onCheckedChange={() =>
                                toggleSubscriberStatus(sub.id, sub.is_active)
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSubscriber(sub.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Newsletter</Label>
                    <p className="text-sm text-muted-foreground">
                      Show newsletter subscription form in footer
                    </p>
                  </div>
                  <Switch
                    checked={settings.is_enabled}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, is_enabled: v })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title (English)</Label>
                    <Input
                      value={settings.title || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title (Bengali)</Label>
                    <Input
                      value={settings.title_bn || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, title_bn: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subtitle (English)</Label>
                    <Input
                      value={settings.subtitle || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, subtitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle (Bengali)</Label>
                    <Input
                      value={settings.subtitle_bn || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, subtitle_bn: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={settings.button_text || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, button_text: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Placeholder Text</Label>
                    <Input
                      value={settings.placeholder_text || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          placeholder_text: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Success Message</Label>
                  <Input
                    value={settings.success_message || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        success_message: e.target.value,
                      })
                    }
                  />
                </div>

                <Button onClick={updateSettings} className="bg-gold hover:bg-gold/90">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNewsletterSubscribers;
