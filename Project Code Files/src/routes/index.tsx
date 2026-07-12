import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, BrainCircuit, FileText, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aequita — Calm, AI-powered debt relief" },
      { name: "description", content: "Analyze your debt stress, get AI-backed settlement strategies, and generate lender-ready negotiation letters in minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display">A</div>
          <span className="font-display text-lg">Aequita</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#trust">Trust</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth" search={{ mode: "register" }} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              AI-powered debt relief
            </span>
            <h1 className="mt-5 text-5xl leading-[1.05] tracking-tight md:text-6xl">
              A calmer path out of debt.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Aequita reads your loans, scores your financial stress, and drafts the exact letter your lender needs to consider a settlement — written in the tone that gets a reply.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "register" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
                Start free analysis <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Data stays on your device</span>
              <span>No credit score impact</span>
            </div>
          </div>

          {/* Hero card mock */}
          <div className="md:col-span-5">
            <div className="card-surface relative overflow-hidden p-6">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-2xl" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Financial Health</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-5xl">62</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[62%] rounded-full bg-accent" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">EMI ratio</p>
                  <p className="font-medium">48%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stress</p>
                  <p className="font-medium text-warning">Moderate</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outstanding</p>
                  <p className="font-medium">₹9.5 L</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Suggested OTS</p>
                  <p className="font-medium text-accent">55%</p>
                </div>
              </div>
              <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
                "Negotiate a one-time settlement at ~55%. Lender has commercial incentive to close a 3-month overdue account."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="chip">How it works</p>
          <h2 className="mt-4 text-4xl">Three quiet steps. One clear plan.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Map your loans", d: "Add each loan once — type, bank, EMI, outstanding, overdue months. Aequita does the math." },
              { n: "02", t: "Read your stress", d: "We score debt-to-income, EMI burden, and overdue penalty into a single health number." },
              { n: "03", t: "Draft the letter", d: "Generate a lender-ready settlement, EMI-reduction, or hardship letter — copy, edit, or export to PDF." },
            ].map((s) => (
              <div key={s.n} className="card-surface p-6">
                <span className="font-display text-3xl text-accent">{s.n}</span>
                <h3 className="mt-3 text-xl">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          {[
            { i: BrainCircuit, t: "AI Settlement Engine", d: "Rule-based + AI logic balances overdue, interest rate, and cashflow to suggest a realistic settlement percentage." },
            { i: FileText, t: "Negotiation Letter Generator", d: "Three letter modes — settlement, EMI reduction, hardship — formatted in lender-appropriate Indian banking tone." },
            { i: TrendingUp, t: "Financial Health Tracker", d: "Live DTI, EMI ratio, and stress score with charts you can actually read." },
            { i: ShieldCheck, t: "Private by default", d: "Your loan data is stored locally in the demo. Nothing leaves your browser." },
          ].map((f, i) => (
            <div key={i} className="card-surface p-6">
              <f.i className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-xl">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="trust" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="gradient-hero rounded-3xl px-10 py-14 text-primary-foreground">
          <h2 className="max-w-2xl text-4xl">Stop dreading the call. Start writing the letter.</h2>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Free during early access. Built for borrowers, not lenders.
          </p>
          <Link to="/auth" search={{ mode: "register" }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-gold-foreground">
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Aequita. Educational tool — not financial advice.</span>
          <span>Built with care.</span>
        </div>
      </footer>
    </div>
  );
}
