import { Package, AlertTriangle, XCircle, Upload, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CRMDataTable from "./CRMDataTable";
import CRMExportTools from "./CRMExportTools";

interface TopProduct {
  id: string;
  name: string;
  images: string[];
  totalSold: number;
  revenue: number;
  stockQuantity: number;
}

interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface CRMProductsTabProps {
  products: TopProduct[];
  stats: ProductStats;
  allProducts?: any[];
}

const CRMProductsTab = ({ products, stats, allProducts = [] }: CRMProductsTabProps) => {
  const productColumns = [
    {
      key: "rank",
      label: "#",
      width: "50px",
      render: (_: TopProduct, index?: number) => (
        <span className="font-bold text-gold">#{(index ?? 0) + 1}</span>
      ),
    },
    {
      key: "name",
      label: "Product",
      sortable: true,
      render: (product: TopProduct) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
            {product.images[0] && (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <span className="font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      ),
    },
    {
      key: "totalSold",
      label: "Sold",
      sortable: true,
      render: (product: TopProduct) => (
        <Badge variant="outline">{product.totalSold} units</Badge>
      ),
    },
    {
      key: "revenue",
      label: "Revenue",
      sortable: true,
      render: (product: TopProduct) => (
        <span className="font-bold text-gold">৳{product.revenue.toLocaleString()}</span>
      ),
    },
    {
      key: "stockQuantity",
      label: "Stock",
      sortable: true,
      render: (product: TopProduct) => (
        <Badge 
          variant="outline" 
          className={product.stockQuantity <= 5 ? "border-red-500 text-red-500" : ""}
        >
          {product.stockQuantity}
        </Badge>
      ),
    },
  ];

  // Add index to products for ranking
  const productsWithIndex = products.map((p, i) => ({ ...p, rank: i + 1 }));

  const exportProductData = allProducts.map((p) => ({
    name: p.name,
    sku: p.sku || "N/A",
    price: p.price,
    stock: p.stock_quantity,
    category: p.category?.name || "N/A",
    status: p.is_active ? "Active" : "Inactive",
  }));

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-sm text-muted-foreground">Active Products</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{stats.lowStockProducts}</p>
              <p className="text-sm text-muted-foreground">Low Stock (≤5)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{stats.outOfStockProducts}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <CRMDataTable
        data={productsWithIndex}
        columns={productColumns}
        title="Top Selling Products"
        subtitle="Products ranked by revenue"
        searchKey="name"
        searchPlaceholder="Search products..."
        enableSelection={true}
        exportFilename="products_report"
        maxHeight="450px"
        emptyMessage="No sales data available"
        actions={
          <div className="flex gap-2">
            <CRMExportTools
              data={exportProductData}
              filename="all_products"
              title="All Products Report"
              columns={[
                { key: "name", label: "Name" },
                { key: "sku", label: "SKU" },
                { key: "price", label: "Price" },
                { key: "stock", label: "Stock" },
                { key: "category", label: "Category" },
                { key: "status", label: "Status" },
              ]}
            />
          </div>
        }
      />
    </div>
  );
};

export default CRMProductsTab;
