/**
 * Typed Event Bus
 * ───────────────
 * Inter-engine communication without tight coupling.
 * Engines publish events; other engines subscribe.
 *
 * Usage:
 *   EventBus.on('analysis:complete', (data) => { ... });
 *   EventBus.emit('analysis:complete', { startupId: '...', result: ... });
 */

// ── Event Types ──────────────────────────────────────────────────────

export interface ChainTrustEventMap {
  // Analysis events
  'analysis:redflags:complete': { startupId: string; flagCount: number; riskLevel: string };
  'analysis:reputation:complete': { startupId: string; score: number; tier: string };
  'analysis:memo:generated': { startupId: string; recommendation: string };
  'analysis:claims:verified': { startupId: string; credibilityScore: number };

  // Simulation events
  'simulation:montecarlo:complete': { startupId: string; milestoneProbability: number };
  'simulation:batch:complete': { startupsProcessed: number; totalTime: number };

  // Portfolio events
  'portfolio:bookmark:added': { startupId: string };
  'portfolio:bookmark:removed': { startupId: string };
  'portfolio:alert:triggered': { startupId: string; alertType: string; message: string };

  // Navigation events
  'navigation:page:visited': { path: string; timestamp: number };
  'navigation:feature:discovered': { featureId: string };

  // Engagement events
  'engagement:streak:updated': { currentStreak: number; isNew: boolean };
  'engagement:achievement:earned': { badgeId: string; badgeName: string };
  'engagement:onboarding:step': { stepId: string; completed: boolean };

  // Data events
  'data:startup:updated': { startupId: string; fields: string[] };
  'data:metrics:published': { startupId: string; timestamp: number };

  // System events
  'system:engine:loaded': { engineId: string; loadTime: number };
  'system:error': { engineId: string; error: string };
  'system:config:changed': { key: string; value: any };
}

export type ChainTrustEvent = keyof ChainTrustEventMap;
type EventHandler<E extends ChainTrustEvent> = (data: ChainTrustEventMap[E]) => void;

// ── Event Bus Implementation ─────────────────────────────────────────

class TypedEventBus {
  private handlers = new Map<string, Set<Function>>();
  private eventLog: { event: string; timestamp: number; data: any }[] = [];
  private maxLogSize = 100;

  /**
   * Subscribe to an event.
   * Returns an unsubscribe function.
   */
  on<E extends ChainTrustEvent>(event: E, handler: EventHandler<E>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  /**
   * Subscribe to an event, auto-unsubscribe after first call.
   */
  once<E extends ChainTrustEvent>(event: E, handler: EventHandler<E>): () => void {
    const wrappedHandler: EventHandler<E> = (data) => {
      unsub();
      handler(data);
    };
    const unsub = this.on(event, wrappedHandler);
    return unsub;
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<E extends ChainTrustEvent>(event: E, data: ChainTrustEventMap[E]): void {
    // Log the event
    this.eventLog.push({ event, timestamp: Date.now(), data });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Notify handlers
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of set) {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Remove all handlers for an event.
   */
  off(event: ChainTrustEvent): void {
    this.handlers.delete(event);
  }

  /**
   * Get recent event log (for debugging).
   */
  getLog(limit: number = 20): { event: string; timestamp: number; data: any }[] {
    return this.eventLog.slice(-limit);
  }

  /**
   * Get subscriber count for an event.
   */
  listenerCount(event: ChainTrustEvent): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  /**
   * Clear all handlers (for testing).
   */
  clear(): void {
    this.handlers.clear();
    this.eventLog = [];
  }
}

/** Global event bus singleton */
export const EventBus = new TypedEventBus();
