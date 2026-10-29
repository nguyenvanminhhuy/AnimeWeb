import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { ControlSize } from '@/types/control';

export interface SelectboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectboxProps = Omit<ComponentPropsWithRef<'select'>, 'children' | 'size'> & {
  size?: ControlSize;
  htmlSize?: number;
} & (
    | { options: readonly SelectboxOption[]; children?: never }
    | { options?: never; children: ReactNode }
  );

export function Selectbox({
  options,
  children,
  size = 'md',
  htmlSize,
  className = '',
  ...props
}: SelectboxProps) {
  return (
    <select
      {...props}
      size={htmlSize}
      className={['form-select aw-selectbox', `aw-control-${size}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {options
        ? options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))
        : children}
    </select>
  );
}
