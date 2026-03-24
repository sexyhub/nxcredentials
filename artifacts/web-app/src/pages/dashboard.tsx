import { useGetStats } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Layout } from "@/components/layout";
import { Loader2, Key, Folder, Clock, TrendingUp } from "lucide-react";

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
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-destructive">Failed to load dashboard data.</p>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { label: "Total Credentials", value: stats.totalCredentials, icon: Key, color: "bg-blue-50 text-blue-600" },
    { label: "Categories", value: stats.totalCategories, icon: Folder, color: "bg-violet-50 text-violet-600" },
    { label: "Added this week", value: stats.recentlyAdded, icon: Clock, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Dashboard</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Overview of your credential vault</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] text-muted-foreground font-medium">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[32px] font-bold tracking-tight leading-none">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[14px] font-semibold">By Category</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Credential distribution</p>
              </div>
            </div>
            {stats.categoryBreakdown.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        stroke="none"
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(220 9% 93%)',
                          fontSize: '12px',
                          boxShadow: 'none',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2">
                  {stats.categoryBreakdown.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-[12px]">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-mono font-medium text-foreground">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-[13px] text-muted-foreground">No categories yet</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-[hsl(225,15%,11%)] rounded-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[12px] font-medium text-emerald-400">Vault Active</span>
              </div>
              <h2 className="text-[20px] font-semibold text-white mb-2">All systems secure</h2>
              <p className="text-[13px] text-white/40 leading-relaxed">
                Your credentials are encrypted and protected with session-based authentication.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] text-white/30 font-mono">Active session</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
