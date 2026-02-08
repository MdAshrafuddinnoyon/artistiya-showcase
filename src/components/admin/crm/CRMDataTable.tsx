import { useState } from "react";
import { Search, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CRMExportTools from "./CRMExportTools";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface CRMDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  subtitle?: string;
  searchKey?: keyof T | string;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  enableSelection?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  exportFilename?: string;
  idKey?: keyof T;
  maxHeight?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

function CRMDataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  searchKey,
  searchPlaceholder = "Search...",
  filters = [],
  enableSelection = false,
  onSelectionChange,
  exportFilename,
  idKey = "id" as keyof T,
  maxHeight = "400px",
  emptyMessage = "No data available",
  actions,
}: CRMDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Filter data
  let filteredData = [...data];

  // Apply search
  if (searchTerm && searchKey) {
    filteredData = filteredData.filter((item) => {
      const value = String(item[searchKey as keyof T] ?? "").toLowerCase();
      return value.includes(searchTerm.toLowerCase());
    });
  }

  // Apply filters
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value && value !== "all") {
      filteredData = filteredData.filter((item) => {
        const itemValue = String((item as any)[key] ?? "");
        return itemValue === value;
      });
    }
  });

  // Apply sorting
  if (sortConfig) {
    filteredData.sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return sortConfig.direction === "asc" 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
      onSelectionChange?.([]);
    } else {
      const allIds = filteredData.map((item) => String(item[idKey]));
      setSelectedIds(allIds);
      onSelectionChange?.(allIds);
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const exportColumns = columns.map((col) => ({
    key: String(col.key),
    label: col.label,
  }));

  const exportData = filteredData.map((item) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      row[String(col.key)] = (item as any)[col.key];
    });
    return row;
  });

  return (
    <div className="bg-card border border-border rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="font-display text-lg text-foreground">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {exportFilename && (
              <CRMExportTools
                data={exportData}
                filename={exportFilename}
                title={title}
                columns={exportColumns}
              />
            )}
            {actions}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          {searchKey && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || "all"}
              onValueChange={(value) => 
                setActiveFilters((prev) => ({ ...prev, [filter.key]: value }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* Selection info */}
        {enableSelection && selectedIds.length > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-gold/10 border border-gold/30 rounded-lg">
            <Badge variant="outline" className="border-gold text-gold">
              {selectedIds.length} selected
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Clear selection
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <ScrollArea style={{ maxHeight }} className="relative">
        {filteredData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr>
                {enableSelection && (
                  <th className="p-3 text-left w-10">
                    <Checkbox
                      checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                      col.sortable ? "cursor-pointer hover:text-foreground" : ""
                    }`}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortConfig?.key === String(col.key) && (
                        sortConfig.direction === "asc" 
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const itemId = String(item[idKey]);
                const isSelected = selectedIds.includes(itemId);
                
                return (
                  <tr
                    key={itemId || index}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      isSelected ? "bg-gold/5" : ""
                    }`}
                  >
                    {enableSelection && (
                      <td className="p-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectItem(itemId)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className="p-3 text-sm">
                        {col.render 
                          ? col.render(item) 
                          : String((item as any)[col.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
        <span>Showing {filteredData.length} of {data.length} records</span>
        {enableSelection && selectedIds.length > 0 && (
          <span>{selectedIds.length} selected</span>
        )}
      </div>
    </div>
  );
}

export default CRMDataTable;
