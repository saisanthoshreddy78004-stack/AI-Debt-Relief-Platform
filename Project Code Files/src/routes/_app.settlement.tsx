import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { loansRepo, recsRepo, type Loan, type Recommendation } from "@/lib/store";
import { recommendSettlement } from "@/lib/ai-engine";
import { inr } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settlement")({
  head: () => ({ meta: [{ title: "Settlement AI — Aequita" }] }),
  component: SettlementPage,
});

const riskTone: Record<string, string> = {
  Low: "bg-success/10 text-success",
  Moderate: "bg-gold/15 text-gold-foreground",
  High: "bg-warning/15 text-warning",
  Severe: "bg-destructive/12 text-destructive",
};

function SettlementPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recs, setRecs] = useState<Record<string, Recommendation>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoans(loansRepo.list(user.id));
  }, [user]);

  const analyze = (loan: Loan) => {
    if (!user) return;
    setBusy(loan.id);
    // Simulate AI latency
    setTimeout(() => {
      const recDraft = recommendSettlement(loan, user.id);
      const saved = recsRepo.add(recDraft);
      setRecs((m) => ({ ...m, [loan.id]: saved }));
      setBusy(null);
      toast.success("Settlement analysis ready");
    }, 700);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">AI-powered settlement engine</p>
        <h1 className="font-display text-3xl">Find your leverage, loan by loan.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Aequita blends your overdue history, interest rate, and EMI burden into a realistic one-time settlement percentage you can put to the lender.
        </p>
      </div>

      {loans.length === 0 && (
        <div className="card-surface p-10 text-center">
          <p className="text-muted-foreground">No loans found. Add a loan first.</p>
          <Link to="/loans" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Add a loan</Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {loans.map((l) => {
          const r = recs[l.id];
          return (
            <div key={l.id} className="card-surface p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{l.loanType}</p>
                  <h3 className="font-display text-xl">{l.bankName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {inr(l.outstandingAmount)} outstanding · {l.interestRate}% · {l.overdueMonths > 0 ? `${l.overdueMonths} mo overdue` : "current"}
                  </p>
                </div>
                {r && <span className={`chip ${riskTone[r.riskLevel]} border-transparent`}>{r.riskLevel} risk</span>}
              </div>

              {!r ? (
                <button
                  onClick={() => analyze(l)}
                  disabled={busy === l.id}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" /> {busy === l.id ? "Analyzing..." : "Run AI analysis"}
                </button>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Suggested OTS</p>
                      <p className="font-display text-4xl text-accent">{r.settlementPercentage}%</p>
                    </div>
                    <div className="border-l border-border pl-6">
                      <p className="text-xs text-muted-foreground">Settlement offer</p>
                      <p className="font-display text-2xl">{inr((l.outstandingAmount * r.settlementPercentage) / 100)}</p>
                    </div>
                  </div>
                  <p className="text-sm">{r.recommendation}</p>
                  <details className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Strategy ({r.strategy.length} steps)</summary>
                    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
                      {r.strategy.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </details>
                  <Link
                    to="/negotiate"
                    search={{ loanId: l.id, type: "settlement" }}
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    Draft a settlement letter <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
