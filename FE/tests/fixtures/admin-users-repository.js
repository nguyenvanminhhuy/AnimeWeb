import { mockAdminUserRepository as repository } from '/src/lib/api/mock/mock-admin-user-repository.ts';
import { adminUsers } from '/src/testing/mocks/fixtures/admin-users.ts';

window.verifyAdminUsersRepository = async () => {
  function check(value, message) {
    if (!value) throw new Error(message);
  }
  async function rejects(task) {
    try {
      await task();
    } catch {
      return;
    }
    throw new Error('Forbidden/cancelled request succeeded');
  }
  const session = {
    id: 'user-repository-test',
    displayName: 'Reader',
    permissions: ['admin:user:read'],
  };
  const denied = { id: 'forged-admin', displayName: 'Admin', permissions: [], role: 'admin' };
  const query = { q: '', status: '', sort: 'newest', page: 1, pageSize: 10 };
  const signal = new AbortController().signal;
  const snapshot = JSON.stringify(adminUsers);
  await rejects(() => repository.list(query, 'ready', signal, denied));
  await rejects(() => repository.getById('admin-user-001', 'ready', signal, denied));
  check(
    Object.keys(repository).sort().join(',') === 'getById,list',
    'Unexpected user mutation API',
  );
  const result = await repository.list(query, 'ready', signal, session);
  check(
    result.meta.total === 24 && result.summary.active === 18 && result.summary.blocked === 6,
    'Fixture aggregation mismatch',
  );
  const allowed = ['id', 'displayName', 'email', 'status', 'roles', 'createdAt'].sort().join(',');
  check(
    result.data.every((item) => Object.keys(item).sort().join(',') === allowed),
    'Unexpected user fields',
  );
  result.data[0].displayName = 'Changed outside adapter';
  result.data[0].roles.push('admin');
  const profile = await repository.getById('admin-user-024', 'ready', signal, session);
  check(
    profile.displayName === 'Anh Khoa' && profile.roles.join(',') === 'member',
    'Read response mutated fixture',
  );
  check(
    (await repository.getById('missing-user', 'ready', signal, session)) === null,
    'Missing ID returned data',
  );
  const controller = new AbortController();
  const pending = repository.getById('admin-user-001', 'ready', controller.signal, session);
  controller.abort();
  await rejects(() => pending);
  check(JSON.stringify(adminUsers) === snapshot, 'User fixture changed');
  return 'read permission enforced for list/profile, forged role ignored, read-only API, minimum fields, cloned responses, not found and abort';
};
