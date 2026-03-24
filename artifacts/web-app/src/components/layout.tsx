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
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-card">
        <div className="flex items-center gap-2.5">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <div className="w-6 h-6 bg-foreground flex items-center justify-center">
              <Shield className="w-3 h-3 text-background" />
            </div>
          )}
          <span className="text-sm font-semibold">{siteTitle}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="h-8 w-8">
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      <aside
        className={`${
          isMobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-[220px] md:min-h-screen bg-sidebar text-sidebar-foreground z-50`}
      >
        <div className="hidden md:flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <div className="w-6 h-6 bg-white flex items-center justify-center">
              <Shield className="w-3 h-3 text-sidebar" />
            </div>
          )}
          <span className="text-[13px] font-semibold text-white">{siteTitle}</span>
        </div>

        <div className="px-3 pt-6 pb-2">
          <div className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-2">Navigation</div>
        </div>

        <nav className="flex flex-col gap-px px-3 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-7 h-7 bg-sidebar-accent flex items-center justify-center text-[11px] font-bold text-sidebar-accent-foreground">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white truncate">{user?.username}</div>
              {user?.isAdmin && (
                <div className="text-[10px] font-mono uppercase tracking-wider text-sidebar-foreground/50">Admin</div>
              )}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-sidebar-foreground hover:text-white hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 overflow-auto">
        <div className="max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
