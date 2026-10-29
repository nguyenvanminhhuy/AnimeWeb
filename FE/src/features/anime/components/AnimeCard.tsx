import type { Anime } from '../anime.types';
import { Artwork } from '../../../components/common/Artwork';
import { Link } from 'react-router-dom';
import { paths } from '../../../routes/paths';
export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <article className="aw-anime-card">
      <Link to={paths.animeDetail(anime.slug)}>
        <div className="aw-poster">
          <Artwork src={anime.posterUrl} alt={`Minh họa ${anime.title}`} />
          <span className="aw-poster-tag">{anime.episodeLabel}</span>
          <span className="aw-poster-play" aria-hidden="true">
            ↗
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
