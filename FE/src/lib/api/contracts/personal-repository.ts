import type {
  PersonalActor,
  PersonalSnapshot,
  PersonalQuery,
  PersonalPage,
  ProfileSummary,
} from '@/types/personal';
import type { Progress } from '@/types/progress';
export interface PersonalRepository {
  snapshot(actor: PersonalActor, signal: AbortSignal): Promise<PersonalSnapshot>;
  list(actor: PersonalActor, query: PersonalQuery, signal: AbortSignal): Promise<PersonalPage>;
  summary(actor: PersonalActor, signal: AbortSignal): Promise<ProfileSummary>;
  setFavorite(
    actor: PersonalActor,
    animeId: string,
    isFavorite: boolean,
    version: number,
    signal: AbortSignal,
  ): Promise<PersonalSnapshot>;
  saveProgress(
    actor: PersonalActor,
    entry: Progress,
    signal: AbortSignal,
  ): Promise<PersonalSnapshot>;
}
