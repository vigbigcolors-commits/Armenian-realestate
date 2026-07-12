import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";



export interface AuthUser {

  id: string;

  name: string;

  email?: string;

  token?: string;

}



const STORAGE_KEY = "smartestate_auth_user";



interface AuthContextValue {

  user: AuthUser | null;

  isAuthenticated: boolean;

  login: (user: AuthUser) => void;

  logout: () => void;

}



const AuthContext = createContext<AuthContextValue | null>(null);



function readStoredUser(): AuthUser | null {

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthUser;

    return parsed?.id ? parsed : null;

  } catch {

    return null;

  }

}



export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<AuthUser | null>(readStoredUser);



  const login = useCallback((next: AuthUser) => {

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    setUser(next);

  }, []);



  const logout = useCallback(() => {

    localStorage.removeItem(STORAGE_KEY);

    setUser(null);

  }, []);



  const value = useMemo(

    () => ({

      user,

      isAuthenticated: Boolean(user?.token || user?.id),

      login,

      logout,

    }),

    [user, login, logout],

  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}



export function useAuth(): AuthContextValue {

  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  return ctx;

}


