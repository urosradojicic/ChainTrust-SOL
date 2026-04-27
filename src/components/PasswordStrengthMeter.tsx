/**
 * Inline password strength meter.
 * ────────────────────────────────
 * Heuristic strength scoring (no zxcvbn — keeps bundle small). Returns a
 * 0..4 strength score and a human label, plus a list of unmet criteria.
 *
 * Mirrors the validation rules enforced in `pages/Login.tsx::handleSignUp`
 * so the visible meter and the actual rejection criteria stay in sync.
 *
 * Renders nothing when `password` is empty so the meter doesn't appear
 * before the user has started typing.
 */
import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  password: string;
  /** When true, force the meter to render even on empty input (rare). */
  alwaysVisible?: boolean;
}

interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Excellent';
  criteria: { met: boolean; description: string }[];
}

export function scorePassword(password: string): Strength {
  const criteria = [
    { met: password.length >= 8, description: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), description: 'An uppercase letter' },
    { met: /[a-z]/.test(password), description: 'A lowercase letter' },
    { met: /\d/.test(password), description: 'A number' },
    { met: /[^A-Za-z0-9]/.test(password) || password.length >= 12, description: 'A symbol or 12+ characters' },
  ];
  const metCount = criteria.filter((c) => c.met).length;
  // Map 0..5 met-criteria into 0..4 score so we have 5 visual buckets.
  const score = Math.min(4, metCount) as Strength['score'];
  const labels: Strength['label'][] = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const label: Strength['label'] = password.length === 0 ? 'Empty' : labels[score];
  return { score, label, criteria };
}

const BAR_TONE = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'] as const;
const TEXT_TONE = ['text-red-500', 'text-red-500', 'text-amber-500', 'text-blue-500', 'text-emerald-500'] as const;

export default function PasswordStrengthMeter({ password, alwaysVisible }: Props) {
  const strength = useMemo(() => scorePassword(password), [password]);

  if (!alwaysVisible && password.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1.5" aria-live="polite">
      {/* Bar segments */}
      <div className="flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength.score} aria-label="Password strength">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength.score ? BAR_TONE[strength.score] : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className={`font-medium ${TEXT_TONE[strength.score]}`}>{strength.label}</span>
        {strength.score < 3 && (
          <span className="text-muted-foreground">Add more variety to strengthen.</span>
        )}
      </div>

      {/* Criteria checklist (collapsed once everything met) */}
      {strength.score < 4 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 mt-1 text-[11px]">
          {strength.criteria.map((c) => (
            <li
              key={c.description}
              className={`flex items-center gap-1.5 ${c.met ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}
            >
              {c.met
                ? <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                : <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
              {c.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
