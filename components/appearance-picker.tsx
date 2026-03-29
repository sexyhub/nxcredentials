"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SPACE_ICONS, getSpaceIcon } from "@/lib/space-icons";
import { Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const COLORS: { hex: string; name: string }[] = [
  { hex: "#6366f1", name: "Indigo" },
  { hex: "#8B5CF6", name: "Violet" },
  { hex: "#EC4899", name: "Pink" },
  { hex: "#EF4444", name: "Red" },
  { hex: "#F59E0B", name: "Amber" },
  { hex: "#10B981", name: "Emerald" },
  { hex: "#06B6D4", name: "Cyan" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#6B7280", name: "Gray" },
  { hex: "#1F2937", name: "Slate" },
];

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

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
  const [colorOpen, setColorOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);

  const colorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useClickOutside(colorRef, () => setColorOpen(false));
  useClickOutside(iconRef, () => setIconOpen(false));

  const IconComp = fixedIcon ?? (icon ? getSpaceIcon(icon) : Shield);
  const selectedColor = COLORS.find((c) => c.hex === color);
  const selectedIcon = SPACE_ICONS.find((s) => s.key === icon);

  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">Appearance</Label>
      <div className="flex gap-2">
        <div ref={colorRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => { setColorOpen((v) => !v); setIconOpen(false); }}
            className="w-full flex items-center gap-2 h-10 px-3 border rounded-lg bg-background hover:bg-accent/40 transition-colors text-left"
          >
            <span className="w-4 h-4 rounded-sm shrink-0 border border-black/10" style={{ backgroundColor: color }} />
            <span className="flex-1 text-[13px] truncate">{selectedColor?.name ?? "Color"}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${colorOpen ? "rotate-180" : ""}`} />
          </button>

          {colorOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 z-[200] w-[200px] border rounded-xl bg-popover shadow-lg p-2.5">
              <div className="grid grid-cols-5 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => { onColorChange(c.hex); setColorOpen(false); }}
                    className="relative w-full aspect-square rounded-md transition-all hover:scale-105 focus:outline-none"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {color === c.hex && (
                      <Check className="absolute inset-0 m-auto w-3 h-3 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showIcons && onIconChange && (
          <div ref={iconRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => { setIconOpen((v) => !v); setColorOpen(false); }}
              className="w-full flex items-center gap-2 h-10 px-3 border rounded-lg bg-background hover:bg-accent/40 transition-colors text-left"
            >
              <IconComp className="w-4 h-4 shrink-0" style={{ color }} />
              <span className="flex-1 text-[13px] truncate capitalize">{selectedIcon?.key ?? "Icon"}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${iconOpen ? "rotate-180" : ""}`} />
            </button>

            {iconOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 z-[200] w-[220px] border rounded-xl bg-popover shadow-lg p-2.5">
                <div className="grid grid-cols-7 gap-1">
                  {SPACE_ICONS.map((si) => {
                    const SIcon = si.icon;
                    const isSelected = icon === si.key;
                    return (
                      <button
                        key={si.key}
                        type="button"
                        onClick={() => { onIconChange(si.key); setIconOpen(false); }}
                        title={si.key}
                        className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all hover:bg-accent/60 ${isSelected ? "bg-accent ring-2 ring-offset-1 ring-foreground/40" : ""}`}
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

        {!showIcons && (
          <div className="flex-1 flex items-center h-10 px-3 border rounded-lg bg-muted/30 gap-2">
            <IconComp className="w-4 h-4 shrink-0" style={{ color }} />
            <span className="text-[13px] text-muted-foreground">Default icon</span>
          </div>
        )}
      </div>
    </div>
  );
}
