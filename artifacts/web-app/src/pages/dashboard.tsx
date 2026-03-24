import { useGetStats } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Layout } from "@/components/layout";
import { Loader2, Key, Folder, Clock, Lock } from "lucide-react";

export default function Dashboard() {
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
        <div className="border p-6">
          <p className="text-sm text-destructive">Failed to load dashboard data.</p>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { label: "CREDENTIALS", value: stats.totalCredentials, icon: Key },
    { label: "CATEGORIES", value: stats.totalCategories, icon: Folder },
    { label: "ADDED / 7D", value: stats.recentlyAdded, icon: Clock },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Vault overview and statistics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="border bg-card p-5 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground mb-3">{s.label}</div>
                <div className="text-4xl font-bold tracking-tighter">{s.value}</div>
              </div>
              <div className="w-8 h-8 border flex items-center justify-center">
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 border bg-card p-6">
            <div className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground mb-5">Category Breakdown</div>
            {stats.categoryBreakdown.length > 0 ? (
              <>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="count"
                        stroke="hsl(0 0% 97%)"
                        strokeWidth={2}
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '0px',
                          border: '1px solid hsl(0 0% 89%)',
                          fontSize: '12px',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                  {stats.categoryBreakdown.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5" style={{ backgroundColor: entry.color }} />
                      <span className="font-medium">{entry.name}</span>
                      <span className="font-mono">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center border border-dashed">
                <p className="text-sm text-muted-foreground">No category data yet</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-foreground text-background p-6 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="text-[10px] font-mono font-medium uppercase tracking-widest text-white/30 mb-4">System Status</div>
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center mb-6">
                <Lock className="w-5 h-5 text-white/60" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Vault Secured</h2>
              <p className="text-sm text-white/40 leading-relaxed">
                All credentials encrypted and stored. Session authentication active.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <div className="border border-white/10 px-2.5 py-1.5">
                <span className="text-[10px] font-mono text-white/30">AES-256</span>
              </div>
              <div className="border border-white/10 px-2.5 py-1.5">
                <span className="text-[10px] font-mono text-white/30">BCRYPT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
