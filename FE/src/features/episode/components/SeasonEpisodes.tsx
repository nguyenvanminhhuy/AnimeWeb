import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { AnimeDetail } from '../../anime/anime.types';
import { paths } from '../../../routes/paths';
import { useSession } from '../../auth/SessionProvider';

export function SeasonEpisodes({ detail }: { detail: AnimeDetail }) {
  const [params, setParams] = useSearchParams();
  const selected =
    detail.seasons.find((season) => season.id === params.get('season')) ?? detail.seasons[0];
  const { progress } = useSession();
  const episodes = detail.episodes
    .filter((episode) => episode.seasonId === selected?.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  useEffect(() => {
    if (params.get('season') && params.get('season') !== selected?.id) {
      const next = new URLSearchParams(params);
      if (selected) next.set('season', selected.id);
      else next.delete('season');
      setParams(next, { replace: true, preventScrollReset: true });
    }
  }, [params, selected?.id, setParams]);
  return (
    <section
      className="aw-detail-section"
      id="episodes"
      aria-labelledby="episodes-title"
      data-season-id={selected?.id ?? ''}
    >
      <div className="aw-detail-section-heading">
        <div>
          <span className="aw-eyebrow">TIẾP THEO TRÊN HÀNH TRÌNH</span>
          <h2 id="episodes-title">
            Mùa &amp; tập <span>{detail.episodes.length}</span>
          </h2>
        </div>
        {detail.seasons.length > 0 && (
          <div>
            <label className="visually-hidden" htmlFor="detail-season">
              Chọn mùa
            </label>
            <select
              id="detail-season"
              className="form-select"
              value={selected?.id ?? ''}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                next.set('season', event.target.value);
                setParams(next, { preventScrollReset: true });
              }}
            >
              {detail.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {!episodes.length ? (
        <p className="aw-detail-empty">Chưa có tập đã công bố cho phần này.</p>
      ) : (
        <>
          <p className="aw-detail-playback-note">
            Chưa có video demo. Các tập dưới đây chỉ có thông tin mẫu; mở tập để xem thông báo nguồn
            phát.
          </p>
          <ol className="aw-detail-episodes">
            {episodes.map((episode) => {
              const saved = progress.find((entry) => entry.episodeId === episode.id);
              return (
                <li key={episode.id}>
                  <Link
                    to={paths.watch(episode.id)}
                    aria-label={`Thông tin tập ${episode.number}: ${episode.title}`}
                  >
                    <span className="aw-detail-episode-number">
                      {String(episode.number).padStart(2, '0')}
                    </span>
                    <span>
                      <strong>{episode.title}</strong>
                      <small>
                        {Math.ceil(episode.durationSeconds / 60)} phút ·{' '}
                        {saved ? 'Có tiến độ demo' : 'Chưa có video'}
                      </small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
