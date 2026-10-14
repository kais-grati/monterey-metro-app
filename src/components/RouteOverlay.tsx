import type { RouteResult } from '../types';
import { routePolyline } from './mapGeometry';

/**
 * The answer, drawn.
 *
 * The route is the one thing on the canvas allowed to be pure white, and it is
 * painted over a network that has just receded — so the eye has nowhere to go
 * but along the path. `pathLength={1}` lets a single dash cycle cover the whole
 * polyline regardless of how many stations it runs through, which is what makes
 * the draw-on animation work without measuring anything.
 */
export function RouteOverlay({ route }: { route: RouteResult }) {
  const points = routePolyline(route.steps);
  // Remounting on a new origin/destination pair is what replays the animation.
  const animationKey = `${route.steps[0]?.stationId}-${route.steps.at(-1)?.stationId}`;

  return (
    <g key={animationKey}>
      {/* A soft bloom under the line, so it reads as lit rather than merely pale. */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.14}
      />
      <polyline
        className="route-draw"
        points={points}
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth="var(--route-width)"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
      />
    </g>
  );
}
