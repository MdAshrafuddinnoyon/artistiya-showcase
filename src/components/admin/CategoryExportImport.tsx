import { useState } from "react";
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number | null;
  parent_id: string | null;
}

interface CategoryExportImportProps {
  categories: Category[];
  onImportComplete: () => void;
}

const CategoryExportImport = ({ categories, onImportComplete }: CategoryExportImportProps) => {
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const exportToJSON = () => {
    const exportData = categories.map((cat) => ({
      name: cat.name,
      name_bn: cat.name_bn,
      slug: cat.slug,
      description: cat.description,
      image_url: cat.image_url,
      display_order: cat.display_order,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `categories_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Categories exported successfully");
  };

  const exportToCSV = () => {
    const headers = ["name", "name_bn", "slug", "description", "image_url", "display_order"];
    const rows = categories.map((cat) =>
      [
        `"${cat.name}"`,
        `"${cat.name_bn || ""}"`,
        `"${cat.slug}"`,
        `"${cat.description || ""}"`,
        `"${cat.image_url || ""}"`,
        cat.display_order || 0,
      ].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `categories_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Categories exported to CSV");
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setProgress(0);
    setErrors([]);

    try {
      const text = await file.text();
      let importData: any[] = [];

      if (file.name.endsWith(".json")) {
        importData = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter((l) => l.trim());
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || null;
          });
          if (row.name) importData.push(row);
        }
      }

      const importErrors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < importData.length; i++) {
        const cat = importData[i];

        try {
          // Check if category with same slug exists
          const { data: existing } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", cat.slug)
            .maybeSingle();

          if (existing) {
            // Update existing
            const { error } = await supabase
              .from("categories")
              .update({
                name: cat.name,
                name_bn: cat.name_bn || null,
                description: cat.description || null,
                image_url: cat.image_url || null,
                display_order: parseInt(cat.display_order) || 0,
              })
              .eq("id", existing.id);

            if (error) throw error;
          } else {
            // Insert new
            const { error } = await supabase.from("categories").insert({
              name: cat.name,
              name_bn: cat.name_bn || null,
              slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              description: cat.description || null,
              image_url: cat.image_url || null,
              display_order: parseInt(cat.display_order) || 0,
            });

            if (error) throw error;
          }
          successCount++;
        } catch (error: any) {
          importErrors.push(`${cat.name}: ${error.message}`);
        }

        setProgress(Math.round(((i + 1) / importData.length) * 100));
      }

      setErrors(importErrors);

      if (successCount > 0) {
        toast.success(`Imported ${successCount} categories`);
        onImportComplete();
      }
      if (importErrors.length > 0) {
        toast.error(`Failed to import ${importErrors.length} categories`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to parse import file");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Dropdown */}
      <div className="relative group">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
          <button
            onClick={exportToJSON}
            className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
          >
            <FileJson className="h-4 w-4" />
            Export as JSON
          </button>
          <button
            onClick={exportToCSV}
            className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </button>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Categories</DialogTitle>
          </DialogHeader>

          {!importing ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a JSON or CSV file to import categories. Existing categories with the same
                slug will be updated.
              </p>

              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold transition-colors"
                onClick={() => document.getElementById("import-file")?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground">Click to upload file</p>
                <p className="text-xs text-muted-foreground">JSON or CSV</p>
                <input
                  id="import-file"
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-foreground mb-2">Importing categories...</p>
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
              </div>

              {errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-destructive text-sm mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Errors
                  </div>
                  <ul className="text-xs text-destructive space-y-1 max-h-24 overflow-y-auto">
                    {errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!importing && progress === 100 && (
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={() => setImportDialogOpen(false)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryExportImport;
