import { useId } from 'react';
import { Input } from './Input';
import type { InputProps } from './Input';

export type ComboboxProps = Omit<InputProps, 'list' | 'type' | 'children'> & {
  suggestions: readonly string[];
  type?: 'text' | 'search';
};

export function Combobox({ suggestions, className = '', ...props }: ComboboxProps) {
  const listId = useId();
  return (
    <>
      <Input
        {...props}
        list={listId}
        className={['aw-combobox', className].filter(Boolean).join(' ')}
      />
      <datalist id={listId}>
        {[...new Set(suggestions)]
          .filter((value) => value.trim())
          .map((value) => (
            <option key={value} value={value} />
          ))}
      </datalist>
    </>
  );
}
