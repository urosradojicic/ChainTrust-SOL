import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SimulatedTerminalProps {
  lines: string[];
  speed?: number;
}

export default function SimulatedTerminal({ lines, speed = 60 }: SimulatedTerminalProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    setVisibleLines([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        const line = lines[i];
        setVisibleLines((prev) => [...prev, line]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [lines, speed]);

  return (
    <div className="rounded-xl bg-[#0d1117] border border-[#30363d] p-4 font-mono text-xs overflow-x-auto">
      {visibleLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`py-0.5 ${
            !line
              ? 'text-gray-400'
              : line.startsWith('✓')
                ? 'text-emerald-400'
                : line.startsWith('⏳') || line.startsWith('→')
                  ? 'text-yellow-400'
                  : line.startsWith('⚡')
                    ? 'text-purple-400'
                    : line.startsWith('🛡') || line.startsWith('🏆')
                      ? 'text-blue-400'
                      : line.startsWith('❯')
                        ? 'text-cyan-400'
                        : 'text-gray-400'
          }`}
        >
          {line}
        </motion.div>
      ))}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-2 h-4 bg-cyan-400 ml-0.5"
      />
    </div>
  );
}
