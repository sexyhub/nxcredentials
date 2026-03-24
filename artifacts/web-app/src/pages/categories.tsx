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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
            <h1 className="text-xl font-semibold tracking-tight">Categories</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Organize your credentials into groups</p>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add category
          </Button>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading categories...</div>
        ) : categories?.length === 0 ? (
          <Card className="p-12 text-center">
            <Folder className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No categories yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create a category to start organizing your credentials.</p>
            <Button onClick={handleAdd} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1.5" />
              Create first category
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories?.map((cat) => (
              <Card
                key={cat.id}
                className="p-4 group hover:shadow-sm transition-shadow cursor-default"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-medium truncate">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.credentialCount} credential{cat.credentialCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(cat)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => handleDelete(cat.id, cat.credentialCount)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
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
