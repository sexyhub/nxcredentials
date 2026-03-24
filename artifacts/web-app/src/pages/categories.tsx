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
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">Categories</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">Organize credentials into groups.</p>
          </div>
          <Button onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }} size="sm" className="h-9 text-[13px]">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add category
          </Button>
        </div>

        {isLoading ? (
          <div className="text-[13px] text-muted-foreground py-14 text-center">Loading...</div>
        ) : categories?.length === 0 ? (
          <div className="border rounded-lg p-16 text-center bg-card">
            <Folder className="w-6 h-6 text-border mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No categories yet.</p>
          </div>
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground w-14"></th>
                  <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground text-right">Credentials</th>
                  <th className="px-4 py-2.5 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((cat) => (
                  <tr key={cat.id} className="border-b last:border-0 group hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium">{cat.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-mono text-muted-foreground tabular-nums">{cat.credentialCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setSelectedCategory(cat); setIsModalOpen(true); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (cat.credentialCount > 0) {
                              alert(`Can't delete — ${cat.credentialCount} credential(s) still use this category.`);
                              return;
                            }
                            if (confirm("Delete this category?")) deleteMutation.mutate({ id: cat.id });
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-accent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CategoryModal open={isModalOpen} onOpenChange={setIsModalOpen} category={selectedCategory} />
    </Layout>
  );
}
