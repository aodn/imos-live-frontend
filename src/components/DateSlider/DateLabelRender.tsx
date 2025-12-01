import { DateLabelRenderProps } from 'date-slider-lib';

export const dateLabelRender = ({ label }: DateLabelRenderProps) => {
  return (
    <div className="bg-blue-700 text-white text-xs px-3 py-1.5 rounded shadow-md font-semibold whitespace-nowrap text-center">
      {label}
    </div>
  );
};
