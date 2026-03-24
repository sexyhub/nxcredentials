import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetSettings } from "@workspace/api-client-react";
import { Shield, Key, Folder, Settings, LogOut, Loader2, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between px-4 h-14 bg-sidebar">
        <div className="flex items-center gap-2.5">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="" className="w-6 h-6 object-contain rounded" />
          ) : (
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white/70" />
            </div>
          )}
          <span className="text-[13px] font-semibold text-white">{siteTitle}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="h-8 w-8 text-white hover:bg-white/10">
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      <aside
        className={`${
          isMobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-[240px] md:min-h-screen bg-sidebar z-50`}
      >
        <div className="hidden md:flex items-center gap-2.5 px-5 h-[60px]">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="" className="w-6 h-6 object-contain rounded" />
          ) : (
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white/70" />
            </div>
          )}
          <span className="text-[13px] font-semibold text-white">{siteTitle}</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 pt-4 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-[9px] text-[13px] font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[12px] font-semibold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white truncate">{user?.username}</div>
              {user?.isAdmin && (
                <div className="text-[11px] text-sidebar-foreground">Administrator</div>
              )}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 w-full px-3 py-[9px] text-[13px] font-medium text-sidebar-foreground hover:text-white hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[hsl(220,14%,97%)] min-h-screen">
        <div className="p-6 md:p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
