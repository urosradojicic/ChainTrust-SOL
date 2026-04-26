/**
 * Lightweight, dependency-free confetti burst.
 * ──────────────────────────────────────────────
 * Fires a one-shot canvas-based burst at the centre of the viewport.
 * Designed for "transaction confirmed" celebration moments. Caps duration
 * at 1.4s so it never blocks interaction.
 *
 * Respects `prefers-reduced-motion` — returns early when the user has
 * opted out of motion.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationDelta: number;
  color: string;
  size: number;
  life: number;
}

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#22d3ee'];

export function fireConfetti(opts?: { count?: number; durationMs?: number }): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const count = opts?.count ?? 110;
  const duration = opts?.durationMs ?? 1400;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const particles: Particle[] = [];
  const cx = canvas.width / 2;
  const cy = canvas.height / 3;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 4 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      rotation: Math.random() * Math.PI * 2,
      rotationDelta: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      life: 1,
    });
  }

  const start = performance.now();
  let raf = 0;

  function frame(now: number) {
    const elapsed = now - start;
    const remaining = duration - elapsed;
    if (remaining <= 0) {
      cancelAnimationFrame(raf);
      canvas.remove();
      return;
    }
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.vy += 0.18; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationDelta;
      p.life = remaining / duration;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}
