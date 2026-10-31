import {
  adminCommentRepository as repo,
  commentRepository as publicRepo,
} from '/src/lib/api/repositories.ts';
import { commentFixtures } from '/src/testing/mocks/fixtures/comments.ts';

window.verifyAdminCommentsRepository = async () => {
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
  const session = {
    id: 'comment-test',
    displayName: 'Moderator test',
    permissions: ['admin:comment:read', 'admin:comment:moderate'],
  };
  const readOnly = { ...session, permissions: ['admin:comment:read'] };
  const signal = () => new AbortController().signal;
  const catalog = () => repo.getCatalog(signal(), session);
  const fixtureBefore = JSON.stringify(commentFixtures);
  const before = await catalog();
  check(before.comments.length === 24, 'Seed count');
  for (const [status, count] of [
    ['visible', 12],
    ['hidden', 6],
    ['deleted', 6],
  ])
    check(
      before.comments.filter((row) => row.status === status).length === count,
      'Status count ' + status,
    );
  check(
    before.comments.filter((row) => row.status === 'deleted').every((row) => row.body === null),
    'Deleted content leaked',
  );
  check(
    !('create' in repo) && !('update' in repo) && !('remove' in repo),
    'Moderation exposed content CRUD',
  );
  await rejects(
    () => repo.getCatalog(signal(), { ...session, permissions: [], role: 'admin' }),
    'Forged role bypass',
  );
  await rejects(
    () => repo.moderate('comment-fixture-01', 'hide', 'Reason', signal(), readOnly),
    'Read-only write',
  );
  await rejects(
    () =>
      repo.moderate('comment-fixture-01', 'hide', 'Reason', signal(), {
        ...session,
        permissions: ['comment:update:own'],
      }),
    'Own permission bypass',
  );
  await rejects(
    () => repo.moderate('comment-fixture-01', 'hide', 'x', signal(), session),
    'Missing reason validation',
  );
  await rejects(
    () => repo.moderate('missing', 'hide', 'Reason', signal(), session),
    'Missing ID allowed',
  );
  for (const action of ['hide', 'restore'])
    await rejects(
      () => repo.moderate('comment-fixture-deleted', action, 'Reason', signal(), session),
      'Deleted restored',
    );
  const controller = new AbortController();
  const pending = repo.moderate('comment-fixture-01', 'hide', 'Reason', controller.signal, session);
  controller.abort();
  await rejects(() => pending, 'Abort ignored');
  check(
    (await catalog()).comments.find((row) => row.id === 'comment-fixture-01').status === 'visible',
    'Aborted write committed',
  );
  const results = await Promise.allSettled([
    repo.moderate('comment-fixture-01', 'hide', '  Review <b>reason</b>  ', signal(), session),
    repo.moderate('comment-fixture-01', 'hide', 'Other reason', signal(), session),
  ]);
  check(
    results.filter((result) => result.status === 'fulfilled').length === 1,
    'Stale concurrent action accepted',
  );
  let row = (await catalog()).comments.find((row) => row.id === 'comment-fixture-01');
  const original = before.comments.find((item) => item.id === row.id);
  check(
    row.status === 'hidden' &&
      row.body === original.body &&
      row.userId === original.userId &&
      row.createdAt === original.createdAt,
    'Content/ownership changed',
  );
  check(
    row.lastModeration.moderatorName === session.displayName &&
      row.lastModeration.reason === 'Review <b>reason</b>',
    'Last moderation metadata',
  );
  await repo.moderate(row.id, 'restore', 'Reviewed', signal(), session);
  row = (await catalog()).comments.find((item) => item.id === row.id);
  check(row.status === 'visible' && row.lastModeration.action === 'restore', 'Restore failed');
  const cloned = await catalog();
  cloned.comments[0].status = 'deleted';
  cloned.comments[0].body = 'Changed';
  check(
    (await catalog()).comments[0].body === before.comments[0].body,
    'Response references leaked',
  );
  check(
    (await repo.getCatalog(signal(), { ...session, id: 'other' })).comments.every(
      (item) => item.lastModeration === null,
    ),
    'Session leakage',
  );
  const revoked = { ...session, permissions: [...session.permissions] };
  const mutation = repo.moderate(row.id, 'hide', 'Reason', signal(), revoked);
  revoked.permissions = [];
  await rejects(() => mutation, 'Permission not rechecked');
  check(JSON.stringify(commentFixtures) === fixtureBefore, 'Public fixture mutated');
  check(
    (await publicRepo.list('anime-01', 'ready', signal())).length === 2,
    'Public comment adapter changed',
  );
  return 'read/moderate guards, role/own-permission rejection, reason and state validation, deleted redaction and non-restoration, concurrent stale action, abort/revocation, unchanged authors/content, audit metadata, cloned responses, session and public isolation';
};
