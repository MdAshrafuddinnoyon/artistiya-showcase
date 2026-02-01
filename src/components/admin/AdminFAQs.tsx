import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Home, ShoppingCart, Info, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface FAQItem {
  id: string;
  category: string;
  category_bn: string | null;
  question: string;
  question_bn: string | null;
  answer: string;
  answer_bn: string | null;
  display_order: number;
  is_active: boolean;
  page_type: string;
}

const pageTypeInfo = {
  faq: { label: "FAQ Page", icon: HelpCircle, color: "bg-blue-500/20 text-blue-500" },
  homepage: { label: "Homepage", icon: Home, color: "bg-green-500/20 text-green-500" },
  checkout: { label: "Checkout", icon: ShoppingCart, color: "bg-orange-500/20 text-orange-500" },
  about: { label: "About Page", icon: Info, color: "bg-purple-500/20 text-purple-500" },
};

const AdminFAQs = () => {
  const queryClient = useQueryClient();
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [selectedPageType, setSelectedPageType] = useState<string>("all");

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faq-items-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .order("category")
        .order("display_order");
      if (error) throw error;
      return (data || []).map(f => ({
        ...f,
        page_type: f.page_type || 'faq'
      })) as FAQItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (faq: Partial<FAQItem>) => {
      if (faq.id) {
        const { error } = await supabase
          .from("faq_items")
          .update(faq)
          .eq("id", faq.id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = faq;
        const { error } = await supabase
          .from("faq_items")
          .insert([insertData as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-items-admin"] });
      queryClient.invalidateQueries({ queryKey: ["faq-items"] });
      setEditingFaq(null);
      toast.success("FAQ saved!");
    },
    onError: () => {
      toast.error("Failed to save FAQ");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("faq_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq-items-admin"] });
      queryClient.invalidateQueries({ queryKey: ["faq-items"] });
      toast.success("FAQ deleted!");
    },
  });

  const handleAdd = (pageType: string = "faq") => {
    const defaultCategories: Record<string, { en: string; bn: string }> = {
      homepage: { en: "General", bn: "সাধারণ" },
      checkout: { en: "Orders & Delivery", bn: "অর্ডার ও ডেলিভারি" },
      about: { en: "About Us", bn: "আমাদের সম্পর্কে" },
      faq: { en: "General", bn: "সাধারণ" },
    };

    setEditingFaq({
      id: "",
      category: defaultCategories[pageType]?.en || "General",
      category_bn: defaultCategories[pageType]?.bn || "সাধারণ",
      question: "",
      question_bn: "",
      answer: "",
      answer_bn: "",
      display_order: faqs.filter(f => f.page_type === pageType).length,
      is_active: true,
      page_type: pageType,
    });
  };

  const handleSave = () => {
    if (!editingFaq?.question || !editingFaq?.answer || !editingFaq?.category) {
      toast.error("Category, question, and answer are required");
      return;
    }
    const { id, ...data } = editingFaq;
    saveMutation.mutate(id ? editingFaq : data);
  };

  // Group FAQs by category within selected page type
  const filteredFaqs = selectedPageType === "all" 
    ? faqs 
    : faqs.filter(f => f.page_type === selectedPageType);

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const key = `${faq.page_type}-${faq.category}`;
    if (!acc[key]) {
      acc[key] = { pageType: faq.page_type, category: faq.category, items: [] };
    }
    acc[key].items.push(faq);
    return acc;
  }, {} as Record<string, { pageType: string; category: string; items: FAQItem[] }>);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getPageTypeInfo = (type: string) => {
    return pageTypeInfo[type as keyof typeof pageTypeInfo] || pageTypeInfo.faq;
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display">FAQ Management</h2>
          <p className="text-muted-foreground">Manage FAQs for different pages with bilingual support</p>
        </div>
        <Select onValueChange={(pageType) => handleAdd(pageType)}>
          <SelectTrigger className="w-[180px]">
            <Plus className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Add FAQ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="homepage">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" /> For Homepage
              </div>
            </SelectItem>
            <SelectItem value="checkout">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> For Checkout
              </div>
            </SelectItem>
            <SelectItem value="about">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" /> For About Page
              </div>
            </SelectItem>
            <SelectItem value="faq">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> For FAQ Page
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Page Type Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedPageType === "all" ? "gold" : "outline"}
          size="sm"
          onClick={() => setSelectedPageType("all")}
        >
          All ({faqs.length})
        </Button>
        {Object.entries(pageTypeInfo).map(([key, info]) => {
          const count = faqs.filter(f => f.page_type === key).length;
          const Icon = info.icon;
          return (
            <Button
              key={key}
              variant={selectedPageType === key ? "gold" : "outline"}
              size="sm"
              onClick={() => setSelectedPageType(key)}
              className="gap-1"
            >
              <Icon className="h-3 w-3" />
              {info.label} ({count})
            </Button>
          );
        })}
      </div>

      {editingFaq && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingFaq.id ? "Edit" : "Add"} FAQ
              <Badge className={getPageTypeInfo(editingFaq.page_type).color}>
                {getPageTypeInfo(editingFaq.page_type).label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Page Type</Label>
                  <Select
                    value={editingFaq.page_type}
                    onValueChange={(v) => setEditingFaq({ ...editingFaq, page_type: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homepage">Homepage</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                      <SelectItem value="about">About Page</SelectItem>
                      <SelectItem value="faq">FAQ Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={editingFaq.is_active}
                    onCheckedChange={(checked) => setEditingFaq({ ...editingFaq, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <Tabs defaultValue="en" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="bn">বাংলা</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-4">
                  <div>
                    <Label>Category (English)</Label>
                    <Input
                      value={editingFaq.category}
                      onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                      placeholder="Orders & Shipping"
                    />
                  </div>
                  <div>
                    <Label>Question (English)</Label>
                    <Input
                      value={editingFaq.question}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                      placeholder="How long does shipping take?"
                    />
                  </div>
                  <div>
                    <Label>Answer (English)</Label>
                    <Textarea
                      value={editingFaq.answer}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                      placeholder="Detailed answer..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="bn" className="space-y-4">
                  <div>
                    <Label>ক্যাটাগরি (বাংলা)</Label>
                    <Input
                      value={editingFaq.category_bn || ""}
                      onChange={(e) => setEditingFaq({ ...editingFaq, category_bn: e.target.value })}
                      placeholder="অর্ডার ও শিপিং"
                      className="font-bengali"
                    />
                  </div>
                  <div>
                    <Label>প্রশ্ন (বাংলা)</Label>
                    <Input
                      value={editingFaq.question_bn || ""}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question_bn: e.target.value })}
                      placeholder="শিপিং-এ কতদিন লাগে?"
                      className="font-bengali"
                    />
                  </div>
                  <div>
                    <Label>উত্তর (বাংলা)</Label>
                    <Textarea
                      value={editingFaq.answer_bn || ""}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer_bn: e.target.value })}
                      placeholder="বিস্তারিত উত্তর..."
                      rows={4}
                      className="font-bengali"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={() => setEditingFaq(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {Object.entries(groupedFaqs).map(([key, group]) => {
          const info = getPageTypeInfo(group.pageType);
          const Icon = info.icon;
          
          return (
            <Collapsible
              key={key}
              open={openCategories.includes(key)}
              onOpenChange={() => toggleCategory(key)}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Badge className={info.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {info.label}
                      </Badge>
                      <CardTitle className="text-lg">{group.category} ({group.items.length})</CardTitle>
                    </div>
                    {openCategories.includes(key) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2 pt-0">
                    {group.items.map((faq) => (
                      <div
                        key={faq.id}
                        className={`p-3 rounded-lg border ${!faq.is_active ? "opacity-50 bg-muted" : "bg-background"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{faq.question}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingFaq(faq)}>
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(faq.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {Object.keys(groupedFaqs).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No FAQs yet. Click "Add FAQ" to create one for a specific page.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFAQs;
