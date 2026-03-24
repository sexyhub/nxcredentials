import { useGetStats } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Layout } from "@/components/layout";
import { Loader2, Key, Folder, Clock, Shield } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !stats) {
    return (
      <Layout>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Failed to load dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Could not retrieve statistics.</p>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { label: "Total Credentials", value: stats.totalCredentials, icon: Key, color: "text-primary", bg: "bg-primary/10" },
    { label: "Categories", value: stats.totalCategories, icon: Folder, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Added (7 days)", value: stats.recentlyAdded, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your vault</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className={`w-8 h-8 rounded-md ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Category Breakdown</h3>
            {stats.categoryBreakdown.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="count"
                      stroke="transparent"
                      strokeWidth={0}
                    >
                      {stats.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '6px',
                        border: '1px solid hsl(220 14% 16%)',
                        backgroundColor: 'hsl(220 18% 12%)',
                        color: 'hsl(210 20% 92%)',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center rounded-md border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No data yet</p>
              </div>
            )}
            {stats.categoryBreakdown.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {stats.categoryBreakdown.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                    {entry.name} ({entry.count})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-1">Vault Secured</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your credentials are stored securely. Only you can access your vault data.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
