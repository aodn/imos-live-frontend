import { cn } from '@/utils';
import { Loader2Icon } from '../Icons';

type MapLoadingOverlayProps = {
  message?: string;
  className?: string;
};

export function MapLoadingOverlay({
  message = 'Loading data...',
  className,
}: MapLoadingOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div
        className={cn(
          'bg-white/75 backdrop-blur-md shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center gap-3',
          className,
        )}
      >
        <Loader2Icon className="animate-spin text-imos-blue w-14 h-14" />
        {message && (
          <span className="text-sm font-semibold tracking-wide text-imos-grey">{message}</span>
        )}
      </div>
    </div>
  );
}
