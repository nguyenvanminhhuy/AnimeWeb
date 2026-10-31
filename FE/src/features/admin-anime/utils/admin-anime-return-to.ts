import { paths, safeReturnTo } from '@/config/paths';

export function adminAnimeReturnTo(value: string | null): string {
  const safe = safeReturnTo(value);
  return new URL(safe, 'https://anime-web.invalid').pathname === paths.adminAnime
    ? safe
    : paths.adminAnime;
}
