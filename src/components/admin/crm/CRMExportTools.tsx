import { useState } from "react";
import { Download, FileText, Table, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface CRMExportToolsProps {
  data: any[];
  filename: string;
  title?: string;
  columns?: { key: string; label: string }[];
}

const CRMExportTools = ({ data, filename, title = "Report", columns }: CRMExportToolsProps) => {
  const [exporting, setExporting] = useState(false);

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

  const exportToCSV = async () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setExporting(true);
    try {
      const headers = columns 
        ? columns.map(c => c.label) 
        : Object.keys(data[0]);
      
      const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);
      
      const rows = data.map(row =>
        keys.map(key => {
          const val = row[key];
          return `"${String(val ?? "").replace(/"/g, '""')}"`;
        }).join(",")
      );
      
      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
      toast.success(`Exported ${data.length} records to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = async () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setExporting(true);
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${filename}_${new Date().toISOString().split("T")[0]}.json`);
      toast.success(`Exported ${data.length} records to JSON`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const generatePDFContent = () => {
    const headers = columns ? columns.map(c => c.label) : Object.keys(data[0]);
    const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);
    
    let tableRows = data.map(row => 
      `<tr>${keys.map(key => `<td style="border:1px solid #ddd;padding:8px;">${row[key] ?? ""}</td>`).join("")}</tr>`
    ).join("");
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
          h1 { color: #333; margin-bottom: 5px; }
          .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background: linear-gradient(135deg, #d4af37, #c5a028); color: #1a1a2e; padding: 12px 8px; text-align: left; font-weight: 600; }
          td { border: 1px solid #e0e0e0; padding: 10px 8px; }
          tr:nth-child(even) { background: #f9f9f9; }
          tr:hover { background: #f0f0f0; }
          .summary { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${data.length}</p>
        </div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">
          <p>This report was automatically generated</p>
        </div>
      </body>
      </html>
    `;
  };

  const exportToPDF = async () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    setExporting(true);
    try {
      const htmlContent = generatePDFContent();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success("PDF preview opened for printing");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export to Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export to JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToPDF}>
          <Table className="h-4 w-4 mr-2" />
          Print / Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CRMExportTools;
