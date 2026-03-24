import { useGetStats } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Layout } from "@/components/layout";
import { Loader2, Key, Folder, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (isError || !stats) {
    return (
      <Layout>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Failed to load dashboard statistics.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const statCards = [
    { label: "Total Credentials", value: stats.totalCredentials, icon: Key, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Categories", value: stats.totalCategories, icon: Folder, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Added this week", value: stats.recentlyAdded, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">An overview of your vault</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-muted-foreground font-medium">{s.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.categoryBreakdown.length > 0 ? (
                <>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
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
                            borderRadius: '8px',
                            border: '1px solid hsl(220 9% 91%)',
                            fontSize: '13px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,.06)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    {stats.categoryBreakdown.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name} ({entry.count})
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[240px] flex items-center justify-center rounded-lg border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">No category data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[320px]">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-1.5">Your vault is secure</h2>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                All credentials are stored securely. Only you can access your vault data through your authenticated session.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
