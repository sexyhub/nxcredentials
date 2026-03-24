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
import { Plus, Edit, Trash2, Folder } from "lucide-react";

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

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, count: number) => {
    if (count > 0) {
      alert(`Cannot delete: this category has ${count} credential(s). Reassign them first.`);
      return;
    }
    if (confirm("Delete this category?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Organize your credentials</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add category
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading categories...</div>
        ) : categories?.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No categories yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="rounded-lg border border-border bg-card p-4 group hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="font-semibold text-sm">{cat.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.credentialCount)}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cat.credentialCount} credential{cat.credentialCount !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={selectedCategory}
      />
    </Layout>
  );
}
