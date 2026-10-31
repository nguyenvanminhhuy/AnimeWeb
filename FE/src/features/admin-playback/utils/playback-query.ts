import { paths } from '@/config/paths';

export function readPlaybackQuery(params: URLSearchParams) {
  const integer = (key: string, fallback: number) => {
    const value = Number(params.get(key));
    return Number.isSafeInteger(value) && value > 0 ? value : fallback;
  };
  return {
    animeId: params.get('animeId') ?? '',
    seasonId: params.get('seasonId') ?? '',
    episodeId: params.get('episodeId') ?? '',
    sourceId: params.get('sourceId') ?? '',
    q: (params.get('q') ?? '').trim().slice(0, 200),
    enabled: ['yes', 'no'].includes(params.get('enabled') ?? '') ? params.get('enabled')! : '',
    sort: params.get('sort') === 'label' ? 'label' : 'created',
    page: integer('page', 1),
    pageSize: [5, 10, 20].includes(integer('pageSize', 5)) ? integer('pageSize', 5) : 5,
  };
}
export function playbackHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return `${paths.adminPlayback}?${next}`;
}
