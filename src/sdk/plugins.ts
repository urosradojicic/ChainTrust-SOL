/**
 * Plugin Architecture
 * ───────────────────
 * Third-party extension system for ChainTrust.
 * Enterprises can add custom engines, UI components, and data sources
 * without modifying core code.
 *
 * Plugin lifecycle: register → initialize → activate → deactivate
 */

import { EventBus, type ChainTrustEvent, type ChainTrustEventMap } from './event-bus';
import { getErrorMessage } from '@/lib/errors';

// ── Types ────────────────────────────────────────────────────────────

/** Generic engine signature — accepts any args, returns any value. */
export type PluginEngine = (...args: unknown[]) => unknown;

/** Per-event handler signature, weakly typed because plugins are external. */
export type PluginEventHandler = (data: unknown) => void;

export interface ChainTrustPlugin {
  /** Unique plugin ID */
  id: string;
  /** Plugin name */
  name: string;
  /** Version */
  version: string;
  /** Author */
  author: string;
  /** Description */
  description: string;
  /** Plugin category */
  category: 'analysis' | 'data_source' | 'visualization' | 'integration' | 'reporting';
  /** Initialize the plugin (called once on registration) */
  initialize?: () => void | Promise<void>;
  /** Activate (called when plugin is enabled) */
  activate?: () => void;
  /** Deactivate (called when plugin is disabled) */
  deactivate?: () => void;
  /** Custom engine functions this plugin provides */
  engines?: Record<string, PluginEngine>;
  /** Event handlers this plugin subscribes to */
  eventHandlers?: Partial<Record<ChainTrustEvent, PluginEventHandler>>;
}

export interface PluginState {
  plugin: ChainTrustPlugin;
  status: 'registered' | 'initialized' | 'active' | 'inactive' | 'error';
  activatedAt: number | null;
  error: string | null;
}

// ── Plugin Manager ───────────────────────────────────────────────────

class PluginManagerImpl {
  private plugins = new Map<string, PluginState>();
  private unsubscribers = new Map<string, (() => void)[]>();

  /**
   * Register a plugin.
   */
  async register(plugin: ChainTrustPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    this.plugins.set(plugin.id, {
      plugin,
      status: 'registered',
      activatedAt: null,
      error: null,
    });

    try {
      if (plugin.initialize) {
        await plugin.initialize();
      }
      this.plugins.get(plugin.id)!.status = 'initialized';

      EventBus.emit('system:engine:loaded', { engineId: `plugin:${plugin.id}`, loadTime: 0 });
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      this.plugins.get(plugin.id)!.status = 'error';
      this.plugins.get(plugin.id)!.error = msg;
      EventBus.emit('system:error', { engineId: `plugin:${plugin.id}`, error: msg });
    }
  }

  /**
   * Activate a plugin.
   */
  activate(pluginId: string): void {
    const state = this.plugins.get(pluginId);
    if (!state) throw new Error(`Plugin ${pluginId} not found`);
    if (state.status === 'active') return;

    try {
      // Subscribe to events. We cast each handler to the typed shape EventBus
      // expects; the runtime call flow is identical, plugins just enter the
      // bus through a slightly less strict typed surface than first-party code.
      if (state.plugin.eventHandlers) {
        const unsubs: (() => void)[] = [];
        for (const [event, handler] of Object.entries(state.plugin.eventHandlers)) {
          if (!handler) continue;
          const eventName = event as ChainTrustEvent;
          const typedHandler = handler as (data: ChainTrustEventMap[typeof eventName]) => void;
          unsubs.push(EventBus.on(eventName, typedHandler));
        }
        this.unsubscribers.set(pluginId, unsubs);
      }

      if (state.plugin.activate) {
        state.plugin.activate();
      }

      state.status = 'active';
      state.activatedAt = Date.now();
    } catch (error: unknown) {
      state.status = 'error';
      state.error = getErrorMessage(error);
    }
  }

  /**
   * Deactivate a plugin.
   */
  deactivate(pluginId: string): void {
    const state = this.plugins.get(pluginId);
    if (!state || state.status !== 'active') return;

    // Unsubscribe from events
    const unsubs = this.unsubscribers.get(pluginId);
    if (unsubs) {
      for (const unsub of unsubs) unsub();
      this.unsubscribers.delete(pluginId);
    }

    if (state.plugin.deactivate) {
      state.plugin.deactivate();
    }

    state.status = 'inactive';
  }

  /**
   * Unregister a plugin completely.
   */
  unregister(pluginId: string): void {
    this.deactivate(pluginId);
    this.plugins.delete(pluginId);
  }

  /**
   * Get all registered plugins.
   */
  list(): PluginState[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a plugin by ID.
   */
  get(pluginId: string): PluginState | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Call a plugin engine function.
   * The plugin engine signature is `(...args: unknown[]) => unknown`, so the
   * caller is responsible for understanding what shape the chosen plugin
   * expects and what it returns. This is the right boundary — first-party
   * code uses dedicated typed APIs; only this generic call site needs
   * the loose typing.
   */
  call(pluginId: string, engineName: string, ...args: unknown[]): unknown {
    const state = this.plugins.get(pluginId);
    if (!state || state.status !== 'active') {
      throw new Error(`Plugin ${pluginId} is not active`);
    }
    const fn = state.plugin.engines?.[engineName];
    if (!fn) throw new Error(`Engine ${engineName} not found in plugin ${pluginId}`);
    return fn(...args);
  }

  /**
   * Get plugin count by status.
   */
  stats(): { total: number; active: number; inactive: number; error: number } {
    const states = Array.from(this.plugins.values());
    return {
      total: states.length,
      active: states.filter(s => s.status === 'active').length,
      inactive: states.filter(s => s.status === 'inactive' || s.status === 'initialized').length,
      error: states.filter(s => s.status === 'error').length,
    };
  }
}

/** Global plugin manager singleton */
export const PluginManager = new PluginManagerImpl();
