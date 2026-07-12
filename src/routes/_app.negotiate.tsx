import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Sparkles, Copy, Download, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useAuth } from "@/lib/auth-context";
import { loansRepo, lettersRepo, type Loan, type NegotiationLetter } from "@/lib/store";
import { generateLetter, recommendSettlement } from "@/lib/ai-engine";

const search = z.object({
  loanId: z.string().optional(),
  type: z.enum(["settlement", "emi_reduction", "hardship"]).optional(),
});

export const Route = createFileRoute("/_app/negotiate")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Negotiation Letter Generator — Aequita" }] }),
  component: NegotiatePage,
});

const TYPES: { id: NegotiationLetter["letterType"]; label: string; desc: string }[] = [
  { id: "settlement", label: "Settlement (OTS)", desc: "One-time settlement offer at a reduced amount." },
  { id: "emi_reduction", label: "EMI reduction", desc: "Restructure to lower the monthly EMI." },
  { id: "hardship", label: "Hardship notice", desc: "Formal hardship notification, request a meeting." },
];

function NegotiatePage() {
  const { user } = useAuth();
  const params = Route.useSearch();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanId, setLoanId] = useState<string>("");
  const [type, setType] = useState<NegotiationLetter["letterType"]>(params.type ?? "settlement");
  const [reason, setReason] = useState("");
  const [pct, setPct] = useState(60);
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ls = loansRepo.list(user.id);
    setLoans(ls);
    setLoanId(params.loanId ?? ls[0]?.id ?? "");
  }, [user, params.loanId]);

  const loan = useMemo(() => loans.find((l) => l.id === loanId), [loans, loanId]);

  // Default suggested OTS based on the loan profile
  useEffect(() => {
    if (loan && user) {
      const r = recommendSettlement(loan, user.id);
      setPct(r.settlementPercentage);
    }
  }, [loan, user]);

  const generate = () => {
    if (!user || !loan) { toast.error("Pick a loan first"); return; }
    setBusy(true);
    setTimeout(() => {
      const text = generateLetter({
        userName: user.name, loan, type, reason, settlementPct: pct,
      });
      setLetter(text);
      setBusy(false);
      toast.success("Letter generated");
    }, 600);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    toast.success("Copied to clipboard");
  };

  const save = () => {
    if (!user || !loan || !letter) return;
    lettersRepo.add({
      userId: user.id, loanId: loan.id, letterType: type,
      bankName: loan.bankName, generatedLetter: letter,
    });
    toast.success("Saved to history");
  };

  const downloadPdf = () => {
    if (!letter) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(letter, width);
    let y = margin;
    const pageH = doc.internal.pageSize.getHeight();
    lines.forEach((ln: string) => {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y);
      y += 16;
    });
    doc.save(`aequita-${type}-${loan?.bankName.replace(/\s+/g, "-") ?? "letter"}.pdf`);
    toast.success("PDF downloaded");
  };

  if (!user) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Controls */}
      <div className="space-y-5 lg:col-span-2">
        <div>
          <p className="text-sm text-muted-foreground">AI generator</p>
          <h1 className="font-display text-3xl">Draft your negotiation letter</h1>
        </div>

        <div className="card-surface space-y-5 p-5">
          <Block label="Loan account">
            {loans.length === 0 ? (
              <Link to="/loans" className="text-sm text-accent hover:underline">Add a loan first</Link>
            ) : (
              <select className="input" value={loanId} onChange={(e) => setLoanId(e.target.value)}>
                {loans.map((l) => (
                  <option key={l.id} value={l.id}>{l.loanType} · {l.bankName}</option>
                ))}
              </select>
            )}
          </Block>

          <Block label="Letter type">
            <div className="grid gap-2">
              {TYPES.map((t) => (
                <label key={t.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${type === t.id ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/40"}`}>
                  <input type="radio" className="mt-1" checked={type === t.id} onChange={() => setType(t.id)} />
                  <div>
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Block>

          {type === "settlement" && (
            <Block label={`Settlement offer: ${pct}% of outstanding`}>
              <input
                type="range" min={20} max={90} value={pct}
                onChange={(e) => setPct(+e.target.value)}
                className="w-full accent-[var(--color-accent)]"
              />
              <p className="mt-1 text-xs text-muted-foreground">Tip: aggressive overdue accounts (3+ months) typically settle at 40–55%.</p>
            </Block>
          )}

          <Block label="Your reason / hardship (optional)">
            <textarea
              rows={4} className="input"
              placeholder="e.g. Recent job loss, medical emergency in family, business income reduced by 60%..."
              value={reason} onChange={(e) => setReason(e.target.value)}
            />
          </Block>

          <button
            onClick={generate} disabled={busy || !loan}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm text-primary-foreground disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" /> {busy ? "Generating..." : letter ? "Regenerate letter" : "Generate letter"}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="lg:col-span-3">
        <div className="card-surface flex h-full min-h-[500px] flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="text-sm font-medium">Preview</p>
            <div className="flex items-center gap-1">
              <ToolBtn onClick={copy} disabled={!letter} icon={Copy} label="Copy" />
              <ToolBtn onClick={save} disabled={!letter} icon={Save} label="Save" />
              <ToolBtn onClick={downloadPdf} disabled={!letter} icon={Download} label="PDF" />
              <ToolBtn onClick={generate} disabled={!letter} icon={RefreshCw} label="Redo" />
            </div>
          </div>
          {letter ? (
            <pre className="flex-1 overflow-auto whitespace-pre-wrap p-6 font-serif text-[15px] leading-relaxed text-foreground">{letter}</pre>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <Sparkles className="h-8 w-8 text-accent" />
              <p className="mt-4 font-medium">Your letter will appear here.</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Pick a loan, choose a letter type, and click Generate. You can refine the hardship reason and re-run as many times as you need.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%; padding: 0.55rem 0.75rem; border-radius: 0.5rem;
          background: var(--color-card); border: 1px solid var(--color-border);
          font-size: 0.875rem; color: var(--color-foreground); outline: none;
          font-family: inherit;
        }
        .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 18%, transparent); }
      `}</style>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ToolBtn({ onClick, disabled, icon: Icon, label }: { onClick: () => void; disabled?: boolean; icon: typeof Copy; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
