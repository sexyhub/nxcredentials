import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetSettings } from "@workspace/api-client-react";
import { Key, Tag, Settings, LogOut, Loader2, LayoutDashboard, Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useGetSettings({ query: { retry: false, enabled: isAuthenticated } });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    { label: "Tags", href: "/categories", icon: Tag },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: "Settings", href: "/settings", icon: Settings });
  }

  const siteTitle = settings?.siteTitle || "Credential Vault";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5">
                {settings?.siteLogo ? (
                  <img src={settings.siteLogo} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center text-xs font-extrabold">
                    CV
                  </div>
                )}
                <span className="text-[15px] font-bold hidden sm:inline">{siteTitle}</span>
              </Link>

              <nav className="hidden md:flex items-center gap-0.5">
                {navItems.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] leading-none transition-colors ${
                        isActive
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground font-medium hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 bg-foreground rounded-full" />
                      )}
                      <item.icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="translate-y-[0.4px]">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold uppercase">
                    {user?.username?.charAt(0)}
                  </div>
                  <span className="text-[13px] font-medium hidden sm:inline">{user?.username}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border rounded-xl overflow-hidden z-50">
                    <div className="px-3 py-2.5 border-b">
                      <div className="text-[13px] font-medium">{user?.username}</div>
                      <div className="text-[11px] text-muted-foreground">{user?.isAdmin ? "Administrator" : "User"}</div>
                    </div>
                    <button
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              <button
                className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-3 bg-card">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors ${
                      isActive ? "bg-accent text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
