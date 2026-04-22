/**
 * Deal Rooms — AngelList-style fundraise pipeline
 * ─────────────────────────────────────────────────
 * Institutional list view of active fundraises. Each card shows:
 *   - startup name + verified tier
 *   - target / raised / % progress
 *   - min ticket + accepted tokens + days remaining
 *   - one-click "Pledge" CTA that opens the startup detail (pledge flow)
 *
 * Empty / loading states are demo-safe — the hook falls back to mock rooms
 * when Supabase isn't reachable.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  Handshake,
  Coins,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useDealRooms, type DealRoom } from '@/hooks/use-deal-rooms';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency } from '@/lib/format';

const STATUS_STYLE: Record<DealRoom['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  funded: 'bg-primary/10 text-primary border-primary/20',
  closed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

function daysUntil(deadline: string): number {
  const diffMs = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}

export default function DealRooms() {
  const { data: rooms = [], isLoading } = useDealRooms();
  const { data: startups = [] } = useStartups();

  const startupById = useMemo(() => {
    const m = new Map(startups.map((s) => [s.id, s]));
    return m;
  }, [startups]);

  const activeRooms = useMemo(() => rooms.filter((r) => r.status === 'active'), [rooms]);
  const fundedRooms = useMemo(() => rooms.filter((r) => r.status === 'funded'), [rooms]);

  const totalTarget = rooms.reduce((s, r) => s + r.target_amount, 0);
  const totalRaised = rooms.reduce((s, r) => s + r.raised_amount, 0);
  const pct = totalTarget > 0 ? Math.min(100, (totalRaised / totalTarget) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Handshake className="h-7 w-7 text-primary" /> Deal Rooms
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AngelList-style fundraise pipeline. Verified startups open rooms, investors pledge on-chain.
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ecosystem pipeline</p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(totalRaised)} <span className="text-muted-foreground text-xs font-normal">/ {formatCurrency(totalTarget)}</span>
          </p>
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden w-36">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SmallKpi icon={Target} label="Active rounds" value={activeRooms.length} />
        <SmallKpi icon={TrendingUp} label="Funded" value={fundedRooms.length} />
        <SmallKpi icon={Coins} label="Total raised" value={formatCurrency(totalRaised)} />
        <SmallKpi icon={Clock} label="Avg days left" value={avgDaysLeft(activeRooms)} />
      </div>

      {/* Active rooms */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground">Active rounds</h2>
          <span className="text-xs text-muted-foreground">{activeRooms.length} rooms</span>
        </div>
        {isLoading ? (
          <SkeletonGrid />
        ) : activeRooms.length === 0 ? (
          <EmptyCard text="No active deal rooms yet." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeRooms.map((room) => (
              <DealCard
                key={room.id}
                room={room}
                startupName={startupById.get(room.startup_id)?.name ?? 'Startup'}
                startupVerified={startupById.get(room.startup_id)?.verified ?? false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Funded rounds */}
      {fundedRooms.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Recently funded</h2>
            <span className="text-xs text-muted-foreground">{fundedRooms.length} rooms</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {fundedRooms.slice(0, 4).map((room) => (
              <DealCard
                key={room.id}
                room={room}
                startupName={startupById.get(room.startup_id)?.name ?? 'Startup'}
                startupVerified={startupById.get(room.startup_id)?.verified ?? false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────

interface DealCardProps {
  room: DealRoom;
  startupName: string;
  startupVerified: boolean;
}
function DealCard({ room, startupName, startupVerified }: DealCardProps) {
  const pct = room.target_amount > 0 ? Math.min(100, (room.raised_amount / room.target_amount) * 100) : 0;
  const left = daysUntil(room.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-5 hover:border-primary/40 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {startupName}
            {startupVerified && (
              <span className="ml-2 text-[10px] uppercase tracking-wider rounded bg-primary/10 text-primary px-1.5 py-0.5 border border-primary/20">
                Verified
              </span>
            )}
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground truncate">{room.title}</h3>
          {room.summary && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{room.summary}</p>
          )}
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 font-bold border ${STATUS_STYLE[room.status]}`}
        >
          {room.status}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between text-xs text-muted-foreground">
          <span>
            <span className="text-foreground font-bold">{formatCurrency(room.raised_amount)}</span> raised
          </span>
          <span>{formatCurrency(room.target_amount)} target</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${pct >= 100 ? 'bg-primary' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{pct.toFixed(0)}% funded</p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
        <div>
          <dt className="text-muted-foreground">Min ticket</dt>
          <dd className="font-medium text-foreground">{formatCurrency(room.min_ticket)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Accepts</dt>
          <dd className="font-medium text-foreground truncate">{room.accepted_tokens.join(', ')}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Deadline</dt>
          <dd className="font-medium text-foreground">
            {left === 0 ? 'Today' : `${left} day${left === 1 ? '' : 's'}`}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Link
          to={`/startup/${room.startup_id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 hover:bg-primary/90 transition"
        >
          Review & pledge <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          to={`/entity/${room.startup_id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Entity dossier
        </Link>
      </div>
    </motion.div>
  );
}

interface SmallKpiProps {
  icon: typeof Target;
  label: string;
  value: string | number;
}
function SmallKpi({ icon: Icon, label, value }: SmallKpiProps) {
  return (
    <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-56 rounded-xl border bg-muted/30 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function avgDaysLeft(rooms: DealRoom[]): number {
  if (rooms.length === 0) return 0;
  return Math.round(
    rooms.reduce((s, r) => s + daysUntil(r.deadline), 0) / rooms.length,
  );
}
