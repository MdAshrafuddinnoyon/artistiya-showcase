import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
}

const MobileCategoryPills = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_bn, slug")
        .order("display_order", { ascending: true })
        .limit(8);

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Default categories if none in database
  const defaultCategories: Category[] = [
    { id: "1", name: "All", name_bn: "সব", slug: "" },
    { id: "2", name: "Jewelry", name_bn: "জুয়েলারি", slug: "jewelry" },
    { id: "3", name: "Bags", name_bn: "ব্যাগ", slug: "bags" },
    { id: "4", name: "Woven", name_bn: "বোনা", slug: "woven" },
    { id: "5", name: "Art", name_bn: "শিল্প", slug: "art" },
  ];

  const displayCategories = categories.length > 0 
    ? [{ id: "all", name: "All", name_bn: "সব", slug: "" }, ...categories] 
    : defaultCategories;

  return (
    <div className="md:hidden px-4 py-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            to={category.slug ? `/shop/${category.slug}` : "/shop"}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              activeCategory === category.id || (!activeCategory && category.id === "all")
                ? "bg-gold text-charcoal-deep border-gold"
                : "bg-muted text-muted-foreground border-border hover:border-gold/50"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileCategoryPills;
