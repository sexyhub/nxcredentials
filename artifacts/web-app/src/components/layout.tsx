import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetSettings } from "@workspace/api-client-react";
import { Key, Folder, Settings, LogOut, Loader2, Menu, X, LayoutDashboard } from "lucide-react";
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
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return <>{children}</>;

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
        <div className="flex items-center gap-2">
          <div className="w-[6px] h-[6px] rounded-full bg-white/40" />
          <span className="text-[13px] font-medium text-white tracking-wide">{siteTitle}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      <aside
        className={`${isMobileMenuOpen ? "flex" : "hidden"} md:flex flex-col w-full md:w-[232px] md:min-h-screen bg-sidebar shrink-0 z-50`}
      >
        <div className="hidden md:flex items-center gap-2 px-6 h-[56px]">
          {settings?.siteLogo ? (
            <img src={settings.siteLogo} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <div className="w-[6px] h-[6px] rounded-full bg-white/40" />
          )}
          <span className="text-[13px] font-medium text-white tracking-wide">{siteTitle}</span>
        </div>

        <nav className="flex flex-col gap-px px-3 pt-3 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 h-9 text-[13px] rounded-md transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-white font-medium"
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3 mt-auto">
          <div className="border-t border-sidebar-border pt-3 mb-1">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center text-[11px] font-bold text-white uppercase">
                {user?.username?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-white truncate">{user?.username}</div>
                <div className="text-[11px] text-sidebar-foreground">{user?.isAdmin ? "Admin" : "User"}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2.5 w-full px-3 h-9 text-[13px] text-sidebar-foreground hover:text-white hover:bg-sidebar-accent/50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen bg-background overflow-auto">
        <div className="p-6 md:p-10 max-w-[960px]">
          {children}
        </div>
      </main>
    </div>
  );
}
