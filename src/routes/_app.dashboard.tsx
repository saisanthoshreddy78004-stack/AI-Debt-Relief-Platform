import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowUpRight, AlertTriangle, TrendingDown, Wallet, Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { loansRepo, lettersRepo, type Loan } from "@/lib/store";
import { analyze } from "@/lib/ai-engine";
import { inr, inrCompact } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aequita" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [letters, setLetters] = useState(0);

  useEffect(() => {
    if (!user) return;
    loansRepo.seedIfEmpty(user.id);
    setLoans(loansRepo.list(user.id));
    setLetters(lettersRepo.list(user.id).length);
  }, [user]);

  const health = useMemo(() => analyze(loans), [loans]);

  if (!user) return null;

  const statusColor = {
    Healthy: "text-success",
    Watch: "text-gold",
    Stress: "text-warning",
    Critical: "text-destructive",
  }[health.status];

  return (
    <div className="space-y-6">
      {/* Hello */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-3xl">{user.name.split(" ")[0]} — here's where you stand.</h1>
        </div>
        <Link to="/negotiate" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
          <Sparkles className="h-4 w-4" /> Draft a letter
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={Wallet} label="Total outstanding" value={inrCompact(health.totalOutstanding)} sub={`${loans.length} active loan${loans.length === 1 ? "" : "s"}`} />
        <Kpi icon={TrendingDown} label="Monthly EMI" value={inrCompact(health.totalEmi)} sub={`${(health.emiRatio * 100).toFixed(0)}% of income`} />
        <Kpi icon={AlertTriangle} label="Debt stress" value={`${health.stressScore}/100`} sub={health.status} subClass={statusColor} />
        <Kpi icon={Heart} label="Financial health" value={`${health.healthScore}/100`} sub={`Surplus ${inrCompact(health.monthlySurplus)}/mo`} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-surface lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg">EMI by loan</h3>
            <span className="chip">{loans.length} loans</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loans.map((l) => ({ name: l.bankName.split(" ")[0], EMI: l.emiAmount, Outstanding: l.outstandingAmount / 10 }))}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => inrCompact(v)} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                  formatter={(v: number, n) => [inr(n === "Outstanding" ? v * 10 : v), n]}
                />
                <Bar dataKey="EMI" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Outstanding" fill="var(--color-gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Outstanding scaled ÷ 10 for visual comparison.</p>
        </div>

        <div className="card-surface p-6">
          <h3 className="mb-2 text-lg">Income split</h3>
          <p className="text-xs text-muted-foreground">Monthly cashflow allocation</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "EMI burden", value: health.totalEmi },
                    { name: "Surplus", value: health.monthlySurplus },
                  ]}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                >
                  <Cell fill="var(--color-accent)" />
                  <Cell fill="var(--color-gold)" />
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                  formatter={(v: number) => inr(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <Legend dot="var(--color-accent)" label="EMI" value={inr(health.totalEmi)} />
            <Legend dot="var(--color-gold)" label="Surplus" value={inr(health.monthlySurplus)} />
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink to="/loans" title="Manage loans" desc="Add, edit, or remove your loan accounts." />
        <QuickLink to="/settlement" title="AI settlement" desc="Get a recommended settlement % per loan." />
        <QuickLink to="/history" title="Letter history" desc={`${letters} negotiation letter${letters === 1 ? "" : "s"} saved`} />
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, subClass = "text-muted-foreground" }: { icon: typeof Wallet; label: string; value: string; sub: string; subClass?: string }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      <p className={`mt-1 text-xs ${subClass}`}>{sub}</p>
    </div>
  );
}

function Legend({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: "/loans" | "/settlement" | "/history"; title: string; desc: string }) {
  return (
    <Link to={to} className="card-surface group flex items-center justify-between p-5 transition hover:border-accent">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-accent" />
    </Link>
  );
}
