import { ChangeEvent, forwardRef, ReactNode } from 'react';
import { cn } from '@/utils';
import style from './style.module.css';

export type InputProps = {
  label: string;
  onChange: (value: string) => void;
  wrapperClassName?: string;
  innerClassName?: string;
  wrapperAs?: string;
  helpText?: string;
  requiredText?: string;
  errorText?: string;
  slotPrefix?: ReactNode;
  slotSuffix?: ReactNode;
  characterLimit?: number;
  invalid?: boolean;
} & Omit<
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'onChange'
>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      slotPrefix,
      slotSuffix,
      invalid,
      onChange,
      innerClassName,
      wrapperClassName,
      value,
      ...attributes
    },
    ref,
  ) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1 h-[46px] bg-background-primary rounded-[10px] ring-inset focus-visible:outline focus-visible:outline-offset cursor-pointer',
          !invalid
            ? 'ring-1 ring-interactive-action-field hover:ring-[#F58121] active:ring-[#F58121]  active:ring-2 focus:ring-[#F58121]  focus:ring-2'
            : 'ring-2 !ring-negative-700',
          wrapperClassName,
          style.parent,
        )}
        data-testid="input"
      >
        {slotPrefix}
        <div className="relative h-full flex-1 flex flex-col">
          <input
            value={value || ''}
            onChange={handleChange}
            className={cn([
              'order-last peer h-full min-w-[80px] w-full  text-field-active outline-none appearance-none  disabled:cursor-not-allowed disabled:bg-transparent read-only:bg-transparent',
              innerClassName,
              style.input,
            ])}
            type="text"
            ref={ref}
            data-testid="input-field"
            {...attributes}
          />
          <p
            className={cn(
              'pointer-events-none order-first absolute top-1/2 -translate-y-1/2  text-base peer-focus:!relative  peer-focus:text-xs peer-focus:top-0 peer-focus:ion   peer-focus:translate-y-0 transition-all duration-150',
              { '!text-xs !relative !top-0 !translate-y-0': value },
            )}
          >
            {label}
          </p>
        </div>
        {slotSuffix}
      </div>
    );
  },
);
