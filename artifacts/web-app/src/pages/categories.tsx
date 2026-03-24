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
            <h1 className="text-[22px] font-semibold tracking-tight">Categories</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">Organize your credentials into groups</p>
          </div>
          <Button onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }} size="sm" className="h-9">
            <Plus className="w-4 h-4 mr-1.5" />
            Add category
          </Button>
        </div>

        {isLoading ? (
          <div className="text-[13px] text-muted-foreground py-12 text-center">Loading...</div>
        ) : categories?.length === 0 ? (
          <div className="bg-card border rounded-lg p-16 text-center">
            <Folder className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">No categories yet</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">Create your first category to organize credentials</p>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-[12px] font-medium text-muted-foreground w-12">Color</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-muted-foreground text-right">Credentials</th>
                  <th className="px-4 py-3 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((cat) => (
                  <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium">{cat.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] text-muted-foreground font-mono">{cat.credentialCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedCategory(cat); setIsModalOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (cat.credentialCount > 0) {
                              alert(`Cannot delete: ${cat.credentialCount} credential(s) still assigned.`);
                              return;
                            }
                            if (confirm("Delete this category?")) deleteMutation.mutate({ id: cat.id });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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
