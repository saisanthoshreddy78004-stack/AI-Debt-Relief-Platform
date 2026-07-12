import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Trash2, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { lettersRepo, type NegotiationLetter } from "@/lib/store";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Negotiation History — Aequita" }] }),
  component: HistoryPage,
});

const typeLabel: Record<NegotiationLetter["letterType"], string> = {
  settlement: "Settlement (OTS)",
  emi_reduction: "EMI reduction",
  hardship: "Hardship notice",
};

function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NegotiationLetter[]>([]);
  const [view, setView] = useState<NegotiationLetter | null>(null);

  const refresh = () => user && setItems(lettersRepo.list(user.id));
  useEffect(() => { refresh(); }, [user]);

  const remove = (l: NegotiationLetter) => {
    if (!confirm("Delete this letter?")) return;
    lettersRepo.remove(l.id);
    toast.success("Deleted");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Saved AI drafts</p>
        <h1 className="font-display text-3xl">Negotiation history</h1>
      </div>

      {items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No saved letters yet.</p>
          <Link to="/negotiate" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Draft your first letter</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((l) => (
            <div key={l.id} className="card-surface flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{typeLabel[l.letterType]} — {l.bankName}</p>
                <p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setView(l)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="View"><Eye className="h-4 w-4" /></button>
                <button onClick={() => remove(l)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-surface flex max-h-[85vh] w-full max-w-2xl flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="font-medium">{typeLabel[view.letterType]} — {view.bankName}</p>
              <button onClick={() => setView(null)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap p-6 font-serif text-[15px] leading-relaxed">{view.generatedLetter}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
