import type { ReactNode } from 'react';
import { cn } from '@/utils';
import imosLogo from '@/assets/imos_logo_with_title.png';

export type PanelProduct = {
  name: string;
  legend?: ReactNode;
};

type MapExportPanelProps = {
  date: string;
  product?: PanelProduct;
  compact?: boolean;
  /** Data URL of the map canvas region behind this panel, used for the frosted-glass effect. */
  frostedBgSrc?: string;
};

export function MapExportPanel({ date, product, frostedBgSrc }: MapExportPanelProps) {
  const legendW = 200;

  return (
    <div
      className={cn(
        'relative inline-block overflow-hidden border border-white/50',
        'rounded-[10px]',
      )}
    >
      {/* Slightly oversized so blur edges are clipped by overflow:hidden */}
      {frostedBgSrc && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 scale-[1.1]"
          style={{
            backgroundImage: `url(${frostedBgSrc})`,
            backgroundSize: '100% 100%',
            filter: 'blur(16px)',
          }}
        />
      )}
      <div aria-hidden className="absolute inset-0 z-0 bg-white/70" />
      <div className={cn('relative z-10 flex items-start', 'gap-2.5 p-2.5')}>
        <img src={imosLogo} alt="IMOS" className={cn('w-auto shrink-0 self-center', 'h-[45px]')} />

        <div className={cn('flex flex-col justify-center', 'gap-0.5')}>
          <p className={cn('font-bold leading-none text-[#1a2a3a]', 'text-[13px]')}>IMOS Live</p>
          <p className={cn('leading-none text-[#3b5068]', 'text-[10px]')}>{date}</p>
          <p className={cn('leading-none text-[#6b8a9e]', 'text-[10px]')}>
            {window.location.origin}
          </p>
        </div>

        {product && (
          <div className={cn('flex flex-col', 'gap-1 pl-2.5')}>
            <p className={cn('font-bold leading-none text-[#1a2a3a]', 'text-[11px]')}>
              {product.name}
            </p>
            {product.legend && (
              <div data-export-legend style={{ width: legendW, overflow: 'hidden', maxHeight: 32 }}>
                {product.legend}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
