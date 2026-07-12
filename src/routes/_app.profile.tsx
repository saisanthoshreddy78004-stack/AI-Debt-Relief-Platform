import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { User as UserIcon, Mail, LogOut } from "lucide-react";
import { loansRepo, lettersRepo, recsRepo } from "@/lib/store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Aequita" }] }),
  component: Profile,
});

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ loans: 0, letters: 0, recs: 0 });

  useEffect(() => {
    if (!user) return;
    setStats({
      loans: loansRepo.list(user.id).length,
      letters: lettersRepo.list(user.id).length,
      recs: recsRepo.list(user.id).length,
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="font-display text-3xl">Your profile</h1>
      </div>

      <div className="card-surface p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-accent text-2xl font-display text-accent-foreground">
            {user.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-display text-2xl">{user.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {user.email}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
          <Stat label="Loans tracked" value={stats.loans} />
          <Stat label="AI analyses" value={stats.recs} />
          <Stat label="Letters saved" value={stats.letters} />
        </div>
      </div>

      <div className="card-surface p-6">
        <p className="font-medium">Privacy</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your loan, recommendation, and letter data is stored in this browser only. Clearing site data will erase it.
        </p>
      </div>

      <button
        onClick={() => { logout(); navigate({ to: "/" }); }}
        className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-5 py-2.5 text-sm text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-3xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
