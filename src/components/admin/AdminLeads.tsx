import { useState, useEffect } from "react";
import { Search, Phone, Mail, MessageCircle, Trash2, Eye, Filter, Download, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import BulkSelectionToolbar from "./BulkSelectionToolbar";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  is_contacted: boolean | null;
  notes: string | null;
  created_at: string;
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [contactedFilter, setContactedFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter);
      }

      if (contactedFilter === "contacted") {
        query = query.eq("is_contacted", true);
      } else if (contactedFilter === "not_contacted") {
        query = query.eq("is_contacted", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("leads_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sourceFilter, contactedFilter]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);

    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map((l) => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  const handleMarkContacted = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ is_contacted: true })
        .eq("id", leadId);

      if (error) throw error;
      toast.success("Lead marked as contacted");
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    }
  };

  const handleBulkMarkContacted = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ is_contacted: true })
        .in("id", selectedLeads);

      if (error) throw error;
      toast.success(`${selectedLeads.length} leads marked as contacted`);
      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      console.error("Error updating leads:", error);
      toast.error("Failed to update leads");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedLeads.length} leads permanently?`)) return;

    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", selectedLeads);

      if (error) throw error;
      toast.success(`${selectedLeads.length} leads deleted`);
      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast.error("Failed to delete leads");
    }
  };

  const handleSaveNotes = async () => {
    if (!detailLead) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", detailLead.id);

      if (error) throw error;
      toast.success("Notes saved");
      setDetailLead(null);
      fetchLeads();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `হ্যালো ${name}! আপনি আমাদের স্টোর থেকে প্রোডাক্ট দেখেছিলেন। কোন সাহায্য প্রয়োজন?`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  const getSourceBadge = (source: string | null) => {
    const colors: Record<string, string> = {
      whatsapp_click: "bg-green-500/20 text-green-400 border-green-500/30",
      cart_abandon: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      website: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      contact_form: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    const labels: Record<string, string> = {
      whatsapp_click: "WhatsApp Click",
      cart_abandon: "Cart Abandon",
      website: "Website",
      contact_form: "Contact Form",
    };
    return (
      <Badge className={colors[source || "website"] || colors.website}>
        {labels[source || "website"] || source}
      </Badge>
    );
  };

  const exportLeads = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Source", "Contacted", "Date", "Notes"].join(","),
      ...filteredLeads.map((l) =>
        [
          l.name,
          l.email || "",
          l.phone || "",
          l.source || "",
          l.is_contacted ? "Yes" : "No",
          format(new Date(l.created_at), "yyyy-MM-dd"),
          l.notes || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Lead Management</h1>
          <p className="text-muted-foreground text-sm">
            Track WhatsApp clicks, cart abandonment, and customer inquiries
          </p>
        </div>
        <Button variant="outline" onClick={exportLeads}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="whatsapp_click">WhatsApp Click</SelectItem>
            <SelectItem value="cart_abandon">Cart Abandon</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="contact_form">Contact Form</SelectItem>
          </SelectContent>
        </Select>
        <Select value={contactedFilter} onValueChange={setContactedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="not_contacted">Not Contacted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <BulkSelectionToolbar
          selectedIds={selectedLeads}
          totalCount={filteredLeads.length}
          onSelectAll={() => setSelectedLeads(filteredLeads.map((l) => l.id))}
          onDeselectAll={() => setSelectedLeads([])}
          onBulkDelete={handleBulkDelete}
          customActions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMarkContacted}
              className="gap-1.5"
            >
              <Check className="h-4 w-4" />
              Mark Contacted
            </Button>
          }
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm">Total Leads</p>
          <p className="text-2xl font-bold text-foreground">{leads.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm">WhatsApp Clicks</p>
          <p className="text-2xl font-bold text-green-400">
            {leads.filter((l) => l.source === "whatsapp_click").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm">Cart Abandons</p>
          <p className="text-2xl font-bold text-orange-400">
            {leads.filter((l) => l.source === "cart_abandon").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm">Not Contacted</p>
          <p className="text-2xl font-bold text-gold">
            {leads.filter((l) => !l.is_contacted).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredLeads.length > 0 &&
                    selectedLeads.length === filteredLeads.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-12 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) =>
                        handleSelectLead(lead.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      {lead.message && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {lead.message}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {lead.phone && (
                        <span className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                      )}
                      {lead.email && (
                        <span className="text-sm flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getSourceBadge(lead.source)}</TableCell>
                  <TableCell>
                    {lead.is_contacted ? (
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        Contacted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gold text-gold">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(lead.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDetailLead(lead);
                          setNotes(lead.notes || "");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {lead.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-500 hover:text-green-400"
                          onClick={() => openWhatsApp(lead.phone!, lead.name)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {!lead.is_contacted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkContacted(lead.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Contacted
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailLead} onOpenChange={() => setDetailLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{detailLead.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <div className="mt-1">{getSourceBadge(detailLead.source)}</div>
                </div>
                {detailLead.phone && (
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{detailLead.phone}</p>
                  </div>
                )}
                {detailLead.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{detailLead.email}</p>
                  </div>
                )}
              </div>

              {detailLead.message && (
                <div>
                  <Label className="text-muted-foreground">Message / Product Info</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {detailLead.message}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="gold" onClick={handleSaveNotes} className="flex-1">
                  Save Notes
                </Button>
                {detailLead.phone && (
                  <Button
                    variant="outline"
                    onClick={() => openWhatsApp(detailLead.phone!, detailLead.name)}
                    className="text-green-500"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;