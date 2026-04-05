interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
  options?: string[];
}

const DEFAULT_OPTIONS = ['1M', '3M', '6M', 'All'];

export default function TimeRangeSelector({ value, onChange, options = DEFAULT_OPTIONS }: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-xs font-medium transition ${
            value === opt
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function sliceByRange<T>(data: T[], range: string): T[] {
  if (range === 'All') return data;
  const months = range === '1M' ? 1 : range === '3M' ? 3 : range === '6M' ? 6 : range === '1Y' ? 12 : data.length;
  return data.slice(-months);
}
