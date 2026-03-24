import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListCategories,
  useDeleteCategory,
  getListCategoriesQueryKey,
  getGetStatsQueryKey,
  type Category
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CategoryModal } from "@/components/category-modal";
import { Plus, Pencil, Trash2, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useListCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Category deleted" });
      },
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }} size="sm" className="h-9 text-[13px] font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add category
          </Button>
        </div>

        {isLoading ? (
          <div className="text-[13px] text-muted-foreground py-14 text-center">Loading...</div>
        ) : categories?.length === 0 ? (
          <div className="border rounded-xl p-16 text-center bg-card">
            <Folder className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-[15px] font-semibold mb-1">No categories yet</p>
            <p className="text-[13px] text-muted-foreground">Create your first category to organize credentials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories?.map((cat) => (
              <div key={cat.id} className="border rounded-xl bg-card p-4 group hover:border-foreground/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <h3 className="text-[15px] font-bold">{cat.name}</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        <span className="font-mono font-medium tabular-nums">{cat.credentialCount}</span> credential{cat.credentialCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button
                      onClick={() => { setSelectedCategory(cat); setIsModalOpen(true); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (cat.credentialCount > 0) {
                          alert(`Can't delete — ${cat.credentialCount} credential(s) use this category.`);
                          return;
                        }
                        if (confirm("Delete this category?")) deleteMutation.mutate({ id: cat.id });
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryModal open={isModalOpen} onOpenChange={setIsModalOpen} category={selectedCategory} />
    </Layout>
  );
}
