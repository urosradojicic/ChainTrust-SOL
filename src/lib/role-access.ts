/**
 * Role-based access control configuration.
 *
 * - 'public'   → anyone, no login required
 * - 'auth'     → any logged-in user
 * - 'investor' → investor + admin
 * - 'startup'  → startup + admin
 * - 'admin'    → admin only
 */

type AppRole = 'admin' | 'investor' | 'startup';
type Access = 'public' | 'auth' | 'investor' | 'startup' | 'admin';

export const PAGE_ACCESS: Record<string, Access> = {
  '/':                'public',
  '/login':           'public',
  '/demo':            'public',
  '/dashboard':       'auth',
  '/leaderboard':     'auth',
  '/security':        'auth',
  '/tokenomics':      'auth',
  '/staking':         'auth',
  '/governance':      'auth',
  '/compliance':      'auth',
  '/provenance':      'auth',

  // Investor-specific
  '/portfolio':       'investor',
  '/screener':        'investor',
  '/compare':         'investor',
  '/analytics':       'investor',
  '/cost-calculator': 'investor',
  '/investors':       'investor',
  '/api':             'investor',

  // Startup-specific
  '/my-startup':      'startup',
  '/register':        'startup',
};

/** Check if a given role can access a route */
export function canAccess(role: AppRole | null, path: string): boolean {
  const access = PAGE_ACCESS[path] ?? 'auth';

  if (access === 'public') return true;
  if (!role) return false;
  if (role === 'admin') return true;
  if (access === 'auth') return true;
  if (access === role) return true;
  return false;
}

/** Get the redirect path when access is denied */
export function getDeniedRedirect(role: AppRole | null): string {
  if (!role) return '/login';
  return '/dashboard';
}
