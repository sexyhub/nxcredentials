import { useState, useEffect } from "react";
import {
  useCreateTag,
  useUpdateTag,
  getListTagsQueryKey,
  getGetStatsQueryKey,
  type Tag
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface TagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
}

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#6366f1", "#d946ef", "#f43f5e", "#64748b",
];

export function TagModal({ open, onOpenChange, tag }: TagModalProps) {
  const isEditing = !!tag;

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (tag) {
        setName(tag.name);
        setColor(tag.color);
      } else {
        setName("");
        setColor(COLORS[0]);
      }
    }
  }, [open, tag]);

  const createMutation = useCreateTag({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Tag created" });
        onOpenChange(false);
      },
    },
  });

  const updateMutation = useUpdateTag({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Tag updated" });
        onOpenChange(false);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && tag) {
      updateMutation.mutate({ id: tag.id, data: { name, color } });
    } else {
      createMutation.mutate({ data: { name, color } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name" className="text-[13px]">Name</Label>
            <Input id="tag-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Work, Finance" className="h-10 bg-transparent" />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                    color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:opacity-80"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[13px] font-medium">{name || "Tag"}</span>
            </div>
          </div>

          <DialogFooter className="pt-1 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="h-9 text-[13px]">{isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
