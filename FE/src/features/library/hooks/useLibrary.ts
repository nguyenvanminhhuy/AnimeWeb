import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../auth/SessionProvider';
import { animeRepository } from '../../../data/repositories';
import type { Anime } from '../../anime/anime.types';
import { normalizeSearch } from '../../anime/catalogQuery';
import { isCompleted, libraryPageSize } from '../library.types';
import type { LibraryItem, LibraryTab } from '../library.types';
import { libraryHref, parseLibraryQuery } from '../libraryQuery';

export function useLibrary() {
  const { user, favorites, progress, permissions, toggleFavorite } = useSession();
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const query = parseLibraryQuery(params);
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const canRead =
    permissions.includes('library:read:own') &&
    permissions.includes('progress:read:own') &&
    mock !== 'forbidden';
  const canWrite = permissions.includes('library:write:own');
  const [attempt, setAttempt] = useState(0);
  const idsKey = JSON.stringify(
    [...new Set([...favorites, ...progress.map((item) => item.animeId)])].sort(),
  );
  const ids = useMemo(() => JSON.parse(idsKey) as string[], [idsKey]);
  const requestKey = `${user}:${canRead}:${idsKey}:${mock}:${attempt}`;
  const [response, setResponse] = useState<{ key: string; data: Anime[]; error: string } | null>(
    null,
  );
  const current = response?.key === requestKey ? response : null;

  useEffect(() => {
    if (!user || !canRead) {
      setResponse(null);
      return;
    }
    if (mock === 'loading') return;
    let active = true;
    animeRepository
      .getByIds(ids, mock === 'empty' || mock === 'error' ? mock : 'ready')
      .then((data) => {
        if (active) setResponse({ key: requestKey, data, error: '' });
      })
      .catch(() => {
        if (active)
          setResponse({
            key: requestKey,
            data: [],
            error: 'Không thể tải thư viện. Vui lòng thử lại.',
          });
      });
    return () => {
      active = false;
    };
  }, [user, canRead, mock, ids, requestKey]);

  const catalog = new Map((current?.data ?? []).map((item) => [item.id, item]));
  const historyItems: LibraryItem[] = progress
    .flatMap((entry) => {
      const anime = catalog.get(entry.animeId);
      return anime ? [{ key: entry.episodeId, anime, progress: entry }] : [];
    })
    .sort((a, b) => {
      const left = a.progress?.updatedAt ? Date.parse(a.progress.updatedAt) : 0;
      const right = b.progress?.updatedAt ? Date.parse(b.progress.updatedAt) : 0;
      return right - left;
    });
  // Keep the most recent recorded episode per anime for the ongoing collection.
  const latest = new Map<string, LibraryItem>();
  for (const item of historyItems) if (!latest.has(item.anime.id)) latest.set(item.anime.id, item);
  const collections: Record<LibraryTab, LibraryItem[]> = {
    favorites: [...favorites].reverse().flatMap((id) => {
      const anime = catalog.get(id);
      return anime ? [{ key: id, anime, progress: latest.get(id)?.progress }] : [];
    }),
    watching: [...latest.values()].filter((item) => item.progress && !isCompleted(item.progress)),
    history: historyItems,
  };
  const counts = {
    favorites: collections.favorites.length,
    watching: collections.watching.length,
    history: collections.history.length,
  };
  const filtered = collections[query.tab].filter((item) =>
    normalizeSearch(`${item.anime.title} ${item.anime.subtitle}`).includes(
      normalizeSearch(query.q),
    ),
  );
  if (query.sort === 'title')
    filtered.sort(
      (a, b) => a.anime.title.localeCompare(b.anime.title, 'vi') || a.key.localeCompare(b.key),
    );
  const total = filtered.length;
  const totalPages = Math.ceil(total / libraryPageSize);
  const page = Math.min(query.page, Math.max(1, totalPages));
  const resolvedQuery = { ...query, page };
  const canonical =
    current && !current.error && user && canRead ? libraryHref(resolvedQuery, mock) : null;
  useEffect(() => {
    if (canonical && canonical !== pathname + search)
      navigate(canonical, { replace: true, preventScrollReset: true });
  }, [canonical, pathname, search, navigate]);

  return {
    user,
    canRead,
    canWrite,
    query: resolvedQuery,
    counts,
    total,
    totalPages,
    mock,
    items: filtered.slice((page - 1) * libraryPageSize, page * libraryPageSize),
    loading: Boolean(user && canRead && !current),
    error: current?.error ?? '',
    favorites,
    toggleFavorite,
    retry: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
