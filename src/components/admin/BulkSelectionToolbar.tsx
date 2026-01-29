import { Check, X, Trash2, Eye, EyeOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface BulkSelectionToolbarProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete?: () => void;
  onBulkPublish?: () => void;
  onBulkUnpublish?: () => void;
  onBulkExport?: () => void;
  onBulkStatusChange?: (status: string) => void;
  showPublish?: boolean;
  showStatusChange?: boolean;
  statusOptions?: { value: string; label: string }[];
  customActions?: React.ReactNode;
}

const BulkSelectionToolbar = ({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkPublish,
  onBulkUnpublish,
  onBulkExport,
  showPublish = false,
  customActions,
}: BulkSelectionToolbarProps) => {
  const selectedCount = selectedIds.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll();
            } else {
              onDeselectAll();
            }
          }}
        />
        <span className="text-sm text-muted-foreground">
          Select all ({totalCount} items)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gold/10 border border-gold/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isAllSelected}
          ref={(ref) => {
            if (ref) {
              (ref as any).indeterminate = isSomeSelected;
            }
          }}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll();
            } else {
              onDeselectAll();
            }
          }}
        />
        <span className="text-sm font-medium text-foreground">
          {selectedCount} of {totalCount} selected
        </span>
        <button
          onClick={onDeselectAll}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showPublish && onBulkPublish && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkPublish}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" />
            Publish
          </Button>
        )}

        {showPublish && onBulkUnpublish && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkUnpublish}
            className="gap-1.5"
          >
            <EyeOff className="h-4 w-4" />
            Unpublish
          </Button>
        )}

        {onBulkExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}

        {customActions}

        {onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkSelectionToolbar;
