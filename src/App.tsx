import { useCallback, useState } from 'react';
import { MetroMap } from './components/MetroMap';
import { PlannerPanel } from './components/PlannerPanel';
import { useRoute } from './hooks/useRoute';

export default function App() {
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  const route = useRoute(originId, destinationId);
  const notice =
    originId && destinationId && originId === destinationId
      ? 'El origen y el destino son la misma estación.'
      : originId && destinationId && !route
        ? 'No hay ruta entre estas dos estaciones.'
        : null;

  /**
   * One click, one decision, in the order a journey happens: the first tap sets
   * where you start, the second where you are going, and once both are set the
   * next tap begins a new journey rather than silently overwriting one end.
   */
  const handleStationSelect = useCallback(
    (stationId: string) => {
      setHoveredStationId(null);

      if (!originId) {
        setOriginId(stationId);
        return;
      }

      if (!destinationId) {
        // Tapping the origin again clears it, so a misclick is one tap to undo.
        if (stationId === originId) setOriginId('');
        else setDestinationId(stationId);
        return;
      }

      setOriginId(stationId);
      setDestinationId('');
    },
    [originId, destinationId],
  );

  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      {/*
        `min-w-0` and `lg:shrink` both matter here. The map's SVG carries an
        intrinsic aspect ratio, so the pane's intrinsic width — and therefore the
        floor a flex item normally refuses to shrink below — is set by the map,
        which would push the eastern end of Línea 1 off the right edge. Both the
        `min-width: auto` floor and the column layout's `shrink-0` have to be
        lifted once the row direction kicks in.
      */}
      <main className="h-[52dvh] shrink-0 border-b border-graphite p-3 lg:order-last lg:h-full lg:min-h-0 lg:min-w-0 lg:shrink lg:grow lg:border-b-0 lg:p-8">
        <MetroMap
          originId={originId || null}
          destinationId={destinationId || null}
          route={route}
          onStationSelect={handleStationSelect}
          hoveredStationId={hoveredStationId}
          onHoverStation={setHoveredStationId}
        />
      </main>

      <aside className="min-h-0 grow lg:h-full lg:w-[380px] lg:shrink-0 lg:border-r lg:border-graphite">
        <PlannerPanel
          originId={originId}
          destinationId={destinationId}
          route={route}
          onOriginChange={setOriginId}
          onDestinationChange={setDestinationId}
          notice={notice}
        />
      </aside>
    </div>
  );
}
