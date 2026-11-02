import { isMockApi } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api/backend/error';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { authRepository } from '@/lib/api/repositories';
import { DemoAuthError } from '@/lib/api/contracts/auth-repository';
import { validateChangePassword } from '@/features/auth/utils/validate-change-password';
import type {
  ChangePasswordErrors,
  ChangePasswordValues,
} from '@/features/auth/types/change-password';

const emptyValues: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmation: '',
};
export function useChangePassword() {
  const { user, invalidateSession } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [values, setValues] = useState({ ...emptyValues });
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function change(key: keyof ChangePasswordValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || !user) return;
    const invalid = validateChangePassword(values);
    setErrors(invalid);
    setError('');
    const first = Object.keys(invalid)[0];
    if (first) {
      requestAnimationFrame(() => document.getElementById(`change-password-${first}`)?.focus());
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    const mock = isMockApi ? params.get('mock') : null;
    try {
      // The adapter receives only the BE password payload; mock mode never stores it.
      await authRepository.changePassword(
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        mock === 'error' ? 'error' : mock === 'loading' ? 'slow' : 'ready',
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setValues({ ...emptyValues });
        if (authRepository.mode === 'backend') {
          invalidateSession('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
          navigate(paths.loginTo(paths.profile), { replace: true });
        } else setPreviewed(true);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(
          cause instanceof DemoAuthError || cause instanceof ApiError
            ? cause.message
            : 'Không thể kiểm tra biểu mẫu lúc này. Hãy thử lại.',
        );
        if (cause instanceof ApiError) setErrors(cause.fields);
        if (mock === 'error') {
          const next = new URLSearchParams(params);
          next.delete('mock');
          setParams(next, { replace: true, preventScrollReset: true });
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }
  return {
    values,
    errors,
    error,
    pending,
    previewed,
    change,
    submit,
    reset: () => {
      setValues({ ...emptyValues });
      setErrors({});
      setError('');
      setPreviewed(false);
    },
  };
}
