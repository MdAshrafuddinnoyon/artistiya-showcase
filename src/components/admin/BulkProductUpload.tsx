import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, Download, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkProductUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface ProductRow {
  name: string;
  name_bn?: string;
  slug?: string;
  price: number;
  compare_at_price?: number;
  description?: string;
  stock_quantity?: number;
  category_name?: string;
  images?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

const BulkProductUpload = ({ onComplete, onCancel }: BulkProductUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "preview" | "processing">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      "name",
      "name_bn",
      "price",
      "compare_at_price",
      "description",
      "stock_quantity",
      "category_name",
      "images",
      "is_active",
      "is_featured",
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      'Sample Product,নমুনা পণ্য,1500,2000,"A beautiful handcrafted item",10,Jewelry,"https://example.com/img1.jpg|https://example.com/img2.jpg",true,false';

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "product_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): ProductRow[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) throw new Error("CSV must have headers and at least one data row");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: ProductRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (header === "price" || header === "compare_at_price" || header === "stock_quantity") {
          row[header] = value ? parseFloat(value) : undefined;
        } else if (header === "is_active" || header === "is_featured") {
          row[header] = value?.toLowerCase() === "true";
        } else {
          row[header] = value || undefined;
        }
      });

      if (row.name && row.price) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setErrors([]);

    try {
      const text = await selectedFile.text();
      const parsedProducts = parseCSV(text);
      setProducts(parsedProducts);
      setStep("preview");
      toast.success(`Found ${parsedProducts.length} products`);
    } catch (error: any) {
      toast.error(error.message || "Failed to parse CSV");
      setFile(null);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleUpload = async () => {
    if (products.length === 0) return;

    setUploading(true);
    setStep("processing");
    setProgress(0);
    setErrors([]);

    // Fetch categories for mapping
    const { data: categories } = await supabase.from("categories").select("id, name");
    const categoryMap = new Map(categories?.map((c) => [c.name.toLowerCase(), c.id]));

    const uploadErrors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        const categoryId = product.category_name
          ? categoryMap.get(product.category_name.toLowerCase())
          : null;

        const images = product.images ? product.images.split("|").map((img) => img.trim()) : [];

        const { error } = await supabase.from("products").insert({
          name: product.name,
          name_bn: product.name_bn || null,
          slug: product.slug || generateSlug(product.name),
          price: product.price,
          compare_at_price: product.compare_at_price || null,
          description: product.description || null,
          stock_quantity: product.stock_quantity || 0,
          category_id: categoryId || null,
          images: images.length > 0 ? images : null,
          is_active: product.is_active ?? true,
          is_featured: product.is_featured ?? false,
          is_new_arrival: true,
        });

        if (error) throw error;
        successCount++;
      } catch (error: any) {
        uploadErrors.push(`Row ${i + 1} (${product.name}): ${error.message}`);
      }

      setProgress(Math.round(((i + 1) / products.length) * 100));
    }

    setUploading(false);
    setErrors(uploadErrors);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} products`);
    }
    if (uploadErrors.length > 0) {
      toast.error(`Failed to upload ${uploadErrors.length} products`);
    }

    if (uploadErrors.length === 0) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Bulk Product Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to add multiple products at once
            </p>
          </div>

          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">Click to upload CSV</p>
            <p className="text-sm text-muted-foreground">or drag and drop</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Button variant="outline" className="w-full" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>

          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </>
      )}

      {step === "preview" && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Preview ({products.length} products)</h3>
            <Button variant="ghost" size="icon" onClick={() => setStep("upload")}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Price</th>
                  <th className="p-2 text-left">Stock</th>
                  <th className="p-2 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">৳{product.price}</td>
                    <td className="p-2">{product.stock_quantity || 0}</td>
                    <td className="p-2">{product.category_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button variant="gold" className="flex-1" onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload All
            </Button>
            <Button variant="outline" onClick={() => setStep("upload")}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {step === "processing" && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {uploading ? "Uploading Products..." : "Upload Complete"}
            </h3>
            <Progress value={progress} className="mb-4" />
            <p className="text-sm text-muted-foreground">{progress}% complete</p>
          </div>

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Errors ({errors.length})</span>
              </div>
              <ul className="text-sm text-destructive space-y-1 max-h-32 overflow-y-auto">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {!uploading && (
            <div className="flex gap-3">
              {errors.length === 0 ? (
                <Button variant="gold" className="flex-1" onClick={onComplete}>
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => setStep("upload")}>
                    Try Again
                  </Button>
                  <Button variant="gold" onClick={onComplete}>
                    Close
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BulkProductUpload;
