import { animeFormatLabel } from '@/config/catalog';
import type { Anime } from '@/types/anime';
import { Artwork } from '@/components/common/artwork';
import { Link } from 'react-router-dom';
import { paths } from '@/config/paths';
export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <article className="aw-anime-card tw:min-w-0">
      <Link
        to={anime.available === false ? '#' : paths.animeDetail(anime.slug)}
        aria-disabled={anime.available === false || undefined}
        tabIndex={anime.available === false ? -1 : undefined}
        onClick={(event) => {
          if (anime.available === false) event.preventDefault();
        }}
      >
        <div className="aw-poster tw:overflow-hidden tw:rounded-[9px]">
          <Artwork src={anime.posterUrl} alt={`Minh họa ${anime.title}`} />
        </div>
        <h3 className="tw:line-clamp-2 tw:min-h-[3em] tw:break-words" title={anime.title}>
          {anime.title}
        </h3>
        <span className="tw:block tw:mb-1 tw:text-body tw:text-[var(--aw-muted)]">
          {anime.episodeLabel}
        </span>
      </Link>
      <p>
        {anime.releaseYear}
        <span>·</span>
        {anime.genres[0]}
        <span>·</span>
        {animeFormatLabel(anime.format)}
      </p>
    </article>
  );
}
