// Mock data store backed by localStorage. Stands in for the FastAPI backend.
export type User = { id: string; name: string; email: string };

export type Loan = {
  id: string;
  userId: string;
  loanType: string;
  bankName: string;
  outstandingAmount: number;
  emiAmount: number;
  interestRate: number;
  overdueMonths: number;
  monthlyIncome: number;
  dueDate: string;
  createdAt: string;
};

export type Recommendation = {
  id: string;
  userId: string;
  loanId?: string;
  recommendation: string;
  settlementPercentage: number;
  riskLevel: "Low" | "Moderate" | "High" | "Severe";
  aiAnalysis: string;
  strategy: string[];
  createdAt: string;
};

export type NegotiationLetter = {
  id: string;
  userId: string;
  loanId?: string;
  letterType: "settlement" | "emi_reduction" | "hardship";
  bankName: string;
  generatedLetter: string;
  createdAt: string;
};

const K = {
  users: "drp_users",
  session: "drp_session",
  loans: "drp_loans",
  recs: "drp_recommendations",
  letters: "drp_letters",
};

const read = <T>(k: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  if (typeof window !== "undefined") localStorage.setItem(k, JSON.stringify(v));
};

export const uid = () => Math.random().toString(36).slice(2, 11);

// --- Auth ---
type StoredUser = User & { password: string };
export const auth = {
  register(name: string, email: string, password: string): User {
    const users = read<StoredUser[]>(K.users, []);
    if (users.some((u) => u.email === email)) throw new Error("Email already registered");
    const u: StoredUser = { id: uid(), name, email, password };
    users.push(u);
    write(K.users, users);
    const { password: _p, ...safe } = u;
    write(K.session, safe);
    return safe;
  },
  login(email: string, password: string): User {
    const users = read<StoredUser[]>(K.users, []);
    const u = users.find((x) => x.email === email && x.password === password);
    if (!u) throw new Error("Invalid credentials");
    const { password: _p, ...safe } = u;
    write(K.session, safe);
    return safe;
  },
  logout() {
    if (typeof window !== "undefined") localStorage.removeItem(K.session);
  },
  current(): User | null {
    return read<User | null>(K.session, null);
  },
};

// --- Loans ---
export const loansRepo = {
  list(userId: string): Loan[] {
    return read<Loan[]>(K.loans, []).filter((l) => l.userId === userId);
  },
  add(l: Omit<Loan, "id" | "createdAt">): Loan {
    const all = read<Loan[]>(K.loans, []);
    const loan: Loan = { ...l, id: uid(), createdAt: new Date().toISOString() };
    all.push(loan);
    write(K.loans, all);
    return loan;
  },
  update(id: string, patch: Partial<Loan>): Loan | undefined {
    const all = read<Loan[]>(K.loans, []);
    const i = all.findIndex((x) => x.id === id);
    if (i < 0) return;
    all[i] = { ...all[i], ...patch };
    write(K.loans, all);
    return all[i];
  },
  remove(id: string) {
    write(K.loans, read<Loan[]>(K.loans, []).filter((l) => l.id !== id));
  },
  seedIfEmpty(userId: string) {
    const existing = read<Loan[]>(K.loans, []);
    if (existing.some((l) => l.userId === userId)) return;
    const now = new Date();
    const sample: Loan[] = [
      {
        id: uid(), userId, loanType: "Personal Loan", bankName: "HDFC Bank",
        outstandingAmount: 450000, emiAmount: 14500, interestRate: 14.5,
        overdueMonths: 2, monthlyIncome: 65000,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().slice(0, 10),
        createdAt: now.toISOString(),
      },
      {
        id: uid(), userId, loanType: "Credit Card", bankName: "ICICI Bank",
        outstandingAmount: 180000, emiAmount: 9200, interestRate: 36,
        overdueMonths: 3, monthlyIncome: 65000,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 12).toISOString().slice(0, 10),
        createdAt: now.toISOString(),
      },
      {
        id: uid(), userId, loanType: "Auto Loan", bankName: "SBI",
        outstandingAmount: 320000, emiAmount: 8900, interestRate: 10.25,
        overdueMonths: 0, monthlyIncome: 65000,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 20).toISOString().slice(0, 10),
        createdAt: now.toISOString(),
      },
    ];
    write(K.loans, [...existing, ...sample]);
  },
};

// --- Recommendations ---
export const recsRepo = {
  list(userId: string): Recommendation[] {
    return read<Recommendation[]>(K.recs, []).filter((r) => r.userId === userId);
  },
  add(r: Omit<Recommendation, "id" | "createdAt">): Recommendation {
    const all = read<Recommendation[]>(K.recs, []);
    const rec: Recommendation = { ...r, id: uid(), createdAt: new Date().toISOString() };
    all.push(rec);
    write(K.recs, all);
    return rec;
  },
};

// --- Negotiation letters ---
export const lettersRepo = {
  list(userId: string): NegotiationLetter[] {
    return read<NegotiationLetter[]>(K.letters, [])
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  add(l: Omit<NegotiationLetter, "id" | "createdAt">): NegotiationLetter {
    const all = read<NegotiationLetter[]>(K.letters, []);
    const letter: NegotiationLetter = { ...l, id: uid(), createdAt: new Date().toISOString() };
    all.push(letter);
    write(K.letters, all);
    return letter;
  },
  remove(id: string) {
    write(K.letters, read<NegotiationLetter[]>(K.letters, []).filter((l) => l.id !== id));
  },
};
