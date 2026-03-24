import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetSettings } from "@workspace/api-client-react";
import { Shield, Key, Folder, Settings, LogOut, Loader2, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: settings } = useGetSettings({ query: { retry: false, enabled: isAuthenticated } });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Credentials", href: "/credentials", icon: Key },
    { label: "Categories", href: "/categories", icon: Folder },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: "Settings", href: "/settings", icon: Settings });
  }

  const siteTitle = settings?.siteTitle || "Credential Vault";

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-muted/30">
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="Logo" className="w-6 h-6 object-contain rounded" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
          <span className="font-semibold text-sm">{siteTitle}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <aside
        className={`${
          isMobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-[240px] md:min-h-screen border-r border-border bg-card z-50`}
      >
        <div className="hidden md:flex items-center gap-2 px-4 h-14 border-b border-border">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="Logo" className="w-6 h-6 object-contain rounded" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
          <span className="font-semibold text-sm">{siteTitle}</span>
        </div>

        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-foreground">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.username}</div>
              {user?.isAdmin && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                  Admin
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
