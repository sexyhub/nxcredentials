import {
  FolderOpen, Briefcase, Globe, Code2, Mail, Shield,
  CreditCard, Gamepad2, Heart, Star, Bookmark, Archive,
  Music, Camera, Phone, Plane, BookOpen, Cpu, Server, Hash
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SpaceIcon {
  key: string;
  icon: LucideIcon;
}

export const SPACE_ICONS: SpaceIcon[] = [
  { key: "folder", icon: FolderOpen },
  { key: "briefcase", icon: Briefcase },
  { key: "globe", icon: Globe },
  { key: "code", icon: Code2 },
  { key: "mail", icon: Mail },
  { key: "shield", icon: Shield },
  { key: "card", icon: CreditCard },
  { key: "game", icon: Gamepad2 },
  { key: "heart", icon: Heart },
  { key: "star", icon: Star },
  { key: "bookmark", icon: Bookmark },
  { key: "archive", icon: Archive },
  { key: "music", icon: Music },
  { key: "camera", icon: Camera },
  { key: "phone", icon: Phone },
  { key: "plane", icon: Plane },
  { key: "book", icon: BookOpen },
  { key: "cpu", icon: Cpu },
  { key: "server", icon: Server },
  { key: "hash", icon: Hash },
];

export function getSpaceIcon(key: string): LucideIcon {
  return SPACE_ICONS.find((i) => i.key === key)?.icon || FolderOpen;
}
