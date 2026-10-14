/**
 * The Cerro de la Silla, drawn as a flat silhouette in the empty south-west of
 * the canvas.
 *
 * It earns its place twice over: it names the city the network belongs to
 * without a word of copy, and it fills the one corner of the drawing that would
 * otherwise be dead space. It stays this quiet on purpose — an outline of the
 * mountain that gives Monterrey its shape, not an illustration.
 */
export function Ridge() {
  return (
    <path
      d="M 55 906 L 120 866 L 165 838 L 192 850 L 232 780 L 250 766 L 272 798 L 305 828 L 360 864 L 430 906 Z"
      fill="var(--color-graphite)"
      opacity={0.55}
      aria-hidden="true"
    />
  );
}
