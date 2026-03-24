import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetSettings } from "@workspace/api-client-react";
import { Shield, Key, Folder, Settings, LogOut, Loader2, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
        <div className="flex items-center gap-2.5">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="Logo" className="w-6 h-6 object-contain rounded" />
          ) : (
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="font-semibold text-sm">{siteTitle}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside
        className={`${
          isMobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-60 md:min-h-screen border-r border-border bg-sidebar z-50`}
      >
        <div className="hidden md:flex items-center gap-2.5 px-5 py-4 border-b border-border">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="Logo" className="w-7 h-7 object-contain rounded" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2.5 rounded-md bg-accent/50 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.username}</div>
                {user?.isAdmin && (
                  <span className="text-[10px] text-primary font-medium">Admin</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
