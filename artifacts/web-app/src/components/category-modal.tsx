import { useState, useEffect } from "react";
import {
  useCreateCategory,
  useUpdateCategory,
  getListCategoriesQueryKey,
  getGetStatsQueryKey,
  type Category
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Check } from "lucide-react";

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

const COLORS = [
  "#22d3ee", "#34d399", "#fbbf24", "#f97316",
  "#f43f5e", "#a78bfa", "#60a5fa", "#94a3b8",
];

export function CategoryModal({ open, onOpenChange, category }: CategoryModalProps) {
  const isEditing = !!category;

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setColor(category.color);
      } else {
        setName("");
        setColor(COLORS[0]);
      }
    }
  }, [open, category]);

  const createMutation = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Category created" });
        onOpenChange(false);
      },
    },
  });

  const updateMutation = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Category updated" });
        onOpenChange(false);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && category) {
      updateMutation.mutate({ id: category.id, data: { name, color } });
    } else {
      createMutation.mutate({ data: { name, color } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const inputClass =
    "w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="text-lg font-semibold mb-4">
            {isEditing ? "Edit Category" : "New Category"}
          </DialogPrimitive.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Work, Social"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Color</label>
              <div className="grid grid-cols-8 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-full aspect-square rounded-md flex items-center justify-center transition-all ${
                      color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="h-9 px-4 rounded-md border border-border bg-transparent text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </DialogPrimitive.Close>
              <button
                type="submit"
                disabled={isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <DialogPrimitive.Close className="absolute right-3 top-3 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
