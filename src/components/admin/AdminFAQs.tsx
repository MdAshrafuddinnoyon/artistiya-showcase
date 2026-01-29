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
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
}

const AdminFAQs = () => {
  const queryClient = useQueryClient();
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faq-items-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .order("category")
        .order("display_order");
      if (error) throw error;
      return data as FAQItem[];
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

  const handleAdd = () => {
    setEditingFaq({
      id: "",
      category: "General",
      category_bn: "সাধারণ",
      question: "",
      question_bn: "",
      answer: "",
      answer_bn: "",
      display_order: faqs.length,
      is_active: true,
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

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display">FAQ Management</h2>
          <p className="text-muted-foreground">Manage frequently asked questions with bilingual support</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      </div>

      {editingFaq && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFaq.id ? "Edit" : "Add"} FAQ</CardTitle>
          </CardHeader>
          <CardContent>
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

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingFaq.is_active}
                  onCheckedChange={(checked) => setEditingFaq({ ...editingFaq, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
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
        {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
          <Collapsible
            key={category}
            open={openCategories.includes(category)}
            onOpenChange={() => toggleCategory(category)}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-lg">{category} ({categoryFaqs.length})</CardTitle>
                  {openCategories.includes(category) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-2 pt-0">
                  {categoryFaqs.map((faq) => (
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
        ))}

        {Object.keys(groupedFaqs).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No FAQs yet. Click "Add FAQ" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFAQs;
