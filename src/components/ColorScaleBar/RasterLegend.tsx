import { OverlaySource } from '@/constants';
import { rasterLegendUrl } from '@/helpers';
import { useQuery } from '@tanstack/react-query';

type RasterLegendProps = {
  date: string;
  overlaySource: OverlaySource;
  scales: number[];
  label: string;
};

export const RasterLegend = ({ date, overlaySource, scales, label }: RasterLegendProps) => {
  const { data: legendUrl } = useQuery({
    queryKey: ['legend', overlaySource, date],
    queryFn: () => rasterLegendUrl(overlaySource, new Date(date)),
  });
  return (
    <div>
      <div className="w-full">
        <div
          className="w-full"
          style={{
            height: '12px',
            backgroundImage: `url(${legendUrl || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="w-full flex justify-between text-xs text-black mt-1">
          {scales.map(s => (
            <span key={s + overlaySource + 'legend'}>{s}</span>
          ))}
        </div>
      </div>

      <div className="mt-2 text-black text-sm text-center">
        <span>{label}</span>
      </div>
    </div>
  );
};
