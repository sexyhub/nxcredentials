import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SPACE_ICONS, getSpaceIcon } from "@/lib/space-icons";
import { Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const COLORS = [
  "#6366f1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#06B6D4", "#3B82F6", "#6B7280", "#1F2937",
];

interface AppearancePickerProps {
  color: string;
  onColorChange: (color: string) => void;
  icon?: string;
  onIconChange?: (icon: string) => void;
  showIcons?: boolean;
  fixedIcon?: LucideIcon;
}

export function AppearancePicker({
  color,
  onColorChange,
  icon,
  onIconChange,
  showIcons = false,
  fixedIcon,
}: AppearancePickerProps) {
  const [open, setOpen] = useState(false);

  const IconComp = fixedIcon ?? (icon ? getSpaceIcon(icon) : Shield);

  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">Appearance</Label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 h-10 px-3 border rounded-lg bg-background hover:bg-accent/40 transition-colors text-left"
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "18" }}
        >
          <IconComp className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="flex-1 text-[13px] text-muted-foreground">
          {open ? "Close picker" : "Change color" + (showIcons ? " & icon" : "")}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border rounded-lg p-3 bg-card space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">Color</p>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onColorChange(c)}
                  className={`w-6 h-6 rounded-md transition-all ${
                    color === c ? "ring-2 ring-offset-1 ring-foreground scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {showIcons && onIconChange && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">Icon</p>
              <div className="flex gap-1 flex-wrap">
                {SPACE_ICONS.map((si) => {
                  const SIcon = si.icon;
                  const isSelected = icon === si.key;
                  return (
                    <button
                      key={si.key}
                      type="button"
                      onClick={() => onIconChange(si.key)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isSelected ? "ring-2 ring-offset-1 ring-foreground bg-accent" : "hover:bg-accent/50"
                      }`}
                    >
                      <SIcon className="w-3.5 h-3.5" style={{ color: isSelected ? color : undefined }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
