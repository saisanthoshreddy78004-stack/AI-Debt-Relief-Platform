import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { loansRepo, type Loan } from "@/lib/store";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — Aequita" }] }),
  component: LoansPage,
});

const LOAN_TYPES = ["Personal Loan", "Credit Card", "Home Loan", "Auto Loan", "Education Loan", "Business Loan", "Other"];

type Draft = Omit<Loan, "id" | "createdAt" | "userId">;
const emptyDraft = (income = 50000): Draft => ({
  loanType: "Personal Loan", bankName: "", outstandingAmount: 100000, emiAmount: 5000,
  interestRate: 12, overdueMonths: 0, monthlyIncome: income,
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
});

function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const refresh = () => user && setLoans(loansRepo.list(user.id));
  useEffect(() => { if (user) { loansRepo.seedIfEmpty(user.id); refresh(); } }, [user]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft(loans[0]?.monthlyIncome ?? 50000));
    setOpen(true);
  };
  const openEdit = (l: Loan) => {
    setEditing(l);
    const { id, createdAt, userId, ...rest } = l;
    setDraft(rest);
    setOpen(true);
  };

  const save = () => {
    if (!user) return;
    if (!draft.bankName.trim()) { toast.error("Bank name required"); return; }
    if (draft.outstandingAmount <= 0) { toast.error("Outstanding amount must be > 0"); return; }
    if (editing) {
      loansRepo.update(editing.id, draft);
      toast.success("Loan updated");
    } else {
      loansRepo.add({ ...draft, userId: user.id });
      toast.success("Loan added");
    }
    setOpen(false);
    refresh();
  };

  const remove = (l: Loan) => {
    if (!confirm(`Delete ${l.loanType} from ${l.bankName}?`)) return;
    loansRepo.remove(l.id);
    toast.success("Loan deleted");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your loan portfolio</p>
          <h1 className="font-display text-3xl">All loans</h1>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
          <Plus className="h-4 w-4" /> Add loan
        </button>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Loan</th>
                <th className="px-5 py-3">Outstanding</th>
                <th className="px-5 py-3">EMI</th>
                <th className="px-5 py-3">Rate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loans.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No loans yet. Add your first loan to start the analysis.</td></tr>
              )}
              {loans.map((l) => (
                <tr key={l.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-4">
                    <p className="font-medium">{l.loanType}</p>
                    <p className="text-xs text-muted-foreground">{l.bankName}</p>
                  </td>
                  <td className="px-5 py-4">{inr(l.outstandingAmount)}</td>
                  <td className="px-5 py-4">{inr(l.emiAmount)}</td>
                  <td className="px-5 py-4">{l.interestRate}%</td>
                  <td className="px-5 py-4">
                    {l.overdueMonths > 0
                      ? <span className="chip" style={{ background: "color-mix(in oklab, var(--color-destructive) 12%, transparent)", color: "var(--color-destructive)", borderColor: "color-mix(in oklab, var(--color-destructive) 30%, transparent)" }}>{l.overdueMonths} mo overdue</span>
                      : <span className="chip" style={{ background: "color-mix(in oklab, var(--color-success) 12%, transparent)", color: "var(--color-success)" }}>Current</span>}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{l.dueDate}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(l)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(l)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="card-surface w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{editing ? "Edit loan" : "Add loan"}</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Loan type">
                <select className="input" value={draft.loanType} onChange={(e) => setDraft({ ...draft, loanType: e.target.value })}>
                  {LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </FormRow>
              <FormRow label="Bank / Lender">
                <input className="input" value={draft.bankName} onChange={(e) => setDraft({ ...draft, bankName: e.target.value })} placeholder="e.g. HDFC Bank" />
              </FormRow>
              <FormRow label="Outstanding (₹)">
                <input type="number" className="input" value={draft.outstandingAmount} onChange={(e) => setDraft({ ...draft, outstandingAmount: +e.target.value })} />
              </FormRow>
              <FormRow label="EMI (₹)">
                <input type="number" className="input" value={draft.emiAmount} onChange={(e) => setDraft({ ...draft, emiAmount: +e.target.value })} />
              </FormRow>
              <FormRow label="Interest rate (%)">
                <input type="number" step="0.1" className="input" value={draft.interestRate} onChange={(e) => setDraft({ ...draft, interestRate: +e.target.value })} />
              </FormRow>
              <FormRow label="Overdue months">
                <input type="number" min={0} className="input" value={draft.overdueMonths} onChange={(e) => setDraft({ ...draft, overdueMonths: +e.target.value })} />
              </FormRow>
              <FormRow label="Monthly income (₹)">
                <input type="number" className="input" value={draft.monthlyIncome} onChange={(e) => setDraft({ ...draft, monthlyIncome: +e.target.value })} />
              </FormRow>
              <FormRow label="Next due date">
                <input type="date" className="input" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              </FormRow>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
              <button onClick={save} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">{editing ? "Save changes" : "Add loan"}</button>
            </div>

            <style>{`
              .input {
                width: 100%; padding: 0.55rem 0.75rem; border-radius: 0.5rem;
                background: var(--color-card); border: 1px solid var(--color-border);
                font-size: 0.875rem; color: var(--color-foreground); outline: none;
              }
              .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 18%, transparent); }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="col-span-2 md:col-span-1">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
