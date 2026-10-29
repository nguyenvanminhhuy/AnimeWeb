import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { commentRepository } from '@/lib/api/repositories';
import type { Comment, CommentState } from '@/types/comment';

export function useComments(animeId: string) {
  const { user, displayName, permissions } = useSession();
  const [params, setParams] = useSearchParams();
  const mock = import.meta.env.DEV ? params.get('comments') : null;
  const state: CommentState =
    mock === 'error' || mock === 'empty' || mock === 'loading' ? mock : 'ready';
  const canCreate = Boolean(user && permissions.includes('comment:create') && mock !== 'forbidden');
  const [revision, setRevision] = useState(0);
  const key = `${animeId}:${user}:${state}:${revision}`;
  const [response, setResponse] = useState<{ key: string; items: Comment[]; error: string } | null>(
    null,
  );
  const current = response?.key === key ? response : null;
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const writing = useRef<AbortController | null>(null);
  const busy = useRef(false);
  useEffect(() => () => writing.current?.abort(), []);
  useEffect(() => {
    if (!canCreate) {
      writing.current?.abort();
      busy.current = false;
      setPending(false);
    }
  }, [canCreate]);
  useEffect(() => {
    if (state === 'loading') return;
    const controller = new AbortController();
    commentRepository
      .list(animeId, state, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setResponse({ key, items, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResponse({
            key,
            items: [],
            error: error instanceof Error ? error.message : 'Không tải được bình luận.',
          });
      });
    return () => controller.abort();
  }, [animeId, key, state]);

  const rawPage = params.get('commentPage');
  const value = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const requested = Number.isSafeInteger(value) && value > 0 ? value : 1;
  const total = current?.items.length ?? 0;
  const totalPages = Math.ceil(total / 5);
  const page = Math.min(requested, Math.max(totalPages, 1));
  useEffect(() => {
    if (current && !current.error && rawPage !== null && rawPage !== String(page)) {
      const next = new URLSearchParams(params);
      next.set('commentPage', String(page));
      setParams(next, { replace: true, preventScrollReset: true });
    }
  }, [current, rawPage, page, params, setParams]);

  async function mutate(action: 'create' | 'update' | 'remove', id: string, body = '') {
    if (busy.current || !user) return false;
    setNotice('');
    if (!canCreate) {
      setActionError('Bạn chưa có quyền viết bình luận.');
      return false;
    }
    if (action !== 'remove' && (!body.trim() || body.trim().length > 2000)) {
      setActionError('Bình luận cần từ 1 đến 2000 ký tự.');
      return false;
    }
    const controller = new AbortController();
    writing.current = controller;
    busy.current = true;
    setPending(true);
    setActionError('');
    setNotice('');
    const actor = { id: user, displayName, permissions };
    try {
      if (action === 'create')
        await commentRepository.create(actor, animeId, body, controller.signal);
      else if (action === 'update')
        await commentRepository.update(actor, id, body, controller.signal);
      else await commentRepository.remove(actor, id, controller.signal);
      if (controller.signal.aborted) return false;
      const next = new URLSearchParams(params);
      next.delete('comments');
      next.delete('commentPage');
      setParams(next, { replace: true, preventScrollReset: true });
      setRevision((value) => value + 1);
      setNotice(
        action === 'create'
          ? 'Đã gửi bình luận demo.'
          : action === 'update'
            ? 'Đã lưu thay đổi.'
            : 'Đã xóa bình luận của bạn.',
      );
      return true;
    } catch (error) {
      if (!controller.signal.aborted)
        setActionError(error instanceof Error ? error.message : 'Không thể lưu bình luận.');
      return false;
    } finally {
      busy.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  return {
    user,
    permissions,
    canCreate,
    pending,
    actionError,
    notice,
    mutate,
    page,
    totalPages,
    total,
    items: current?.items.slice((page - 1) * 5, page * 5) ?? [],
    loading: !current,
    error: current?.error ?? '',
    retry: () => {
      const next = new URLSearchParams(params);
      next.delete('comments');
      setParams(next, { replace: true, preventScrollReset: true });
      setRevision((value) => value + 1);
    },
  };
}
