import {
  Mail, Shield, Cloud, Code2, Tv, Music, MessageCircle,
  Camera, Briefcase, Hash, ShoppingCart, CreditCard,
  Gamepad2, Globe, Lock, Server, Database, Phone,
  Video, BookOpen, Plane, Heart, Cpu, Wifi
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ServiceType {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const SERVICE_TYPES: ServiceType[] = [
  { key: "gmail", label: "Gmail", icon: Mail, color: "#EA4335" },
  { key: "protonmail", label: "Proton Mail", icon: Shield, color: "#6D4AFF" },
  { key: "outlook", label: "Outlook", icon: Mail, color: "#0078D4" },
  { key: "yahoo", label: "Yahoo Mail", icon: Mail, color: "#6001D2" },
  { key: "icloud", label: "iCloud", icon: Cloud, color: "#3693F3" },
  { key: "github", label: "GitHub", icon: Code2, color: "#24292F" },
  { key: "gitlab", label: "GitLab", icon: Code2, color: "#FC6D26" },
  { key: "bitbucket", label: "Bitbucket", icon: Code2, color: "#0052CC" },
  { key: "aws", label: "AWS", icon: Cloud, color: "#FF9900" },
  { key: "azure", label: "Azure", icon: Server, color: "#0089D6" },
  { key: "gcloud", label: "Google Cloud", icon: Cloud, color: "#4285F4" },
  { key: "digitalocean", label: "DigitalOcean", icon: Server, color: "#0080FF" },
  { key: "vercel", label: "Vercel", icon: Server, color: "#000000" },
  { key: "netflix", label: "Netflix", icon: Tv, color: "#E50914" },
  { key: "spotify", label: "Spotify", icon: Music, color: "#1DB954" },
  { key: "youtube", label: "YouTube", icon: Video, color: "#FF0000" },
  { key: "disney", label: "Disney+", icon: Tv, color: "#113CCF" },
  { key: "twitter", label: "X / Twitter", icon: MessageCircle, color: "#1DA1F2" },
  { key: "facebook", label: "Facebook", icon: Globe, color: "#1877F2" },
  { key: "instagram", label: "Instagram", icon: Camera, color: "#E4405F" },
  { key: "linkedin", label: "LinkedIn", icon: Briefcase, color: "#0A66C2" },
  { key: "reddit", label: "Reddit", icon: MessageCircle, color: "#FF4500" },
  { key: "discord", label: "Discord", icon: Hash, color: "#5865F2" },
  { key: "slack", label: "Slack", icon: Hash, color: "#4A154B" },
  { key: "telegram", label: "Telegram", icon: Phone, color: "#0088CC" },
  { key: "whatsapp", label: "WhatsApp", icon: Phone, color: "#25D366" },
  { key: "amazon", label: "Amazon", icon: ShoppingCart, color: "#FF9900" },
  { key: "ebay", label: "eBay", icon: ShoppingCart, color: "#E53238" },
  { key: "paypal", label: "PayPal", icon: CreditCard, color: "#00457C" },
  { key: "stripe", label: "Stripe", icon: CreditCard, color: "#635BFF" },
  { key: "banking", label: "Banking", icon: CreditCard, color: "#2E7D32" },
  { key: "crypto", label: "Crypto", icon: Database, color: "#F7931A" },
  { key: "steam", label: "Steam", icon: Gamepad2, color: "#1B2838" },
  { key: "epicgames", label: "Epic Games", icon: Gamepad2, color: "#313131" },
  { key: "zoom", label: "Zoom", icon: Video, color: "#2D8CFF" },
  { key: "notion", label: "Notion", icon: BookOpen, color: "#000000" },
  { key: "figma", label: "Figma", icon: Cpu, color: "#F24E1E" },
  { key: "vpn", label: "VPN", icon: Lock, color: "#2E7D32" },
  { key: "wifi", label: "Wi-Fi", icon: Wifi, color: "#607D8B" },
  { key: "travel", label: "Travel", icon: Plane, color: "#00BCD4" },
  { key: "health", label: "Health", icon: Heart, color: "#E91E63" },
  { key: "other", label: "Other", icon: Globe, color: "#78909C" },
];

export function getServiceType(key: string): ServiceType {
  return SERVICE_TYPES.find((t) => t.key === key) || SERVICE_TYPES[SERVICE_TYPES.length - 1];
}
