import type { ReactNode } from 'react';
import { cn } from '@/utils';
import imosLogo from '@/assets/imos_logo_with_title.png';

export type PanelProduct = {
  name: string;
  legend?: ReactNode;
};

type ExportPanelProps = {
  date: string;
  product?: PanelProduct;
  compact?: boolean;
  /** Data URL of the map canvas region behind this panel, used for the frosted-glass effect. */
  frostedBgSrc?: string;
};

export function ExportPanel({ date, product, compact = false, frostedBgSrc }: ExportPanelProps) {
  const legendW = compact ? 140 : 200;

  return (
    <div
      className={cn(
        'relative inline-block overflow-hidden border border-white/50',
        compact ? 'rounded-lg' : 'rounded-[10px]',
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
      <div
        className={cn('relative z-10 flex items-start', compact ? 'gap-2.5 p-2.5' : 'gap-4 p-5')}
      >
        <img
          src={imosLogo}
          alt="IMOS"
          className={cn('w-auto shrink-0 self-center', compact ? 'h-[45px]' : 'h-[60px]')}
        />

        <div className={cn('flex flex-col justify-center', compact ? 'gap-0.5' : 'gap-[3px]')}>
          <p
            className={cn(
              'font-bold leading-none text-[#1a2a3a]',
              compact ? 'text-[13px]' : 'text-[18px]',
            )}
          >
            IMOS Live
          </p>
          <p className={cn('leading-none text-[#3b5068]', compact ? 'text-[10px]' : 'text-[13px]')}>
            {date}
          </p>
          <p className={cn('leading-none text-[#6b8a9e]', compact ? 'text-[10px]' : 'text-[12px]')}>
            {window.location.origin}
          </p>
        </div>

        {product && (
          <div className={cn('flex flex-col', compact ? 'gap-1 pl-2.5' : 'gap-1.5 pl-4')}>
            <p
              className={cn(
                'font-bold leading-none text-[#1a2a3a]',
                compact ? 'text-[11px]' : 'text-[14px]',
              )}
            >
              {product.name}
            </p>
            {product.legend && (
              <div
                data-export-legend
                style={{ width: legendW, overflow: 'hidden', maxHeight: compact ? 32 : 40 }}
              >
                {product.legend}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
