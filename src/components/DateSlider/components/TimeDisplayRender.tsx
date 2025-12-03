import { Button } from '@/components/Button';
import { ArrowIcon } from '@/components/Icons';
import { TimeDisplayRenderProps } from '../type';

export const timeDisplayRender = ({
  dateLabel,
  toNextDate,
  toPrevDate,
}: TimeDisplayRenderProps) => {
  return (
    <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1.5 shadow-sm border border-gray-300 w-40 shrink-0">
      <div className="h-full flex items-center justify-center md:w-28">
        <p className="text-imos-grey font-semibold text-xs md:text-base">{dateLabel}</p>
      </div>
      <div className="h-full  items-center hidden md:flex">
        <Button variant="ghost" onClick={toPrevDate} className="p-0!" aria-label="Previous date">
          <ArrowIcon className="rotate-90" color="imos-grey" size="xxl" />
        </Button>
        <Button variant="ghost" onClick={toNextDate} className="p-0!" aria-label="Next date">
          <ArrowIcon className="rotate-270" color="imos-grey" size="xxl" />
        </Button>
      </div>
    </div>
  );
};
