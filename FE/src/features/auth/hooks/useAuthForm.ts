import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authRepository } from '../../../data/repositories';
import { DemoAuthError } from '../../../data/contracts/AuthRepository';
import { useSession } from '../SessionProvider';
import { validateAuth } from '../auth.types';
import type { AuthErrors, AuthMode, AuthValues } from '../auth.types';

export function useAuthForm(mode: AuthMode) {
  const [values, setValues] = useState<AuthValues>({
    displayName: '',
    email: '',
    password: '',
    confirmation: '',
  });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [params, setParams] = useSearchParams();
  const { login } = useSession();
  useEffect(() => () => controller.current?.abort(), []);
  const change = (field: keyof AuthValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const invalid = validateAuth(mode, values);
    setErrors(invalid);
    setError('');
    const first = Object.keys(invalid)[0];
    if (first) {
      requestAnimationFrame(() => document.getElementById(`${mode}-${first}`)?.focus());
      return;
    }
    busy.current = true;
    setPending(true);
    const abort = new AbortController();
    controller.current = abort;
    const mock = import.meta.env.DEV ? params.get('mock') : null;
    const state = mock === 'error' ? 'error' : mock === 'loading' ? 'slow' : 'ready';
    try {
      const profile =
        mode === 'register'
          ? await authRepository.register(
              { displayName: values.displayName, email: values.email },
              state,
              abort.signal,
            )
          : await authRepository.login(values.email, state, abort.signal);
      if (abort.signal.aborted) return;
      if (!login(profile.id)) throw new DemoAuthError('Không thể mở phiên demo. Hãy thử lại.');
      setValues((current) => ({ ...current, password: '', confirmation: '' }));
    } catch (failure) {
      if (abort.signal.aborted) return;
      if (failure instanceof DemoAuthError && failure.field) {
        setErrors({ [failure.field]: failure.message });
        requestAnimationFrame(() => document.getElementById(`${mode}-${failure.field}`)?.focus());
      } else
        setError(
          failure instanceof DemoAuthError
            ? failure.message
            : 'Không thể thực hiện thao tác demo. Hãy thử lại.',
        );
      // A retry uses the same visible values without retaining the forced dev failure.
      if (mock === 'error') {
        const next = new URLSearchParams(params);
        next.delete('mock');
        setParams(next, { replace: true, preventScrollReset: true });
      }
    } finally {
      busy.current = false;
      if (!abort.signal.aborted) setPending(false);
    }
  }
  return { values, errors, error, pending, change, submit };
}
