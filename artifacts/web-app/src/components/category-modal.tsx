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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#6366f1", "#d946ef", "#f43f5e", "#64748b",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</Label>
            <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Work, Social" className="h-10" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-full aspect-square flex items-center justify-center transition-all border-2",
                    color === c ? "border-foreground" : "border-transparent hover:border-border"
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5 mt-3 p-3 border bg-muted/30">
              <div className="w-3 h-3" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{name || "Category"}</span>
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
