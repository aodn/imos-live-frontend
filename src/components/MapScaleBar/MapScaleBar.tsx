import { cn } from '@/utils';

export type MapScaleBarProps = {
  scaleKm: number;
  barWidthCss: number;
  compact?: boolean;
};

const STYLE = {
  normal: { barH: 7, arrowHalfW: 12, arrowUpperH: 22, arrowLowerH: 10 },
  compact: { barH: 5, arrowHalfW: 9, arrowUpperH: 16, arrowLowerH: 7 },
} as const;

export function MapScaleBar({ scaleKm, barWidthCss, compact = false }: MapScaleBarProps) {
  const s = compact ? STYLE.compact : STYLE.normal;
  const segments = compact ? 1 : 2;
  const arrowH = s.arrowUpperH + s.arrowLowerH;
  const notchY = arrowH - s.arrowHalfW * 1.1;
  const arrowW = s.arrowHalfW * 2;

  return (
    <div className={cn('flex items-end', compact ? 'gap-3.5' : 'gap-5')}>
      <div className="flex flex-col gap-[3px]">
        <div
          className={cn(
            'flex justify-between font-sans leading-none text-[#1a2a3a]',
            compact ? 'text-[11px]' : 'text-[13px]',
          )}
          style={{ width: barWidthCss }}
        >
          <span>0</span>
          {segments > 1 && <span>{scaleKm / 2}</span>}
          <span>{scaleKm} km</span>
        </div>
        <svg width={barWidthCss} height={s.barH} className="block">
          <line x1={0} y1={s.barH} x2={barWidthCss} y2={s.barH} stroke="#1a2a3a" strokeWidth={2} />
          <line x1={0} y1={0} x2={0} y2={s.barH} stroke="#1a2a3a" strokeWidth={2} />
          {segments > 1 && (
            <line
              x1={barWidthCss / 2}
              y1={0}
              x2={barWidthCss / 2}
              y2={s.barH}
              stroke="#1a2a3a"
              strokeWidth={2}
            />
          )}
          <line
            x1={barWidthCss}
            y1={0}
            x2={barWidthCss}
            y2={s.barH}
            stroke="#1a2a3a"
            strokeWidth={2}
          />
        </svg>
      </div>

      <svg width={arrowW} height={arrowH} viewBox={`0 0 ${arrowW} ${arrowH}`} className="block">
        <path
          d={`M${s.arrowHalfW},0 L${arrowW},${arrowH} L${s.arrowHalfW},${notchY} L0,${arrowH} Z`}
          fill="none"
          stroke="#333333"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}
