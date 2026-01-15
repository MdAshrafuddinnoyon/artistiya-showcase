import { useState, useEffect } from "react";
import { Search, Check, X, Phone, Mail, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  message: string | null;
  is_contacted: boolean;
  notes: string | null;
  created_at: string;
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const toggleContacted = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ is_contacted: !lead.is_contacted })
        .eq("id", lead.id);

      if (error) throw error;
      toast.success(lead.is_contacted ? "Marked as not contacted" : "Marked as contacted");
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    }
  };

  const saveNotes = async () => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", selectedLead.id);

      if (error) throw error;
      toast.success("Notes saved!");
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery)
  );

  const stats = {
    total: leads.length,
    contacted: leads.filter((l) => l.is_contacted).length,
    pending: leads.filter((l) => !l.is_contacted).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage collected leads</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Leads</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-green-500">{stats.contacted}</p>
          <p className="text-sm text-muted-foreground">Contacted</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-gold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No leads found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-foreground">{lead.name}</h3>
                    <Badge
                      variant={lead.is_contacted ? "default" : "secondary"}
                      className={lead.is_contacted ? "bg-green-500/20 text-green-500" : ""}
                    >
                      {lead.is_contacted ? "Contacted" : "Pending"}
                    </Badge>
                    <Badge variant="outline">{lead.source}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {lead.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {lead.message && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      {lead.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLead(lead);
                      setNotes(lead.notes || "");
                    }}
                  >
                    Notes
                  </Button>
                  <Button
                    variant={lead.is_contacted ? "ghost" : "gold"}
                    size="sm"
                    onClick={() => toggleContacted(lead)}
                  >
                    {lead.is_contacted ? (
                      <X className="h-4 w-4 mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {lead.is_contacted ? "Unmark" : "Mark Contacted"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes for {selectedLead?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add notes about this lead..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={saveNotes}>
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;