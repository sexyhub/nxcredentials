import { useGetStats } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, ArrowRight, KeyRound, Tag, Clock, Shield, Grid3X3, Calendar, FolderOpen } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getServiceType, getIconComponent } from "@/lib/service-types";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading, isError } = useGetStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (isError || !stats) {
    return (
      <Layout>
        <div className="border rounded-xl p-6">
          <p className="text-[14px] text-destructive">Could not load dashboard data.</p>
        </div>
      </Layout>
    );
  }

  const tagBreakdown = stats.tagBreakdown ?? [];
  const typeBreakdown = stats.typeBreakdown ?? [];
  const maxCount = Math.max(...(tagBreakdown.map(c => c.count)), 1);
  const maxTypeCount = Math.max(...(typeBreakdown.map(t => t.count)), 1);

  return (
    <Layout>
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground text-[15px] mt-1">Here's what's in your vault.</p>
          </div>
          <Button asChild size="sm" className="h-9 text-[13px] font-semibold self-start sm:self-auto">
            <Link href="/credentials">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New credential
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-muted-foreground/60" />
            <div>
              <span className="text-4xl font-extrabold tracking-tighter font-mono tabular-nums">{stats.totalCredentials}</span>
              <span className="text-muted-foreground text-[13px] ml-1.5">credentials</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-muted-foreground/60" />
            <div>
              <span className="text-4xl font-extrabold tracking-tighter font-mono tabular-nums">{stats.totalTags}</span>
              <span className="text-muted-foreground text-[13px] ml-1.5">tags</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />
          <div className="flex items-center gap-3">
            <Grid3X3 className="w-5 h-5 text-muted-foreground/60" />
            <div>
              <span className="text-4xl font-extrabold tracking-tighter font-mono tabular-nums">{stats.uniqueTypes}</span>
              <span className="text-muted-foreground text-[13px] ml-1.5">type{stats.uniqueTypes !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500/60" />
            <div>
              <span className="text-4xl font-extrabold tracking-tighter font-mono tabular-nums">{stats.totalVaults}</span>
              <span className="text-muted-foreground text-[13px] ml-1.5">vault{stats.totalVaults !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-muted-foreground/60" />
            <div>
              <span className="text-4xl font-extrabold tracking-tighter font-mono tabular-nums">{stats.totalSpaces}</span>
              <span className="text-muted-foreground text-[13px] ml-1.5">space{stats.totalSpaces !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border rounded-xl bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <FolderOpen className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[12px] text-muted-foreground font-medium">In space</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tighter font-mono tabular-nums">{stats.spaceCredentials}</span>
          </div>
          <div className="border rounded-xl bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-500/60" />
              <span className="text-[12px] text-muted-foreground font-medium">In vault</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tighter font-mono tabular-nums">{stats.vaultCredentials}</span>
          </div>
          <div className="border rounded-xl bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[12px] text-muted-foreground font-medium">Oldest</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tighter font-mono tabular-nums">
              {stats.oldestCredentialDays != null ? `${stats.oldestCredentialDays}d` : "—"}
            </span>
          </div>
          <div className="border rounded-xl bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[12px] text-muted-foreground font-medium">Avg age</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tighter font-mono tabular-nums">
              {stats.averageAgeDays}d
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold">Tags</h2>
              <Link href="/manage" className="text-[12px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {tagBreakdown.length > 0 ? (
              <div className="space-y-3">
                {tagBreakdown.map((t) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium">{t.name}</span>
                      <span className="text-[12px] font-mono text-muted-foreground tabular-nums">{t.count}</span>
                    </div>
                    <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(t.count / maxCount) * 100}%`,
                          backgroundColor: t.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[13px] text-muted-foreground">No tags yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3 h-8 text-[12px]">
                  <Link href="/manage">Create one</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="border rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold">Service types</h2>
              <Link href="/manage" className="text-[12px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {typeBreakdown.length > 0 ? (
              <div className="space-y-3">
                {typeBreakdown.slice(0, 8).map((t) => {
                  const stype = getServiceType(t.type);
                  const Icon = getIconComponent(stype.icon);
                  return (
                    <div key={t.type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: stype.color }} />
                          <span className="text-[13px] font-medium">{stype.label}</span>
                        </div>
                        <span className="text-[12px] font-mono text-muted-foreground tabular-nums">{t.count}</span>
                      </div>
                      <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(t.count / maxTypeCount) * 100}%`,
                            backgroundColor: stype.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[13px] text-muted-foreground">No credentials yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3 h-8 text-[12px]">
                  <Link href="/credentials">Add one</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-xl bg-card p-6">
          <h2 className="text-[16px] font-bold mb-5">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: "Add a new credential", desc: "Store a login or API key", href: "/credentials" },
              { label: "Create a vault", desc: "Encrypted storage for sensitive credentials", href: "/vault" },
              { label: "Create a tag", desc: "Organize your credentials", href: "/manage" },
              ...(user?.isAdmin
                ? [{ label: "Admin settings", desc: "Registration and branding", href: "/settings" }]
                : []),
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-colors group"
              >
                <div>
                  <div className="text-[14px] font-semibold">{action.label}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{action.desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
