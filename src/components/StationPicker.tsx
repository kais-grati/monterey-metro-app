import { STATIONS_ALPHABETICAL } from '../data/stations';

interface StationPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (stationId: string) => void;
}

/**
 * A native `<select>`, deliberately.
 *
 * Thirty-eight stations want type-ahead, and on a phone they want the platform
 * picker — both of which a real select gives for free and a hand-built listbox
 * only gives if you rebuild them carefully and correctly. It is also the whole
 * keyboard and screen-reader story for choosing a station, which is why the map
 * markers do not try to duplicate it.
 */
export function StationPicker({ id, label, value, onChange }: StationPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-mist">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-graphite bg-tunnel py-2.5 pl-3 pr-10 text-base font-semibold text-chalk transition-colors hover:border-mist focus:border-chalk focus:outline-none"
        >
          <option value="">Sin elegir</option>
          {STATIONS_ALPHABETICAL.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-3 top-1/2 h-2 w-3 -translate-y-1/2"
          aria-hidden="true"
        >
          <path
            d="M1 1.5 L6 6.5 L11 1.5"
            fill="none"
            stroke="var(--color-mist)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
