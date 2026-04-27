import { describe, it, expect } from 'vitest';
import { canAccess, getDeniedRedirect, PAGE_ACCESS } from '@/lib/role-access';

describe('canAccess', () => {
  describe('public routes', () => {
    it('lets unauthenticated users through public routes', () => {
      expect(canAccess(null, '/')).toBe(true);
      expect(canAccess(null, '/login')).toBe(true);
      expect(canAccess(null, '/hackathon')).toBe(true);
      expect(canAccess(null, '/verify')).toBe(true);
    });

    it('lets authenticated users through public routes', () => {
      expect(canAccess('investor', '/')).toBe(true);
      expect(canAccess('startup', '/login')).toBe(true);
      expect(canAccess('admin', '/demo')).toBe(true);
    });
  });

  describe('auth routes', () => {
    it('blocks unauthenticated users', () => {
      expect(canAccess(null, '/dashboard')).toBe(false);
      expect(canAccess(null, '/leaderboard')).toBe(false);
    });

    it('lets any logged-in role through', () => {
      expect(canAccess('investor', '/dashboard')).toBe(true);
      expect(canAccess('startup', '/dashboard')).toBe(true);
      expect(canAccess('admin', '/dashboard')).toBe(true);
    });
  });

  describe('investor-only routes', () => {
    it('blocks startup role', () => {
      expect(canAccess('startup', '/portfolio')).toBe(false);
      expect(canAccess('startup', '/screener')).toBe(false);
      expect(canAccess('startup', '/compare')).toBe(false);
    });

    it('lets investors and admins through', () => {
      expect(canAccess('investor', '/portfolio')).toBe(true);
      expect(canAccess('admin', '/portfolio')).toBe(true);
    });
  });

  describe('startup-only routes', () => {
    it('blocks investor role', () => {
      expect(canAccess('investor', '/my-startup')).toBe(false);
      expect(canAccess('investor', '/register')).toBe(false);
    });

    it('lets startup and admin through', () => {
      expect(canAccess('startup', '/my-startup')).toBe(true);
      expect(canAccess('admin', '/my-startup')).toBe(true);
    });
  });

  describe('dynamic route normalization', () => {
    it('normalizes /startup/<id> to /startup', () => {
      expect(canAccess('investor', '/startup/abc123')).toBe(true);
      expect(canAccess('startup', '/startup/some-uuid')).toBe(true);
    });

    it('normalizes /entity/<id> to /entity', () => {
      expect(canAccess('investor', '/entity/x')).toBe(true);
    });

    it('blocks unauthenticated users on dynamic auth routes', () => {
      expect(canAccess(null, '/startup/x')).toBe(false);
      expect(canAccess(null, '/entity/x')).toBe(false);
    });
  });

  describe('default-deny', () => {
    it('treats unknown routes as admin-only (deny most users)', () => {
      expect(canAccess(null, '/secret-admin-page')).toBe(false);
      expect(canAccess('investor', '/secret-admin-page')).toBe(false);
      expect(canAccess('startup', '/secret-admin-page')).toBe(false);
    });

    it('still lets admin through unknown routes', () => {
      expect(canAccess('admin', '/secret-admin-page')).toBe(true);
    });
  });

  describe('PAGE_ACCESS sanity', () => {
    it('contains every route shape we expect to exist', () => {
      const required = ['/', '/login', '/dashboard', '/startup', '/entity', '/deals', '/my-startup', '/register'];
      for (const r of required) {
        expect(PAGE_ACCESS[r]).toBeDefined();
      }
    });
  });
});

describe('getDeniedRedirect', () => {
  it('redirects unauthenticated users to /login', () => {
    expect(getDeniedRedirect(null)).toBe('/login');
  });

  it('redirects authenticated-but-unauthorized users to /dashboard', () => {
    expect(getDeniedRedirect('investor')).toBe('/dashboard');
    expect(getDeniedRedirect('startup')).toBe('/dashboard');
    expect(getDeniedRedirect('admin')).toBe('/dashboard');
  });
});
