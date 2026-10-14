import { LINES } from '../data/lines';

/**
 * Three arches, one per line.
 *
 * The mark is not the operator's logo — it is a drawing of what this app is
 * about, which is three lines meeting. Colouring them from the same tokens the
 * map uses means the header and the canvas can never disagree.
 */
export function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 48 24" className="h-6 w-12 shrink-0" aria-hidden="true">
        {LINES.map((line, index) => (
          <path
            key={line.id}
            d={`M ${index * 16 + 2} 20 A 7 7 0 0 1 ${index * 16 + 16} 20`}
            fill="none"
            stroke={line.colorVar}
            strokeWidth={4}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <span className="text-xl font-extrabold tracking-tight">Metrorrey</span>
    </div>
  );
}
