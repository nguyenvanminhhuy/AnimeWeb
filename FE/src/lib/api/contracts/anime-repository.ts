import type { Anime, AnimeDetail, CatalogResult, HomeCatalog } from '@/types/anime';
import type { CatalogQuery } from '@/types/catalog';
export type MockState = 'ready' | 'loading' | 'empty' | 'error';
export interface AnimeRepository {
  getBySlug(slug: string, state: MockState): Promise<AnimeDetail | null>;
  getHome(state: MockState): Promise<HomeCatalog>;
  list(query: CatalogQuery, state: MockState): Promise<CatalogResult>;
  getByIds(ids: readonly string[], state: MockState): Promise<Anime[]>;
}
