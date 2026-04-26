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
  '/verify':          'public',
  '/hackathon':       'public',
  '/proof-explorer':  'public',
  '/integrate':       'public',
  '/testnet-demo':    'public',
  '/dashboard':       'auth',
  '/leaderboard':     'auth',
  '/security':        'auth',
  '/tokenomics':      'auth',
  '/staking':         'auth',
  '/governance':      'auth',
  '/compliance':      'auth',
  '/provenance':      'auth',
  '/startup':         'auth',   // dynamic: /startup/:id
  '/entity':          'auth',   // dynamic: /entity/:id
  '/deals':           'auth',   // Deal Rooms (investors + admins + startups)

  // Investor-specific
  '/investor-hub':    'investor',
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
  // Direct match first
  if (PAGE_ACCESS[path]) {
    const access = PAGE_ACCESS[path];
    return resolveAccess(access, role);
  }
  // Support dynamic routes: /startup/abc-123 → lookup /startup
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2) {
    const parentPath = '/' + segments[0];
    if (PAGE_ACCESS[parentPath]) {
      return resolveAccess(PAGE_ACCESS[parentPath], role);
    }
  }
  // Default: deny (require admin)
  return resolveAccess('admin', role);
}

function resolveAccess(access: Access, role: AppRole | null): boolean {

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
