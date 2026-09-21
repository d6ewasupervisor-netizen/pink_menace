/**
 * Speedometer — compact SVG arc. Shared by the highway HUD and the Kent dash.
 */
export function Speedometer({
  mph,
  limit = 80,
  size = 'full',
}: {
  mph: number;
  limit?: number;
  size?: 'full' | 'compact';
}) {
  const MIN_ANGLE = -135;
  const MAX_ANGLE = 135;
  const MAX_MPH = Math.max(limit + 10, 40);
  const shown = Math.max(0, mph);
  const angle = MIN_ANGLE + (Math.min(shown, MAX_MPH) / MAX_MPH) * (MAX_ANGLE - MIN_ANGLE);
  const over = shown > limit + 2;
  const needleColor = over ? '#ff4444' : shown < limit * 0.7 ? '#39ff14' : '#ffd93d';

  const compact = size === 'compact';
  const R = compact ? 28 : 38;
  const cx = 50;
  const cy = compact ? 42 : 55;
  const w = compact ? 88 : 100;
  const h = compact ? 58 : 70;

  function polarToXY(deg: number) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  }

  const start = polarToXY(MIN_ANGLE);
  const end = polarToXY(MAX_ANGLE);
  const arcPath = `M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`;
  const needle = polarToXY(angle);

  return (
    <svg width={w} height={h} viewBox={`0 0 100 ${compact ? 58 : 70}`}>
      <path d={arcPath} fill="none" stroke="#333" strokeWidth="6" strokeLinecap="round" />
      <line
        x1={cx} y1={cy}
        x2={needle.x} y2={needle.y}
        stroke={needleColor} strokeWidth="2" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3" fill={needleColor} />
      <text
        x={cx} y={cy + 14}
        textAnchor="middle"
        fill="white"
        fontSize={compact ? 12 : 13}
        fontFamily="monospace"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(shown)}
      </text>
      <text x={cx} y={cy + 23} textAnchor="middle" fill="#777" fontSize="7">
        MPH
      </text>
    </svg>
  );
}
