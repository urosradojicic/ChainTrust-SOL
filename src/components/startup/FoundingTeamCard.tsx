/**
 * Founding Team Card
 * ──────────────────
 * Pitchbook-style team block showing founder names, roles, and optional
 * LinkedIn deep-links. Gracefully hides when there's nothing to show.
 */
import { motion } from 'framer-motion';
import { ExternalLink, Users } from 'lucide-react';
import type { DbStartup } from '@/types/database';

interface Props {
  startup: DbStartup;
}

export default function FoundingTeamCard({ startup }: Props) {
  const team = startup.founding_team ?? [];
  const hasTeam = Array.isArray(team) && team.length > 0;

  if (!hasTeam && !startup.employee_count && !startup.headquarters && !startup.stage) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Company Profile
        </h3>
        {startup.stage && (
          <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5 font-bold border border-primary/20">
            {startup.stage.replace('-', ' ')}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
        {startup.headquarters && (
          <div>
            <dt className="text-muted-foreground">Headquarters</dt>
            <dd className="font-medium text-foreground mt-0.5">{startup.headquarters}</dd>
          </div>
        )}
        {startup.employee_count != null && (
          <div>
            <dt className="text-muted-foreground">Team size</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {startup.employee_count.toLocaleString()}
            </dd>
          </div>
        )}
        {startup.ticker && (
          <div>
            <dt className="text-muted-foreground">Ticker</dt>
            <dd className="font-mono font-medium text-foreground mt-0.5">${startup.ticker.toUpperCase()}</dd>
          </div>
        )}
        {startup.total_raised_usd != null && startup.total_raised_usd > 0 && (
          <div>
            <dt className="text-muted-foreground">Total raised</dt>
            <dd className="font-medium text-foreground mt-0.5">
              ${(startup.total_raised_usd / 1_000_000).toFixed(1)}M
            </dd>
          </div>
        )}
      </dl>

      {Array.isArray(startup.sector_tags) && startup.sector_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {startup.sector_tags.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-foreground border border-border font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {hasTeam && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Founding Team
          </h4>
          <ul className="space-y-2">
            {team.map((member, i) => (
              <li
                key={`${member.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{member.role}</p>
                </div>
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`LinkedIn profile for ${member.name}`}
                    className="text-primary hover:text-primary/80 transition shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(startup.linkedin_url || startup.twitter_handle) && (
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-3 text-xs">
          {startup.linkedin_url && (
            <a
              href={startup.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-primary/80 font-medium"
            >
              LinkedIn ↗
            </a>
          )}
          {startup.twitter_handle && (
            <a
              href={`https://twitter.com/${startup.twitter_handle.replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-primary/80 font-medium"
            >
              @{startup.twitter_handle.replace(/^@/, '')} ↗
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
