import { useGetStats } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

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
        <div className="border rounded-lg p-6">
          <p className="text-[13px] text-destructive">Could not load dashboard data.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">Dashboard</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Your vault at a glance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border">
          {[
            { label: "Credentials", value: stats.totalCredentials, href: "/credentials" },
            { label: "Categories", value: stats.totalCategories, href: "/categories" },
            { label: "Added this week", value: stats.recentlyAdded, href: "/credentials" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-card p-5 flex flex-col justify-between min-h-[110px] group hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">{item.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-[36px] font-bold tracking-tighter leading-none font-mono tabular-nums">{item.value}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-[14px] font-semibold mb-1">Category breakdown</h3>
            <p className="text-[12px] text-muted-foreground mb-5">How your credentials are organized</p>
            {stats.categoryBreakdown.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={76}
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
                          border: '1px solid hsl(36 10% 91%)',
                          fontSize: '12px',
                          fontFamily: 'Outfit, sans-serif',
                          boxShadow: 'none',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                  {stats.categoryBreakdown.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-[12px]">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-mono font-medium">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <p className="text-[13px] text-muted-foreground">No categories created yet.</p>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-6 bg-card flex flex-col justify-between">
            <div>
              <h3 className="text-[14px] font-semibold mb-1">Quick actions</h3>
              <p className="text-[12px] text-muted-foreground mb-5">Frequently used shortcuts</p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Add a new credential", href: "/credentials" },
                { label: "Create a category", href: "/categories" },
                { label: "Manage settings", href: "/settings", admin: true },
              ]
                .filter((a) => !a.admin || user?.isAdmin)
                .map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between px-4 py-3 border rounded-lg text-[13px] hover:bg-accent/40 transition-colors group"
                  >
                    <span>{action.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
