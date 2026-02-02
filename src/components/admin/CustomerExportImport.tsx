import { useState, useRef } from "react";
import { Download, Upload, FileText, Table, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomerExportImportProps {
  selectedIds?: string[];
  onImportComplete?: () => void;
}

const CustomerExportImport = ({ selectedIds = [], onImportComplete }: CustomerExportImportProps) => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomersForExport = async () => {
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (selectedIds.length > 0) {
      query = query.in("id", selectedIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const exportToJSON = async () => {
    setExporting(true);
    try {
      const customers = await fetchCustomersForExport();
      const blob = new Blob([JSON.stringify(customers, null, 2)], { type: "application/json" });
      downloadBlob(blob, `customers_export_${new Date().toISOString().split("T")[0]}.json`);
      toast.success(`Exported ${customers.length} customers to JSON`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export customers");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const customers = await fetchCustomersForExport();

      const headers = [
        "ID", "Email", "Full Name", "Phone", "Discount %",
        "Premium Member", "Premium Expires", "Total Orders",
        "Total Spent", "Notes", "Created At"
      ];

      const rows = customers.map((c) => [
        c.id,
        c.email,
        c.full_name,
        c.phone || "",
        c.discount_percentage || 0,
        c.is_premium_member ? "Yes" : "No",
        c.premium_expires_at || "",
        c.total_orders || 0,
        c.total_spent || 0,
        c.notes || "",
        new Date(c.created_at).toLocaleString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `customers_export_${new Date().toISOString().split("T")[0]}.csv`);
      toast.success(`Exported ${customers.length} customers to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export customers");
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

  const handleImportClick = () => {
    setShowImportDialog(true);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      let customers: any[] = [];

      if (file.name.endsWith(".json")) {
        customers = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n");
        const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
          const customer: any = {};

          headers.forEach((header, index) => {
            let value = values[index]?.replace(/^"|"$/g, "").replace(/""/g, '"').trim() || "";

            if (header === "email") customer.email = value;
            else if (header === "full name" || header === "full_name") customer.full_name = value;
            else if (header === "phone") customer.phone = value || null;
            else if (header === "discount %" || header === "discount_percentage") customer.discount_percentage = parseFloat(value) || 0;
            else if (header === "premium member" || header === "is_premium_member") customer.is_premium_member = value.toLowerCase() === "yes" || value === "true";
            else if (header === "premium expires" || header === "premium_expires_at") customer.premium_expires_at = value || null;
            else if (header === "notes") customer.notes = value || null;
          });

          if (customer.email && customer.full_name) {
            customers.push(customer);
          }
        }
      }

      if (customers.length === 0) {
        toast.error("No valid customers found in file");
        return;
      }

      // Insert customers (skip existing emails)
      let inserted = 0;
      let skipped = 0;

      for (const customer of customers) {
        const { error } = await supabase.from("customers").insert({
          email: customer.email,
          full_name: customer.full_name,
          phone: customer.phone,
          discount_percentage: customer.discount_percentage || 0,
          is_premium_member: customer.is_premium_member || false,
          premium_expires_at: customer.premium_expires_at,
          notes: customer.notes,
        });

        if (error) {
          if (error.code === "23505") {
            skipped++;
          } else {
            console.error("Insert error:", error);
          }
        } else {
          inserted++;
        }
      }

      toast.success(`Imported ${inserted} customers${skipped > 0 ? `, ${skipped} skipped (duplicate email)` : ""}`);
      setShowImportDialog(false);
      onImportComplete?.();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import customers");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadTemplate = () => {
    const headers = ["Email", "Full Name", "Phone", "Discount %", "Premium Member", "Premium Expires", "Notes"];
    const sample = ["customer@example.com", "John Doe", "+8801700000000", "10", "No", "", "VIP customer"];

    const csvContent = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, "customer_import_template.csv");
    toast.success("Template downloaded");
  };

  return (
    <>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
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

        <Button variant="outline" onClick={handleImportClick}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Customers</DialogTitle>
            <DialogDescription>
              Upload a CSV or JSON file with customer data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {importing ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {importing ? "Importing..." : "Click to upload CSV or JSON file"}
                </span>
              </label>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Need a template?
              </span>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerExportImport;
