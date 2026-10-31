import { useEffect, useRef, useState } from 'react';
import { Form, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { ContentState } from '@/components/common/content-state';
import { Pagination } from '@/components/common/pagination';
import { paths } from '@/config/paths';
import { normalizeSearch } from '@/utils/search';
import type { AdminSourceInput, AdminSubtitleInput } from '@/types/admin-playback';
import { usePlaybackCatalog } from '@/features/admin-playback/hooks/use-playback-catalog';
import { MediaForm } from '@/features/admin-playback/components/media-form';
import { DeleteMediaDialog } from '@/features/admin-playback/components/delete-media-dialog';
import type { MediaTarget } from '@/features/admin-playback/components/delete-media-dialog';
import { playbackHref, readPlaybackQuery } from '@/features/admin-playback/utils/playback-query';

type Editor = {
  id: string | null;
  initial: AdminSourceInput | AdminSubtitleInput;
  revision: number;
};
export function PlaybackScreen() {
  const [params, setParams] = useSearchParams();
  const query = readPlaybackQuery(params);
  const { animeId, seasonId, episodeId, sourceId, q, enabled, sort, pageSize } = query;
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const { data, loading, error, session, canRead, canWrite, refresh } = usePlaybackCatalog(
    mock === 'error',
  );
  const [editor, setEditor] = useState<Editor | null>(null);
  const [target, setTarget] = useState<MediaTarget | null>(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState(q);
  const [composing, setComposing] = useState(false);
  const focusResults = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(() => {
    setEditor(null);
  }, [animeId, seasonId, episodeId, sourceId]);
  useEffect(() => {
    if (data && !loading && focusResults.current) {
      focusResults.current = false;
      heading.current?.focus();
    }
  }, [data, loading]);
  useEffect(() => {
    if (composing || search.trim().slice(0, 200) === q) return;
    const timer = setTimeout(
      () =>
        setParams((current) => {
          const next = new URLSearchParams(current);
          next.delete('page');
          if (search.trim()) next.set('q', search.trim().slice(0, 200));
          else next.delete('q');
          return next;
        }),
      350,
    );
    return () => clearTimeout(timer);
  }, [composing, search, q, setParams]);
  const seasons = (data?.seasons ?? [])
    .filter((s) => s.animeId === animeId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const episodes = (data?.episodes ?? [])
    .filter((e) => e.seasonId === seasonId && seasons.some((s) => s.id === seasonId))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const episode = episodes.find((e) => e.id === episodeId);
  const episodeSources = (data?.sources ?? []).filter(
    (s) => s.episodeId === episodeId && Boolean(episode),
  );
  const source = episodeSources.find((s) => s.id === sourceId);
  const rows = (mock === 'empty' ? [] : episodeSources)
    .filter(
      (s) =>
        (!q ||
          normalizeSearch(`${s.label} ${s.providerKey} ${s.language}`).includes(
            normalizeSearch(q),
          )) &&
        (!enabled || s.enabled === (enabled === 'yes')),
    )
    .sort((a, b) =>
      sort === 'label' ? a.label.localeCompare(b.label, 'vi') || a.id.localeCompare(b.id) : 0,
    );
  const totalPages = Math.ceil(rows.length / pageSize);
  const page = Math.min(query.page, Math.max(1, totalPages));
  useEffect(() => {
    if (!data) return;
    const next = new URLSearchParams(params);
    const selected = data.episodes.find(
      (e) => e.id === (episodeId || data.sources.find((s) => s.id === sourceId)?.episodeId),
    );
    const season = data.seasons.find((s) => s.id === selected?.seasonId);
    if (selected && season) {
      if (!episodeId) next.set('episodeId', selected.id);
      if (!seasonId) next.set('seasonId', season.id);
      if (!animeId) next.set('animeId', season.animeId);
    }
    if (params.has('page') && params.get('page') !== String(page)) next.set('page', String(page));
    if (params.has('pageSize') && params.get('pageSize') !== String(pageSize))
      next.set('pageSize', String(pageSize));
    if (params.has('enabled') && params.get('enabled') !== enabled) next.delete('enabled');
    if (params.has('sort') && params.get('sort') !== sort) next.set('sort', sort);
    if (params.has('q') && params.get('q') !== q) {
      if (q) next.set('q', q);
      else next.delete('q');
    }
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [
    data,
    params,
    setParams,
    animeId,
    seasonId,
    episodeId,
    sourceId,
    page,
    pageSize,
    enabled,
    sort,
    q,
  ]);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    if (['animeId', 'seasonId', 'episodeId'].includes(key)) {
      next.delete('sourceId');
      if (key === 'animeId') next.delete('seasonId');
      if (key !== 'episodeId') next.delete('episodeId');
      setEditor(null);
    }
    setParams(next);
  }
  function edit(id: string | null, initial: AdminSourceInput | AdminSubtitleInput) {
    setEditor({ id, initial, revision: Date.now() });
  }
  const saved = () => {
    setEditor(null);
    setNotice('Đã lưu cấu hình trong phiên mẫu.');
    refresh();
  };
  if (!canRead)
    return (
      <ContentState
        title="Bạn chưa có quyền xem nguồn phát và phụ đề"
        description="Trang này yêu cầu quyền đọc cấu hình phát quản trị."
      />
    );
  return (
    <>
      <header className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:flex-wrap tw:mb-6">
        <div>
          <p className="aw-eyebrow">CẤU HÌNH PHÁT</p>
          <h1 className="tw:text-3xl tw:max-phone:text-2xl">Nguồn phát và phụ đề</h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">
            Quản lý phiên bản video và ngôn ngữ cho từng tập phim.
          </p>
        </div>
        <Button label="Làm mới" variant="quiet" loading={loading} onClick={refresh} />
      </header>
      <p className="tw:p-4 tw:rounded-xl tw:bg-[#a697ff0d] tw:border tw:border-[var(--aw-border)] tw:text-[var(--aw-muted)]">
        Dữ liệu mẫu ·{' '}
        {canWrite
          ? 'Thay đổi chỉ lưu trong phiên này, reset khi tải lại hoặc đổi phiên.'
          : 'Phiên chỉ đọc; dùng phiên có quyền chỉnh sửa để thay đổi cấu hình.'}{' '}
        Nguồn chưa được kiểm chứng và không tự xuất hiện trên trang xem phim.
      </p>
      {notice && (
        <p role="status" className="tw:text-[#9fe3c2]">
          {notice}
        </p>
      )}
      {error ? (
        <ContentState
          title="Chưa tải được cấu hình phát"
          description={error}
          retry={() => {
            const next = new URLSearchParams(params);
            next.delete('mock');
            setParams(next, { replace: true });
            refresh();
          }}
        />
      ) : loading || !data ? (
        <p role="status">Đang tải nguồn phát và phụ đề…</p>
      ) : (
        <div data-admin-playback="ready" className="tw:grid tw:gap-6 tw:min-w-0">
          <Form
            method="get"
            onSubmit={(e) => {
              e.preventDefault();
              change('q', search.trim());
            }}
            className="aw-surface tw:rounded-xl tw:p-5 tw:grid tw:grid-cols-3 tw:gap-4 tw:max-phone:grid-cols-1"
          >
            <div>
              <label htmlFor="playback-anime">Phim</label>
              <Selectbox
                id="playback-anime"
                value={animeId}
                onChange={(e) => change('animeId', e.target.value)}
                options={[
                  { value: '', label: 'Chọn phim' },
                  ...data.anime.map((a) => ({ value: a.id, label: a.title })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="playback-season">Mùa/phần</label>
              <Selectbox
                id="playback-season"
                value={seasonId}
                disabled={!animeId}
                onChange={(e) => change('seasonId', e.target.value)}
                options={[
                  { value: '', label: 'Chọn mùa/phần' },
                  ...seasons.map((s) => ({ value: s.id, label: s.title })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="playback-episode">Tập phim</label>
              <Selectbox
                id="playback-episode"
                value={episodeId}
                disabled={!seasonId}
                onChange={(e) => change('episodeId', e.target.value)}
                options={[
                  { value: '', label: 'Chọn tập phim' },
                  ...episodes.map((e) => ({ value: e.id, label: `Tập ${e.number} · ${e.title}` })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="playback-search">Tìm nguồn phát</label>
              <Input
                id="playback-search"
                type="search"
                maxLength={200}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                placeholder="Nhãn, nhà cung cấp, ngôn ngữ"
              />
            </div>
            <div>
              <label htmlFor="playback-enabled">Trạng thái nguồn</label>
              <Selectbox
                id="playback-enabled"
                value={enabled}
                onChange={(e) => change('enabled', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'yes', label: 'Đang bật' },
                  { value: 'no', label: 'Đang tắt' },
                ]}
              />
            </div>
            <div>
              <label htmlFor="playback-sort">Sắp xếp</label>
              <Selectbox
                id="playback-sort"
                value={sort}
                onChange={(e) => change('sort', e.target.value)}
                options={[
                  { value: 'created', label: 'Thứ tự tạo' },
                  { value: 'label', label: 'Nhãn A–Z' },
                ]}
              />
            </div>
          </Form>
          {episodeId && !episode ? (
            <ContentState
              title="Không tìm thấy tập phim đã chọn"
              description="Kiểm tra phim, mùa và tập trong URL hoặc chọn lại tập phim."
            />
          ) : !episode ? (
            <ContentState
              title="Chọn tập phim để quản lý nguồn"
              description="Chọn lần lượt phim, mùa/phần và tập. Phim chưa có tập cần được tạo tập trước."
            />
          ) : (
            <>
              <section aria-labelledby="source-heading" className="tw:min-w-0">
                <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:flex-wrap tw:mb-4">
                  <div>
                    <h2
                      id="source-heading"
                      ref={heading}
                      tabIndex={-1}
                      className="tw:text-xl tw:mb-1"
                    >
                      Nguồn phát ({rows.length})
                    </h2>
                    <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                      Tập {episode.number} · {episode.title}
                    </p>
                  </div>
                  {canWrite && (
                    <Button
                      label="Thêm nguồn phát"
                      onClick={() =>
                        edit(null, {
                          episodeId,
                          providerKey: 'local',
                          label: '',
                          language: 'ja',
                          type: 'mp4',
                          url: '',
                          enabled: false,
                        })
                      }
                    />
                  )}
                </div>
                <Pagination
                  className="tw:mb-4"
                  showSinglePage
                  pageSizeControl={{
                    value: pageSize,
                    options: [5, 10, 20],
                    label: 'Số nguồn mỗi trang',
                    onChange: (value) => change('pageSize', String(value)),
                  }}
                  label="Phân trang nguồn phát phía trên"
                  page={page}
                  totalPages={totalPages}
                  hrefForPage={(p) => playbackHref(params, p)}
                />
                {!rows.length ? (
                  <ContentState
                    title={episodeSources.length ? 'Không có nguồn phù hợp' : 'Chưa có nguồn phát'}
                    description="Thêm cấu hình khi có quyền chỉnh sửa hoặc thay đổi bộ lọc. Chưa có tài nguyên video được cung cấp sẵn."
                  />
                ) : (
                  <>
                    <div
                      role="region"
                      aria-label="Bảng nguồn phát"
                      tabIndex={0}
                      className="aw-surface tw:rounded-xl tw:overflow-x-auto tw:border tw:border-[var(--aw-border)]"
                    >
                      <table className="tw:w-full tw:min-w-180 tw:text-left tw:mb-0">
                        <caption className="visually-hidden">
                          Cấu hình nguồn phát trong phiên mẫu, chưa kiểm chứng khả năng phát
                        </caption>
                        <thead>
                          <tr>
                            {[
                              'Nguồn / Nhà cung cấp',
                              'Định dạng',
                              'Ngôn ngữ',
                              'Trạng thái',
                              'Phụ đề',
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
                          {rows.slice((page - 1) * pageSize, page * pageSize).map((s) => (
                            <tr
                              key={s.id}
                              data-source-id={s.id}
                              className="tw:border-t tw:border-[var(--aw-border)]"
                            >
                              <th scope="row" className="tw:p-4 tw:font-medium tw:max-w-72">
                                <span className="tw:block">{s.label}</span>
                                <span className="tw:block tw:text-[var(--aw-muted)]">
                                  {s.providerKey}
                                </span>
                                <span className="tw:block tw:break-all tw:font-normal tw:text-[var(--aw-muted)]">
                                  {s.url}
                                </span>
                              </th>
                              <td className="tw:p-4">{s.type.toUpperCase()}</td>
                              <td className="tw:p-4">{s.language}</td>
                              <td className="tw:p-4 tw:whitespace-nowrap">
                                <span
                                  className={
                                    s.enabled ? 'tw:text-[#9fe3c2]' : 'tw:text-[var(--aw-muted)]'
                                  }
                                >
                                  {s.enabled ? 'Đang bật' : 'Đang tắt'}
                                </span>
                                <span className="tw:block tw:text-[var(--aw-muted)]">
                                  Chưa kiểm chứng
                                </span>
                              </td>
                              <td className="tw:p-4">
                                <Link
                                  aria-label={`Phụ đề của ${s.label}`}
                                  to={(() => {
                                    const next = new URLSearchParams(params);
                                    next.set('sourceId', s.id);
                                    return `${paths.adminPlayback}?${next}`;
                                  })()}
                                  aria-current={sourceId === s.id ? 'true' : undefined}
                                >
                                  {data.subtitles.filter((t) => t.playbackSourceId === s.id).length}{' '}
                                  phụ đề
                                </Link>
                              </td>
                              {canWrite && (
                                <td className="tw:p-4">
                                  <div className="tw:flex tw:gap-2">
                                    <Button
                                      label="Sửa"
                                      aria-label={`Sửa nguồn ${s.label}`}
                                      size="sm"
                                      variant="quiet"
                                      onClick={() => edit(s.id, s)}
                                    />
                                    <Button
                                      label="Xoá"
                                      aria-label={`Xoá nguồn ${s.label}`}
                                      size="sm"
                                      variant="quiet"
                                      onClick={() =>
                                        setTarget({ kind: 'source', id: s.id, label: s.label })
                                      }
                                    />
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      className="tw:mt-5"
                      showSinglePage
                      label="Phân trang nguồn phát"
                      page={page}
                      totalPages={totalPages}
                      hrefForPage={(p) => playbackHref(params, p)}
                    />
                  </>
                )}
              </section>
              <section
                aria-labelledby="subtitle-heading"
                className="aw-surface tw:rounded-xl tw:p-5 tw:min-w-0"
              >
                <div className="tw:flex tw:gap-3 tw:items-center tw:justify-between tw:flex-wrap tw:mb-4">
                  <div>
                    <h2 id="subtitle-heading" className="tw:text-xl tw:mb-1">
                      Phụ đề {source ? `· ${source.label}` : ''}
                    </h2>
                    <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                      Gắn phụ đề vào đúng phiên bản nguồn video để giữ đồng bộ thời gian.
                    </p>
                  </div>
                  {source && canWrite && (
                    <Button
                      label="Thêm phụ đề"
                      onClick={() =>
                        edit(null, {
                          playbackSourceId: source.id,
                          label: '',
                          language: 'vi',
                          format: 'vtt',
                          url: '',
                          isDefault: false,
                        })
                      }
                    />
                  )}
                </div>
                {!source ? (
                  <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                    {sourceId
                      ? 'Không tìm thấy nguồn phát đã chọn.'
                      : 'Chọn liên kết phụ đề ở một nguồn phát để quản lý.'}
                  </p>
                ) : !data.subtitles.some((s) => s.playbackSourceId === source.id) ? (
                  <p className="tw:text-[var(--aw-muted)] tw:mb-0">Nguồn này chưa có phụ đề.</p>
                ) : (
                  <ul className="tw:list-none tw:p-0 tw:m-0 tw:grid tw:gap-4">
                    {data.subtitles
                      .filter((s) => s.playbackSourceId === source.id)
                      .map((s) => (
                        <li
                          key={s.id}
                          data-subtitle-id={s.id}
                          className="tw:border-t tw:border-[var(--aw-border)] tw:pt-4 tw:flex tw:justify-between tw:items-start tw:gap-4 tw:flex-wrap"
                        >
                          <div className="tw:min-w-0 tw:flex-1">
                            <strong>{s.label}</strong>
                            <p className="tw:text-[var(--aw-muted)] tw:mb-1">
                              {s.language} · {s.format.toUpperCase()} ·{' '}
                              {s.isDefault ? 'Mặc định' : 'Tuỳ chọn'}
                            </p>
                            <p className="tw:break-all tw:text-[var(--aw-muted)] tw:mb-0">
                              {s.url}
                            </p>
                          </div>
                          {canWrite && (
                            <div className="tw:flex tw:gap-2">
                              <Button
                                label="Sửa"
                                aria-label={`Sửa phụ đề ${s.label}`}
                                size="sm"
                                variant="quiet"
                                onClick={() => edit(s.id, s)}
                              />
                              <Button
                                label="Xoá"
                                aria-label={`Xoá phụ đề ${s.label}`}
                                size="sm"
                                variant="quiet"
                                onClick={() =>
                                  setTarget({ kind: 'subtitle', id: s.id, label: s.label })
                                }
                              />
                            </div>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </section>
              {editor && canWrite && session && (
                <MediaForm
                  key={editor.revision}
                  id={editor.id}
                  initial={editor.initial}
                  session={session}
                  fail={mock === 'save-error'}
                  onSaved={saved}
                  onCancel={() => setEditor(null)}
                />
              )}
            </>
          )}
          <Button as="link" variant="quiet" label="Quản lý mùa và tập" to={paths.adminEpisodes} />
        </div>
      )}
      {target && canWrite && session && (
        <DeleteMediaDialog
          key={target.id}
          target={target}
          session={session}
          fail={mock === 'delete-error'}
          onClose={() => setTarget(null)}
          onDeleted={() => {
            if (target.kind === 'source' && target.id === sourceId) {
              const next = new URLSearchParams(params);
              next.delete('sourceId');
              setParams(next, { replace: true });
            }
            setTarget(null);
            setEditor(null);
            setNotice('Đã xoá cấu hình khỏi phiên mẫu.');
            focusResults.current = true;
            refresh();
          }}
        />
      )}
    </>
  );
}
