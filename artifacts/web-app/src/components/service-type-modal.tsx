import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateServiceType,
  useUpdateServiceType,
  getListServiceTypesQueryKey,
  getGetStatsQueryKey,
  type ServiceType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_ICONS, getIconComponent } from "@/lib/service-types";

interface ServiceTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType?: ServiceType | null;
}

const PRESET_COLORS = [
  "#EA4335", "#FF9900", "#F7931A", "#1DB954", "#4285F4",
  "#0078D4", "#5865F2", "#E50914", "#24292F", "#0A66C2",
  "#E4405F", "#25D366", "#0088CC", "#635BFF", "#78909C",
  "#2E7D32", "#E91E63", "#00BCD4", "#FF4500", "#4A154B",
];

export function ServiceTypeModal({ open, onOpenChange, serviceType }: ServiceTypeModalProps) {
  const isEditing = !!serviceType;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("Globe");
  const [color, setColor] = useState("#78909C");

  useEffect(() => {
    if (open) {
      setKey(serviceType?.key ?? "");
      setLabel(serviceType?.label ?? "");
      setIcon(serviceType?.icon ?? "Globe");
      setColor(serviceType?.color ?? "#78909C");
    }
  }, [open, serviceType]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListServiceTypesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const createMutation = useCreateServiceType({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Service type created" });
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast({ title: err?.message ?? "Failed to create", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateServiceType({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Service type updated" });
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast({ title: err?.message ?? "Failed to update", variant: "destructive" });
      },
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    if (isEditing && serviceType?.id) {
      updateMutation.mutate({ id: serviceType.id, data: { label: label.trim(), icon, color } });
    } else {
      if (!key.trim()) return;
      createMutation.mutate({ data: { key: key.trim(), label: label.trim(), icon, color } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-extrabold tracking-tight">
            {isEditing ? "Edit service type" : "New service type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Key</Label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="e.g. my-service"
                className="h-9 text-[13px] font-mono"
              />
              <p className="text-[11px] text-muted-foreground">Lowercase letters, numbers, dashes and underscores only.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Service"
              className="h-9 text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">Icon</Label>
            <div className="grid grid-cols-8 gap-1.5 border rounded-xl p-2.5 bg-muted/30 max-h-40 overflow-y-auto">
              {AVAILABLE_ICONS.map((iconName) => {
                const Icon = getIconComponent(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    title={iconName}
                    onClick={() => setIcon(iconName)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      icon === iconName
                        ? "bg-foreground text-background"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">Color</Label>
            <div className="flex items-center gap-2.5">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-md border-2 transition-all ${
                      color === c ? "border-foreground scale-110" : "border-transparent hover:border-foreground/30"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="flex items-center gap-2.5 mb-4 p-3 border rounded-xl bg-muted/20">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + "18" }}>
                {(() => {
                  const Icon = getIconComponent(icon);
                  return <Icon className="w-4.5 h-4.5" style={{ color }} />;
                })()}
              </div>
              <div>
                <span className="text-[13px] font-semibold block">{label || "Preview"}</span>
                <span className="text-[11px] text-muted-foreground font-mono">{key || "key"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 h-9 text-[13px] font-semibold" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-9 text-[13px] font-semibold" disabled={isPending || !label.trim() || (!isEditing && !key.trim())}>
                {isPending ? "Saving..." : isEditing ? "Save changes" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
