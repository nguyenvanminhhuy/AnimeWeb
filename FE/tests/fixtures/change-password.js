import { authRepository } from '/src/lib/api/repositories.ts';
import { validateChangePassword } from '/src/features/auth/utils/validate-change-password.ts';

window.verifyPasswordPreview = async () => {
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const rejects = async (action, message) => {
    let rejected = false;
    try {
      await action();
    } catch {
      rejected = true;
    }
    check(rejected, message);
  };
  const signal = () => new AbortController().signal;
  const storage = () => JSON.stringify({ ...localStorage });
  const before = storage();
  check(
    (await authRepository.previewPasswordChange('viewer', 'ready', signal())).status ===
      'preview-only',
    'False mutation result',
  );
  await rejects(
    () => authRepository.previewPasswordChange('admin-preview', 'ready', signal()),
    'Admin preview treated as member',
  );
  await rejects(
    () => authRepository.previewPasswordChange('local-unknown', 'ready', signal()),
    'Missing profile',
  );
  const controller = new AbortController();
  const pending = authRepository.previewPasswordChange('viewer', 'slow', controller.signal);
  controller.abort();
  await rejects(() => pending, 'Abort ignored');
  await rejects(
    () => authRepository.previewPasswordChange('viewer', 'error', signal()),
    'Forced error ignored',
  );
  const valid = {
    currentPassword: 'old-demo-123',
    newPassword: 'new-demo-456',
    confirmation: 'new-demo-456',
  };
  check(Object.keys(validateChangePassword(valid)).length === 0, 'Valid values rejected');
  check(
    Boolean(
      validateChangePassword({
        ...valid,
        newPassword: valid.currentPassword,
        confirmation: valid.currentPassword,
      }).newPassword,
    ),
    'Same password accepted',
  );
  check(
    Boolean(
      validateChangePassword({ ...valid, newPassword: ' '.repeat(8), confirmation: ' '.repeat(8) })
        .newPassword,
    ),
    'Whitespace accepted',
  );
  check(
    Boolean(validateChangePassword({ ...valid, newPassword: 'x'.repeat(129) }).newPassword),
    'Upper bound ignored',
  );
  check(
    Boolean(validateChangePassword({ ...valid, confirmation: 'different' }).confirmation),
    'Mismatch accepted',
  );
  check(
    Object.keys(
      validateChangePassword({
        ...valid,
        newPassword: ' new-demo-456 ',
        confirmation: ' new-demo-456 ',
      }),
    ).length === 0,
    'Passwords normalized unexpectedly',
  );
  check(storage() === before, 'Preview changed persisted data');
  return 'preview-only result, member profile checks, abort/error, validation bounds/same/mismatch/whitespace, exact password comparison and no storage mutation';
};
