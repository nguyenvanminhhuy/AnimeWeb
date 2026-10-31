import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContentState } from '@/components/common/content-state';
import { paths, safeReturnTo } from '@/config/paths';
import { useEpisodeCatalog } from '@/features/admin-episodes/hooks/use-episode-catalog';
import { MetadataForm } from '@/features/admin-episodes/components/metadata-form';

export function EpisodeFormScreen() {
  const { episodeId } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(false);
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const { data, loading, error, canWrite, session, refresh } = useEpisodeCatalog(
    mock === 'error' && !retry,
  );
  const candidate = safeReturnTo(params.get('returnTo'));
  const returnTo =
    candidate.split(/[?#]/)[0] === paths.adminEpisodes ? candidate : paths.adminEpisodes;
  if (!canWrite || !session)
    return (
      <ContentState
        title="Bạn chưa có quyền chỉnh sửa tập phim"
        description="Trang này yêu cầu quyền ghi tập phim. Phiên chỉ đọc vẫn xem được danh sách."
      />
    );
  if (error)
    return (
      <ContentState
        title="Chưa tải được tập phim"
        description={error}
        retry={() => {
          setRetry(true);
          refresh();
        }}
      />
    );
  if (loading || !data) return <p role="status">Đang tải thông tin tập phim…</p>;
  const current = data.episodes.find((e) => e.id === episodeId);
  if (episodeId && !current)
    return (
      <ContentState
        title="Không tìm thấy tập phim"
        description="Tập không tồn tại trong phiên này. Quay lại danh sách để chọn tập khác."
      />
    );
  const currentSeason = data.seasons.find((s) => s.id === current?.seasonId);
  const animeId = currentSeason?.animeId ?? params.get('animeId') ?? '';
  const seasonId = current?.seasonId ?? params.get('seasonId') ?? '';
  const peers = data.episodes.filter((e) => e.seasonId === seasonId);
  return (
    <div className="tw:max-w-220 tw:mx-auto">
      <header className="tw:mb-6">
        <p className="aw-eyebrow">NỘI DUNG PHIM</p>
        <h1 className="tw:text-3xl">{episodeId ? 'Sửa tập phim' : 'Thêm tập phim'}</h1>
        <p className="tw:text-[var(--aw-muted)]">
          Dữ liệu mẫu chỉ lưu trong phiên này. Published không đồng nghĩa có video.
        </p>
        <Button as="link" variant="quiet" label="Về danh sách mùa và tập" to={returnTo} />
      </header>
      {saved ? (
        <div role="status" className="aw-surface tw:rounded-xl tw:p-6">
          <h2 className="tw:text-xl">Đã lưu tập phim trong phiên mẫu.</h2>
          <Button as="link" to={returnTo} label="Về danh sách tập phim" />
        </div>
      ) : (
        <MetadataForm
          key={location.key}
          kind="episode"
          id={episodeId ?? null}
          initial={
            current
              ? {
                  animeId,
                  seasonId: current.seasonId,
                  title: current.title,
                  number: current.number,
                  sortOrder: current.sortOrder,
                  durationSeconds: current.durationSeconds,
                  status: current.status,
                }
              : {
                  animeId,
                  seasonId,
                  title: '',
                  number: Math.max(0, ...peers.map((e) => e.number)) + 1,
                  sortOrder: Math.max(0, ...peers.map((e) => e.sortOrder)) + 10,
                  durationSeconds: 1440,
                  status: 'draft',
                }
          }
          catalog={data}
          session={session}
          fail={mock === 'save-error'}
          onSaved={() => setSaved(true)}
          onCancel={() => navigate(returnTo)}
        />
      )}
    </div>
  );
}
