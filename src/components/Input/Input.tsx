import type { ChangeEvent, ReactNode } from 'react';
import { forwardRef } from 'react';
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

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
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
) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <label
      className={cn(
        'flex items-center gap-2 px-3 py-1 h-[46px] bg-white rounded-[10px] ring-inset focus-visible:outline focus-visible:outline-offset-2 cursor-pointer',
        !invalid
          ? 'ring-1 ring-gray-300 hover:ring-orange-500 active:ring-orange-500 active:ring-2 focus:ring-orange-500 focus:ring-2'
          : 'ring-2 ring-red-700',
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
            'order-last peer h-full min-w-20 w-full text-gray-900 outline-none appearance-none disabled:cursor-not-allowed disabled:bg-transparent read-only:bg-transparent',
            innerClassName,
            style.input,
          ])}
          type="text"
          ref={ref}
          data-testid="input-field"
          {...attributes}
        />
        <span
          className={cn(
            'pointer-events-none order-first absolute top-1/2 -translate-y-1/2 text-base peer-focus:relative! peer-focus:text-xs peer-focus:top-0 peer-focus:translate-y-0 transition-all duration-150',
            { 'text-xs! relative! top-0! translate-y-0!': value },
          )}
        >
          {label}
        </span>
      </div>
      {slotSuffix}
    </label>
  );
});
