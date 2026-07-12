import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, loansRepo, type User } from "./store";

type Ctx = {
  user: User | null;
  login: (email: string, password: string) => User;
  register: (name: string, email: string, password: string) => User;
  logout: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { setUser(auth.current()); }, []);
  return (
    <AuthCtx.Provider
      value={{
        user,
        login: (e, p) => { const u = auth.login(e, p); loansRepo.seedIfEmpty(u.id); setUser(u); return u; },
        register: (n, e, p) => { const u = auth.register(n, e, p); loansRepo.seedIfEmpty(u.id); setUser(u); return u; },
        logout: () => { auth.logout(); setUser(null); },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
};
