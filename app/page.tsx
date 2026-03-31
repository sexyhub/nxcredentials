"use client";

import { useGetStats } from "@/hooks/use-api";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, ArrowRight, KeyRound, Tag, Clock, Shield, Grid3X3, Calendar, FolderOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServiceType, getIconComponent } from "@/lib/service-types";
import { getSpaceIcon } from "@/lib/space-icons";

function RingProgress({ value, size = 80, stroke = 7, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-accent" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

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
  const spaceBreakdown = stats.spaceBreakdown ?? [];

  const vaultPct = stats.totalCredentials > 0 ? Math.round((stats.vaultCredentials / stats.totalCredentials) * 100) : 0;
  const tagPct = stats.totalCredentials > 0 ? Math.round((stats.taggedCredentials / stats.totalCredentials) * 100) : 0;
  const orgPct = stats.totalCredentials > 0 ? Math.round((stats.spaceCredentials / stats.totalCredentials) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground text-[15px] mt-1">Here&apos;s what&apos;s in your vault.</p>
          </div>
          <Button asChild size="sm" className="h-9 text-[13px] font-semibold self-start sm:self-auto">
            <Link href="/spaces">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl bg-card p-5 flex items-center gap-5">
            <div className="relative flex items-center justify-center shrink-0">
              <RingProgress value={vaultPct} color="hsl(35, 80%, 50%)" />
              <span className="absolute text-[15px] font-extrabold font-mono tabular-nums">{vaultPct}%</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold">Vault protection</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {stats.vaultCredentials} of {stats.totalCredentials} secured
              </div>
              <div className="text-[11px] mt-2" style={{ color: vaultPct >= 75 ? "hsl(142, 60%, 40%)" : vaultPct >= 40 ? "hsl(35, 80%, 45%)" : "hsl(0, 60%, 50%)" }}>
                {vaultPct >= 75 ? "Strong" : vaultPct >= 40 ? "Moderate" : "Needs attention"}
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-card p-5 flex items-center gap-5">
            <div className="relative flex items-center justify-center shrink-0">
              <RingProgress value={tagPct} color="hsl(250, 60%, 55%)" />
              <span className="absolute text-[15px] font-extrabold font-mono tabular-nums">{tagPct}%</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold">Tag coverage</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {stats.taggedCredentials} of {stats.totalCredentials} labeled
              </div>
              <div className="text-[11px] mt-2" style={{ color: tagPct >= 75 ? "hsl(142, 60%, 40%)" : tagPct >= 40 ? "hsl(35, 80%, 45%)" : "hsl(0, 60%, 50%)" }}>
                {tagPct >= 75 ? "Well organized" : tagPct >= 40 ? "Partially tagged" : "Tag more items"}
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-card p-5 flex items-center gap-5">
            <div className="relative flex items-center justify-center shrink-0">
              <RingProgress value={orgPct} color="hsl(190, 60%, 45%)" />
              <span className="absolute text-[15px] font-extrabold font-mono tabular-nums">{orgPct}%</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold">Space allocation</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {stats.spaceCredentials} of {stats.totalCredentials} assigned
              </div>
              <div className="text-[11px] mt-2" style={{ color: orgPct >= 75 ? "hsl(142, 60%, 40%)" : orgPct >= 40 ? "hsl(35, 80%, 45%)" : "hsl(0, 60%, 50%)" }}>
                {orgPct >= 75 ? "Great structure" : orgPct >= 40 ? "Good start" : "Assign spaces"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold">Top tags</h2>
              <Link href="/manage" className="text-[12px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {tagBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {tagBreakdown.slice(0, 4).map((t: any) => (
                  <div key={t.name} className="border rounded-lg p-2.5 flex items-center gap-2.5 bg-background hover:bg-accent/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${t.color}18` }}>
                      <Tag className="w-4 h-4" style={{ color: t.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold truncate">{t.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground tabular-nums">{t.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-muted-foreground">No tags yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3 h-8 text-[12px]">
                  <Link href="/manage">Create one</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="border rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold">Top services</h2>
              <Link href="/manage" className="text-[12px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {typeBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {typeBreakdown.slice(0, 4).map((t: any) => {
                  const stype = getServiceType(t.type);
                  const Icon = getIconComponent(stype.icon);
                  return (
                    <div key={t.type} className="border rounded-lg p-2.5 flex items-center gap-2.5 bg-background hover:bg-accent/40 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${stype.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: stype.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold truncate">{stype.label}</div>
                        <div className="text-[11px] font-mono text-muted-foreground tabular-nums">{t.count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-muted-foreground">No credentials yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3 h-8 text-[12px]">
                  <Link href="/spaces">Add one</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="border rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold">Top spaces</h2>
              <Link href="/spaces" className="text-[12px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {spaceBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {spaceBreakdown.slice(0, 4).map((sp: any) => {
                  const Icon = getSpaceIcon(sp.icon);
                  return (
                    <div key={sp.name} className="border rounded-lg p-2.5 flex items-center gap-2.5 bg-background hover:bg-accent/40 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${sp.color}18` }}>
                        <Icon className="w-4 h-4" style={{ color: sp.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold truncate">{sp.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground tabular-nums">{sp.count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-muted-foreground">No spaces yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3 h-8 text-[12px]">
                  <Link href="/spaces">Create one</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
