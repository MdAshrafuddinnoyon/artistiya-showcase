import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { divisions, getDistrictsByDivision, getThanasByDistrict } from "@/data/bangladeshLocations";

interface DeliveryZone {
  id: string;
  division: string;
  district: string;
  thana: string | null;
  shipping_cost: number;
  estimated_days: string | null;
  is_active: boolean;
}

const AdminDeliveryZones = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [shippingCost, setShippingCost] = useState("130");
  const [estimatedDays, setEstimatedDays] = useState("3-5 days");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .order("division", { ascending: true })
      .order("district", { ascending: true });

    if (error) {
      console.error("Error fetching zones:", error);
      toast.error("Failed to load delivery zones");
    } else {
      setZones(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedThana("");
    setShippingCost("130");
    setEstimatedDays("3-5 days");
    setIsActive(true);
    setEditingZone(null);
  };

  const handleOpenDialog = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setSelectedDivision(zone.division);
      setSelectedDistrict(zone.district);
      setSelectedThana(zone.thana || "");
      setShippingCost(zone.shipping_cost.toString());
      setEstimatedDays(zone.estimated_days || "3-5 days");
      setIsActive(zone.is_active);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDivision || !selectedDistrict) {
      toast.error("Please select division and district");
      return;
    }

    const zoneData = {
      division: selectedDivision,
      district: selectedDistrict,
      thana: selectedThana || null,
      shipping_cost: parseFloat(shippingCost) || 130,
      estimated_days: estimatedDays,
      is_active: isActive,
    };

    if (editingZone) {
      const { error } = await supabase
        .from("delivery_zones")
        .update(zoneData)
        .eq("id", editingZone.id);

      if (error) {
        toast.error("Failed to update zone");
        console.error(error);
      } else {
        toast.success("Zone updated successfully");
        fetchZones();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("delivery_zones")
        .insert(zoneData);

      if (error) {
        if (error.code === "23505") {
          toast.error("This zone already exists");
        } else {
          toast.error("Failed to add zone");
          console.error(error);
        }
      } else {
        toast.success("Zone added successfully");
        fetchZones();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;

    const { error } = await supabase
      .from("delivery_zones")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete zone");
    } else {
      toast.success("Zone deleted");
      fetchZones();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("delivery_zones")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      fetchZones();
    }
  };

  const districts = selectedDivision ? getDistrictsByDivision(selectedDivision) : [];
  const thanas = selectedDistrict ? getThanasByDistrict(selectedDistrict) : [];

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading delivery zones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground flex items-center gap-2">
            <Truck className="h-5 w-5 text-gold" />
            Delivery Zones
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set custom shipping costs for different locations
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Edit Delivery Zone" : "Add Delivery Zone"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Division *</Label>
                <Select
                  value={selectedDivision}
                  onValueChange={(v) => {
                    setSelectedDivision(v);
                    setSelectedDistrict("");
                    setSelectedThana("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(div => (
                      <SelectItem key={div.name} value={div.name}>{div.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>District *</Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={(v) => {
                    setSelectedDistrict(v);
                    setSelectedThana("");
                  }}
                  disabled={!selectedDivision}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map(dist => (
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Thana (Optional - for specific area pricing)</Label>
                <Select
                  value={selectedThana}
                  onValueChange={setSelectedThana}
                  disabled={!selectedDistrict}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All thanas (default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All thanas</SelectItem>
                    {thanas.map(thana => (
                      <SelectItem key={thana} value={thana}>{thana}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shipping Cost (৳)</Label>
                  <Input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    placeholder="130"
                  />
                </div>
                
                <div>
                  <Label>Estimated Delivery</Label>
                  <Input
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    placeholder="3-5 days"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gold" onClick={handleSave}>
                  {editingZone ? "Update" : "Add"} Zone
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Rates Info */}
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Default Rates:</strong> Dhaka Division = ৳80 | Outside Dhaka = ৳130
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add custom zones below to override these defaults for specific locations.
        </p>
      </div>

      {/* Zones Table */}
      {zones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No custom delivery zones yet</p>
          <p className="text-sm mt-1">Default rates will be applied</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Division</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Thana</TableHead>
              <TableHead>Cost (৳)</TableHead>
              <TableHead>Est. Delivery</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell>{zone.division}</TableCell>
                <TableCell>{zone.district}</TableCell>
                <TableCell>{zone.thana || "All"}</TableCell>
                <TableCell className="font-medium text-gold">৳{zone.shipping_cost}</TableCell>
                <TableCell>{zone.estimated_days || "-"}</TableCell>
                <TableCell>
                  <Switch
                    checked={zone.is_active}
                    onCheckedChange={() => handleToggleActive(zone.id, zone.is_active)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(zone)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(zone.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminDeliveryZones;
