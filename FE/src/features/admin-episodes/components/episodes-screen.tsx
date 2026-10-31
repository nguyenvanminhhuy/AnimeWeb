import { useEffect, useRef, useState } from 'react';
import { Form, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { ContentState } from '@/components/common/content-state';
import { Pagination } from '@/components/common/pagination';
import { paths } from '@/config/paths';
import { normalizeSearch } from '@/utils/search';
import { useEpisodeCatalog } from '@/features/admin-episodes/hooks/use-episode-catalog';
import { MetadataForm } from '@/features/admin-episodes/components/metadata-form';
import { DeleteMetadataDialog } from '@/features/admin-episodes/components/delete-metadata-dialog';
import type { Season } from '@/types/episode';

export function EpisodesScreen() {
  const [params, setParams] = useSearchParams();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const { data, loading, error, canRead, canWrite, session, refresh } = useEpisodeCatalog(
    mock === 'error',
  );
  const animeId = params.get('animeId') ?? '';
  const seasonId = params.get('seasonId') ?? '';
  const q = params.get('q') ?? '';
  const status = ['draft', 'published'].includes(params.get('status') ?? '')
    ? params.get('status')!
    : '';
  const sort = params.get('sort') === 'title' ? 'title' : 'order';
  const pageSize = [10, 20, 50].includes(Number(params.get('pageSize')))
    ? Number(params.get('pageSize'))
    : 10;
  const requestedPage = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const [search, setSearch] = useState(q);
  const [composing, setComposing] = useState(false);
  const [editor, setEditor] = useState<{ row: Season | null; revision: number } | null>(null);
  const [target, setTarget] = useState<{
    kind: 'season' | 'episode';
    id: string;
    title: string;
  } | null>(null);
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const focusResults = useRef(false);
  useEffect(() => {
    if (data && !loading && focusResults.current) {
      focusResults.current = false;
      heading.current?.focus();
    }
  }, [data, loading]);
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(() => {
    if (composing || search === q) return;
    const timer = setTimeout(() => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('page');
        if (search.trim()) next.set('q', search.trim().slice(0, 200));
        else next.delete('q');
        return next;
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, q, composing, setParams]);
  const seasons = (data?.seasons ?? [])
    .filter((s) => s.animeId === animeId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const ids = new Set(
    (data?.seasons ?? []).filter((s) => !animeId || s.animeId === animeId).map((s) => s.id),
  );
  const seasonById = new Map((data?.seasons ?? []).map((s) => [s.id, s]));
  const rows = (mock === 'empty' ? [] : (data?.episodes ?? []))
    .filter(
      (e) =>
        ids.has(e.seasonId) &&
        (!seasonId || e.seasonId === seasonId) &&
        (!status || e.status === status) &&
        (!q || normalizeSearch(`${e.title} ${e.number}`).includes(normalizeSearch(q))),
    )
    .sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title, 'vi') || a.id.localeCompare(b.id)
        : seasonById.get(a.seasonId)!.animeId.localeCompare(seasonById.get(b.seasonId)!.animeId) ||
          seasonById.get(a.seasonId)!.sortOrder - seasonById.get(b.seasonId)!.sortOrder ||
          a.sortOrder - b.sortOrder ||
          a.id.localeCompare(b.id),
    );
  const totalPages = Math.ceil(rows.length / pageSize);
  const page = Math.min(requestedPage, Math.max(1, totalPages));
  useEffect(() => {
    if (!data) return;
    const next = new URLSearchParams(params);
    if (requestedPage !== page || (params.has('page') && params.get('page') !== String(page)))
      next.set('page', String(page));
    if (params.has('pageSize') && params.get('pageSize') !== String(pageSize))
      next.set('pageSize', String(pageSize));
    if (params.has('status') && params.get('status') !== status) next.delete('status');
    if (params.has('sort') && params.get('sort') !== sort) next.set('sort', sort);
    if (params.toString() !== next.toString()) setParams(next, { replace: true });
  }, [data, params, setParams, requestedPage, page, pageSize, status, sort]);
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'animeId') {
      next.delete('seasonId');
      setEditor(null);
    }
    setParams(next);
  };
  const returnTo = `${paths.adminEpisodes}${params.size ? `?${params}` : ''}`;
  if (!canRead)
    return (
      <ContentState
        title="Bạn chưa có quyền xem mùa và tập"
        description="Trang này yêu cầu quyền đọc tập phim quản trị."
      />
    );
  return (
    <>
      <header className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:flex-wrap tw:mb-6">
        <div>
          <p className="aw-eyebrow">NỘI DUNG PHIM</p>
          <h1 className="tw:text-3xl tw:max-phone:text-2xl">Mùa/phần và tập phim</h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">
            Sắp xếp câu chuyện theo từng mùa và từng tập.
          </p>
        </div>
        <Button label="Làm mới" variant="quiet" loading={loading} onClick={refresh} />
      </header>
      <p className="tw:p-4 tw:rounded-xl tw:bg-[#a697ff0d] tw:border tw:border-[var(--aw-border)] tw:text-[var(--aw-muted)]">
        Dữ liệu mẫu ·{' '}
        {canWrite
          ? 'Thay đổi chỉ lưu trong phiên này; tải lại hoặc đổi phiên sẽ đặt lại. Không thay đổi trang xem phim công khai.'
          : 'Phiên chỉ đọc. Dùng phiên có quyền chỉnh sửa để thêm, sửa hoặc xoá.'}
      </p>
      {notice && (
        <p role="status" className="tw:text-[#9fe3c2]">
          {notice}
        </p>
      )}
      {error ? (
        <ContentState
          title="Chưa tải được mùa và tập"
          description={error}
          retry={() => {
            const next = new URLSearchParams(params);
            next.delete('mock');
            setParams(next, { replace: true });
            refresh();
          }}
        />
      ) : loading || !data ? (
        <p role="status">Đang tải mùa và tập phim…</p>
      ) : (
        <div data-admin-episodes="ready" className="tw:grid tw:gap-6 tw:min-w-0">
          <Form
            method="get"
            onSubmit={(e) => {
              e.preventDefault();
              change('q', search.trim());
            }}
            className="aw-surface tw:p-5 tw:rounded-xl tw:grid tw:grid-cols-3 tw:gap-4 tw:max-phone:grid-cols-1"
          >
            <div>
              <label htmlFor="episodes-anime">Phim</label>
              <Selectbox
                id="episodes-anime"
                value={animeId}
                onChange={(e) => change('animeId', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả phim' },
                  ...data.anime.map((a) => ({ value: a.id, label: a.title })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="episodes-season">Mùa/phần</label>
              <Selectbox
                id="episodes-season"
                disabled={!animeId}
                value={seasonId}
                onChange={(e) => change('seasonId', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả mùa/phần' },
                  ...seasons.map((s) => ({ value: s.id, label: s.title })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="episodes-search">Tìm tập phim</label>
              <Input
                id="episodes-search"
                type="search"
                value={search}
                maxLength={200}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên hoặc số tập"
              />
            </div>
            <div>
              <label htmlFor="episodes-status">Trạng thái</label>
              <Selectbox
                id="episodes-status"
                value={status}
                onChange={(e) => change('status', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'draft', label: 'Bản nháp' },
                  { value: 'published', label: 'Đã công bố' },
                ]}
              />
            </div>
            <div>
              <label htmlFor="episodes-sort">Sắp xếp</label>
              <Selectbox
                id="episodes-sort"
                value={sort}
                onChange={(e) => change('sort', e.target.value)}
                options={[
                  { value: 'order', label: 'Thứ tự trong mùa' },
                  { value: 'title', label: 'Tên tập A–Z' },
                ]}
              />
            </div>
          </Form>
          <section
            aria-labelledby="seasons-heading"
            className="aw-surface tw:rounded-xl tw:p-5 tw:min-w-0"
          >
            <div className="tw:flex tw:gap-3 tw:justify-between tw:items-center tw:flex-wrap tw:mb-4">
              <h2 id="seasons-heading" className="tw:text-xl tw:mb-0">
                Mùa/phần {animeId ? `(${seasons.length})` : ''}
              </h2>
              {canWrite && animeId && (
                <Button
                  label="Thêm mùa/phần"
                  size="sm"
                  onClick={() => setEditor({ row: null, revision: Date.now() })}
                />
              )}
            </div>
            {!animeId ? (
              <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                Chọn một phim để xem và quản lý mùa/phần.
              </p>
            ) : !seasons.length ? (
              <p>Phim chưa có mùa/phần.</p>
            ) : (
              <ul className="tw:list-none tw:p-0 tw:m-0 tw:grid tw:gap-3">
                {seasons.map((s) => (
                  <li
                    key={s.id}
                    className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:flex-wrap tw:border-t tw:border-[var(--aw-border)] tw:pt-3"
                  >
                    <div className="tw:min-w-0 tw:break-words">
                      <strong>{s.title}</strong>
                      <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                        Mùa {s.number} · Thứ tự {s.sortOrder} ·{' '}
                        {data.episodes.filter((e) => e.seasonId === s.id).length} tập
                      </p>
                    </div>
                    {canWrite && (
                      <div className="tw:flex tw:gap-2">
                        <Button
                          label="Sửa"
                          aria-label={`Sửa mùa ${s.title}`}
                          size="sm"
                          variant="quiet"
                          onClick={() => setEditor({ row: s, revision: Date.now() })}
                        />
                        <Button
                          label="Xoá"
                          aria-label={`Xoá mùa ${s.title}`}
                          size="sm"
                          variant="quiet"
                          onClick={() => setTarget({ kind: 'season', id: s.id, title: s.title })}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {editor && canWrite && session && (
            <MetadataForm
              key={`${animeId}:${editor.revision}`}
              kind="season"
              id={editor.row?.id ?? null}
              initial={
                editor.row ?? {
                  animeId,
                  title: '',
                  number: Math.max(0, ...seasons.map((s) => s.number)) + 1,
                  sortOrder: Math.max(0, ...seasons.map((s) => s.sortOrder)) + 1,
                }
              }
              catalog={data}
              session={session}
              fail={mock === 'save-error'}
              onCancel={() => setEditor(null)}
              onSaved={() => {
                setEditor(null);
                setNotice('Đã lưu mùa/phần trong phiên mẫu.');
                refresh();
              }}
            />
          )}
          <section aria-labelledby="episodes-heading" className="tw:min-w-0">
            <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:flex-wrap tw:mb-4">
              <h2 id="episodes-heading" ref={heading} tabIndex={-1} className="tw:text-xl tw:mb-0">
                Danh sách tập phim ({rows.length})
              </h2>
              {canWrite && (
                <Button
                  as="link"
                  to={paths.adminEpisodeNew(animeId, seasonId, returnTo)}
                  label="Thêm tập phim"
                />
              )}
            </div>
            <Pagination
              showSinglePage
              pageSizeControl={{
                value: pageSize,
                options: [10, 20, 50],
                label: 'Số tập mỗi trang',
                onChange: (value) => change('pageSize', String(value)),
              }}
              label="Phân trang tập phim phía trên"
              page={page}
              totalPages={totalPages}
              hrefForPage={(nextPage) => {
                const next = new URLSearchParams(params);
                next.set('page', String(nextPage));
                return `${paths.adminEpisodes}?${next}`;
              }}
              className="tw:mb-4"
            />
            {!rows.length ? (
              <ContentState
                title="Chưa có tập phim phù hợp"
                description="Thử đổi điều kiện lọc hoặc tạo mùa/phần và tập mới khi có quyền chỉnh sửa."
              />
            ) : (
              <>
                <div
                  role="region"
                  aria-label="Bảng tập phim"
                  tabIndex={0}
                  className="aw-surface tw:rounded-xl tw:overflow-x-auto tw:border tw:border-[var(--aw-border)]"
                >
                  <table className="tw:w-full tw:min-w-180 tw:text-left tw:mb-0">
                    <caption className="visually-hidden">
                      Tập phim trong phiên quản trị mẫu, chưa có nguồn phát
                    </caption>
                    <thead>
                      <tr>
                        {[
                          'Tập phim',
                          'Phim / Mùa',
                          'Thứ tự',
                          'Thời lượng',
                          'Trạng thái',
                          ...(canWrite ? ['Thao tác'] : []),
                        ].map((label) => (
                          <th
                            key={label}
                            scope="col"
                            className="tw:p-4 tw:font-medium tw:text-[var(--aw-muted)]"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice((page - 1) * pageSize, page * pageSize).map((e) => {
                        const season = data.seasons.find((s) => s.id === e.seasonId)!;
                        return (
                          <tr
                            key={e.id}
                            data-episode-id={e.id}
                            className="tw:border-t tw:border-[var(--aw-border)]"
                          >
                            <th scope="row" className="tw:p-4 tw:font-medium">
                              <span className="tw:block tw:text-[var(--aw-muted)]">
                                Tập {e.number}
                              </span>
                              {e.title}
                            </th>
                            <td className="tw:p-4">
                              {data.anime.find((a) => a.id === season.animeId)?.title}
                              <span className="tw:block tw:text-[var(--aw-muted)]">
                                {season.title}
                              </span>
                            </td>
                            <td className="tw:p-4">{e.sortOrder}</td>
                            <td className="tw:p-4 tw:whitespace-nowrap">
                              {Math.floor(e.durationSeconds / 60)} phút {e.durationSeconds % 60}{' '}
                              giây
                            </td>
                            <td className="tw:p-4 tw:whitespace-nowrap">
                              <span
                                className={
                                  e.status === 'published'
                                    ? 'tw:text-[#9fe3c2]'
                                    : 'tw:text-[#e6c48d]'
                                }
                              >
                                {e.status === 'published' ? 'Đã công bố' : 'Bản nháp'}
                              </span>
                              <span className="tw:block tw:text-[var(--aw-muted)]">
                                {e.hasPlayback ? 'Có nguồn phát' : 'Chưa có video'}
                              </span>
                            </td>
                            {canWrite && (
                              <td className="tw:p-4">
                                <div className="tw:flex tw:gap-2">
                                  <Button
                                    as="link"
                                    to={paths.adminEpisodeEdit(e.id, returnTo)}
                                    label="Sửa"
                                    aria-label={`Sửa tập ${e.title}`}
                                    size="sm"
                                    variant="quiet"
                                  />
                                  <Button
                                    label="Xoá"
                                    aria-label={`Xoá tập ${e.title}`}
                                    size="sm"
                                    variant="quiet"
                                    onClick={() =>
                                      setTarget({ kind: 'episode', id: e.id, title: e.title })
                                    }
                                  />
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  showSinglePage
                  label="Phân trang tập phim"
                  page={page}
                  totalPages={totalPages}
                  hrefForPage={(nextPage) => {
                    const next = new URLSearchParams(params);
                    next.set('page', String(nextPage));
                    return `${paths.adminEpisodes}?${next}`;
                  }}
                  className="tw:mt-5"
                />
              </>
            )}
          </section>
        </div>
      )}
      {target && canWrite && session && (
        <DeleteMetadataDialog
          target={target}
          session={session}
          fail={mock === 'delete-error'}
          onClose={() => setTarget(null)}
          onDeleted={() => {
            setTarget(null);
            setEditor(null);
            setNotice('Đã xoá khỏi phiên mẫu.');
            focusResults.current = true;
            if (target.kind === 'season' && target.id === seasonId) {
              const next = new URLSearchParams(params);
              next.delete('seasonId');
              next.delete('page');
              setParams(next, { replace: true });
            }
            refresh();
          }}
        />
      )}
    </>
  );
}
