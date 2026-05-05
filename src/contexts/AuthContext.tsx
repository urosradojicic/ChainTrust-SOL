import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'investor' | 'startup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: AppRole, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Demo accounts — always available until production ──────────────
const DEMO_ACCOUNTS: Record<string, { password: string; role: AppRole; name: string }> = {
  'admin@chainmetrics.io':    { password: 'admin123',   role: 'admin',    name: 'Admin' },
  'investor@chainmetrics.io': { password: 'investor1',  role: 'investor', name: 'Investor' },
  'startup@chainmetrics.io':  { password: 'startup1',   role: 'startup',  name: 'Startup' },
};

const DEMO_STORAGE_KEY = 'chaintrust_demo_user';

function createDemoUser(email: string, account: typeof DEMO_ACCOUNTS[string]): User {
  // Use a stable ID so data keyed by user ID persists across session restores
  return {
    id: `demo-${account.role}`,
    email,
    app_metadata: {},
    user_metadata: { display_name: account.name, role: account.role },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

/**
 * Demo session lifetime — 24 hours. Balances "don't force re-login every hour
 * during investor demos" with "limit attack window if browser is compromised".
 * Test credentials (admin/investor/startup@chainmetrics.io) still work normally;
 * the user just has to sign in again after a day.
 */
const DEMO_SESSION_SECONDS = 3600 * 24; // 24 hours

function createDemoSession(user: User): Session {
  return {
    access_token: `demo_token_${user.id}`,
    refresh_token: `demo_refresh_${user.id}`,
    expires_in: DEMO_SESSION_SECONDS,
    expires_at: Math.floor(Date.now() / 1000) + DEMO_SESSION_SECONDS,
    token_type: 'bearer',
    user,
  } as Session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const VALID_ROLES: AppRole[] = ['admin', 'investor', 'startup'];

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
      if (error) {
        // Real DB error (RLS misconfig, network) — distinct from "no row yet".
        // Log to console in dev so it's visible during local development; in
        // prod the user just stays role=null and pages fall back to their
        // unauthorized-empty-state, which is the correct deny-by-default UX.
        if (import.meta.env.DEV) console.warn('[auth] fetchRole error:', error);
        return;
      }
      if (data && VALID_ROLES.includes(data as AppRole)) {
        setRole(data as AppRole);
      }
    } catch (err) {
      // Network failure / Supabase unreachable — role stays null. We log in
      // dev to make environment-config bugs obvious.
      if (import.meta.env.DEV) console.warn('[auth] fetchRole threw:', err);
    }
  };

  // Restore demo session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate stored data structure before trusting it
        if (typeof parsed?.email === 'string' && typeof parsed?.role === 'string') {
          const account = DEMO_ACCOUNTS[parsed.email];
          // Check session age — auto-expire after DEMO_SESSION_SECONDS
          const signedInAt = typeof parsed?.signedInAt === 'number' ? parsed.signedInAt : 0;
          const ageSeconds = (Date.now() - signedInAt) / 1000;
          const expired = signedInAt === 0 || ageSeconds > DEMO_SESSION_SECONDS;
          // Only restore if email matches a known demo account AND role matches AND session fresh
          if (account && account.role === parsed.role && !expired) {
            const demoUser = createDemoUser(parsed.email, account);
            setUser(demoUser);
            setSession(createDemoSession(demoUser));
            setRole(account.role); // Use account.role, not user-supplied role
            setIsDemo(true);
            setLoading(false);
            return;
          }
        }
        // Invalid or expired — clear it
        localStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    // Try real Supabase auth. The boot is a race between `getSession()`
    // resolving and `onAuthStateChange` firing — whichever wins flips
    // `loading` off and clears the safety timeout, so the unauthenticated UI
    // never flashes for 3s while a slow getSession is still in flight.
    let booted = false;
    const finishBoot = () => {
      if (booted) return;
      booted = true;
      clearTimeout(timeout);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setRole(null);
        }
        finishBoot();
      },
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      finishBoot();
    }).catch((err) => {
      if (import.meta.env.DEV) console.warn('[auth] getSession failed:', err);
      finishBoot();
    });

    // Safety timeout — covers full Supabase outage so pages always render.
    const timeout = setTimeout(finishBoot, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check demo accounts first
    const demoAccount = DEMO_ACCOUNTS[email.toLowerCase()];
    if (demoAccount && password === demoAccount.password) {
      const demoUser = createDemoUser(email.toLowerCase(), demoAccount);
      const demoSession = createDemoSession(demoUser);
      setUser(demoUser);
      setSession(demoSession);
      setRole(demoAccount.role);
      setIsDemo(true);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({
        email: email.toLowerCase(),
        role: demoAccount.role,
        signedInAt: Date.now(),
      }));
      return { error: null };
    }

    // Check if it's a demo email with wrong password
    if (demoAccount && password !== demoAccount.password) {
      return { error: new Error('Invalid password for demo account') };
    }

    // Fall back to real Supabase auth
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch {
      return { error: new Error('Authentication service unavailable. Use a demo account.') };
    }
  };

  const signUp = async (email: string, password: string, selectedRole: AppRole, displayName?: string) => {
    // Block signup with demo emails
    if (DEMO_ACCOUNTS[email.toLowerCase()]) {
      return { error: new Error('This email is reserved. Use Sign In instead.') };
    }

    // Client-side defense-in-depth: admin role can never be self-assigned at
    // signup. RLS also rejects this server-side, but a clear early error
    // beats a 403 round-trip and makes intent obvious to future readers.
    if (selectedRole === 'admin') {
      return { error: new Error('Admin role cannot be self-assigned.') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split('@')[0] },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { error: error as Error };

      if (data.user) {
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: selectedRole,
        });
        if (roleError) return { error: roleError as unknown as Error };
      }
      return { error: null };
    } catch {
      return { error: new Error('Sign up service unavailable. Use a demo account to explore.') };
    }
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setIsDemo(false);
    } else {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
    }
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, isDemo, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
