import type { ComponentPropsWithRef } from 'react';
import type { ControlSize } from '@/types/control';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  variant?: 'default' | 'unstyled';
  size?: ControlSize;
  htmlSize?: number;
};

export function Input({
  variant = 'default',
  className = '',
  type = 'text',
  size,
  htmlSize,
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      type={type}
      size={htmlSize}
      className={[
        variant === 'unstyled' ? 'aw-input-unstyled' : 'aw-input',
        variant !== 'unstyled' || size ? `aw-control-${size ?? 'md'}` : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
