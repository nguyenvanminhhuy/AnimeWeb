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
    Object.keys(repository).sort().join(',') === 'getById,list,setRole,setStatus',
    'Unexpected user mutation API',
  );
  const result = await repository.list(query, 'ready', signal, session);
  check(
    result.meta.total === 24 && result.summary.active === 18 && result.summary.blocked === 6,
    'Fixture aggregation mismatch',
  );
  const allowed = [
    'id',
    'displayName',
    'email',
    'status',
    'roles',
    'createdAt',
    'version',
    'avatarUrl',
  ]
    .sort()
    .join(',');
  check(
    result.data.every((item) => Object.keys(item).sort().join(',') === allowed),
    'Unexpected user fields',
  );
  result.data[0].displayName = 'Changed outside adapter';
  result.data[0].roles.push('admin');
  const profile = await repository.getById('admin-user-024', 'ready', signal, session);
  check(
    profile.displayName === 'Anh Khoa' && profile.roles.join(',') === 'user',
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
  await rejects(() => repository.setStatus('admin-user-001', 'blocked', 1, signal, session));
  const writer = {
    ...session,
    id: 'status-writer',
    permissions: ['admin:user:read', 'admin:user:status:write'],
  };
  const blocked = await repository.setStatus('admin-user-001', 'blocked', 1, signal, writer);
  check(blocked.status === 'blocked' && blocked.version === 2, 'Status update/version mismatch');
  await rejects(() => repository.setStatus('admin-user-001', 'active', 1, signal, writer));
  const unblocked = await repository.setStatus('admin-user-001', 'active', 2, signal, writer);
  check(unblocked.status === 'active' && unblocked.version === 3, 'Unblock mismatch');
  check(
    (await repository.getById('admin-user-001', 'ready', signal, session)).version === 1,
    'Mock workspaces leaked',
  );
  check(JSON.stringify(adminUsers) === snapshot, 'Status mutation changed base fixture');
  await rejects(() => repository.setRole('admin-user-001', 'admin', 3, signal, writer));
  const roleWriter = {
    ...writer,
    id: 'role-writer',
    permissions: [...writer.permissions, 'admin:user:role:write'],
  };
  const promoted = await repository.setRole('admin-user-001', 'manage', 1, signal, roleWriter);
  check(promoted.roles.join(',') === 'manage' && promoted.version === 2, 'Role promotion mismatch');
  await rejects(() => repository.setRole('admin-user-001', 'admin', 1, signal, roleWriter));
  const noOp = await repository.setRole('admin-user-001', 'manage', 2, signal, roleWriter);
  check(noOp.version === 2, 'No-op bumped version');
  const demoted = await repository.setRole('admin-user-001', 'user', 2, signal, roleWriter);
  check(demoted.roles.join(',') === 'user' && demoted.version === 3, 'Role demotion mismatch');
  await rejects(() => repository.setRole('admin-user-001', 'manager', 3, signal, roleWriter));
  check(JSON.stringify(adminUsers) === snapshot, 'Role mutation changed base fixture');
  const onlyAdmin = await repository.setRole('admin-user-001', 'admin', 3, signal, roleWriter);
  check(onlyAdmin.version === 4, 'Admin promotion mismatch');
  await rejects(() => repository.setRole('admin-user-001', 'user', 4, signal, roleWriter));
  await rejects(() => repository.setStatus('admin-user-001', 'blocked', 4, signal, roleWriter));
  await rejects(() =>
    repository.setRole('admin-user-001', 'user', 1, signal, {
      ...roleWriter,
      id: 'admin-user-001',
    }),
  );
  return 'read/write permissions, forged role ignored, versioned block/unblock and role changes, workspace isolation, clone/not-found/abort';
};
