import type { Anime } from '../anime.types';
import { Artwork } from '../../../components/common/Artwork';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/ui/Icon';
import { paths } from '../../../routes/paths';
export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <article className="aw-anime-card tw:min-w-0">
      <Link to={paths.animeDetail(anime.slug)}>
        <div className="aw-poster tw:overflow-hidden tw:rounded-[9px]">
          <Artwork src={anime.posterUrl} alt={`Minh họa ${anime.title}`} />
          <span className="aw-poster-tag tw:px-1.75 tw:py-1 tw:absolute tw:z-[1] tw:left-2.5 tw:bottom-2.5 tw:rounded-[4px] tw:text-body">
            {anime.episodeLabel}
          </span>
          <span className="aw-poster-play tw:absolute tw:top-2.25 tw:right-2.5" aria-hidden="true">
            <Icon name="external-link" size="sm" />
          </span>
        </div>
        <h3>{anime.title}</h3>
      </Link>
      <p>
        {anime.releaseYear}
        <span>·</span>
        {anime.genres[0]}
        <span>·</span>
        {anime.format === 'tv' ? 'TV' : 'Movie'}
      </p>
    </article>
  );
}
