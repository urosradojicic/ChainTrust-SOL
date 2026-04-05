interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label: string;
}

export default function Toggle({ on, onToggle, label }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 transition hover:bg-secondary"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-primary' : 'bg-muted'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`}
        />
      </div>
    </button>
  );
}
