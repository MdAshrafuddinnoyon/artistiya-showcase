import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const MobileCategoryPills = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("display_order", { ascending: true })
        .limit(6);

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  // Default categories if none in database
  const defaultCategories = [
    { id: "1", name: "Jewelry", slug: "jewelry" },
    { id: "2", name: "Bags", slug: "bags" },
    { id: "3", name: "Woven", slug: "woven" },
    { id: "4", name: "Art", slug: "art" },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="md:hidden px-4 py-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            to={`/shop/${category.slug}`}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full border text-sm font-medium transition-colors ${
              activeCategory === category.id
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
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
