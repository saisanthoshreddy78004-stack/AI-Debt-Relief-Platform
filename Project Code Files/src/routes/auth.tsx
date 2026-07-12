import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const searchSchema = z.object({ mode: z.enum(["login", "register"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — Aequita" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const isRegister = mode === "register";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isRegister) {
        if (!name.trim()) throw new Error("Name required");
        register(name.trim(), email.trim().toLowerCase(), password);
        toast.success("Account created");
      } else {
        login(email.trim().toLowerCase(), password);
        toast.success("Welcome back");
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Visual */}
      <div className="gradient-hero hidden flex-col justify-between p-12 text-primary-foreground md:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-foreground/10 font-display">A</div>
          <span className="font-display text-lg">Aequita</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl leading-tight">A calmer way to face what you owe.</h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Aequita reads your debt, finds your leverage, and writes the letter that gets the bank to listen.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">Educational tool. Not financial advice.</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl">{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRegister ? "It takes thirty seconds." : "Sign in to your dashboard."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isRegister && (
              <Field label="Full name">
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" required />
              </Field>
            )}
            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input" placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input" placeholder="••••••••" minLength={4} required />
            </Field>

            <button disabled={busy} className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {busy ? "..." : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "New to Aequita?"}{" "}
            <Link to="/auth" search={{ mode: isRegister ? "login" : "register" }} className="text-accent underline-offset-2 hover:underline">
              {isRegister ? "Sign in" : "Create one"}
            </Link>
          </p>

          <style>{`
            .input {
              width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.625rem;
              background: var(--color-card); border: 1px solid var(--color-border);
              color: var(--color-foreground); font-size: 0.875rem;
              outline: none; transition: border-color .15s;
            }
            .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 18%, transparent); }
          `}</style>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
