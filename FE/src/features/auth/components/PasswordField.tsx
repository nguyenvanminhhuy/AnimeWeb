import { useState } from 'react';

interface Props {
  id: string;
  name: string;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
}
export function PasswordField({
  id,
  name,
  label,
  value,
  error,
  disabled,
  autoComplete,
  onChange,
}: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="aw-auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="aw-auth-password">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          maxLength={128}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder="Ít nhất 8 ký tự, chỉ dùng dữ liệu giả"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          disabled={disabled}
          aria-controls={id}
          aria-pressed={visible}
          aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
        >
          {visible ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
      {error && (
        <p className="aw-auth-field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
