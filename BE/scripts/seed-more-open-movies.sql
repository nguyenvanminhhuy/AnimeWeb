-- Explicit local setup; attribution and license are retained in each synopsis.
-- __MOVIES_JSON__ is replaced with a randomly dollar-quoted JSON literal by setup-more-open-movies.ps1.
BEGIN;
SELECT pg_advisory_xact_lock(736184216);
CREATE TEMP TABLE open_movies ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset(__MOVIES_JSON__::jsonb) AS movie(
    key text, slug text, title text, year integer, duration integer, language text, quality text,
    genre text, description text, attribution text, license text, "licenseUrl" text);

INSERT INTO "Anime" ("Id", "Slug", "Title", "Subtitle", "AlternativeTitles", "Synopsis", "PosterUrl",
    "BannerUrl", "Status", "Format", "ReleaseYear", "PublicationStatus", "Version")
SELECT 'anime_open_' || key, slug, title, 'Phim ngắn mở · Blender', ARRAY[]::text[],
    description || ' Ghi công: ' || attribution || '. Giấy phép: ' || license || ' — ' || "licenseUrl",
    '/images/' || slug || '-poster.png', NULL, 'completed', 'movie', year, 'published', 1
FROM open_movies ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Seasons" ("Id", "AnimeId", "Number", "Title", "SortOrder", "Version")
SELECT 'season_open_' || key, 'anime_open_' || key, 1, 'Phim ngắn', 10, 1
FROM open_movies ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Episodes" ("Id", "SeasonId", "Number", "Title", "SortOrder", "DurationSeconds",
    "ThumbnailUrl", "PublishedAt", "Status", "Version")
SELECT 'episode_open_' || key, 'season_open_' || key, 1, title || ' — bản đầy đủ', 10, duration,
    '/images/' || slug || '-poster.png', CURRENT_TIMESTAMP, 'published', 1
FROM open_movies ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "PlaybackSources" ("Id", "EpisodeId", "ProviderKey", "Label", "Language", "Type", "Url",
    "Enabled", "CreatedAt", "ExpiresAt", "Version")
SELECT 'source_open_' || key || '_mp4', 'episode_open_' || key, 'direct', 'MP4 ' || quality || ' · Blender', language,
    'mp4', 'http://127.0.0.1:5173/media/open-movies/' || slug || '.mp4', TRUE, CURRENT_TIMESTAMP, NULL, 1
FROM open_movies ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "AnimeGenres" ("AnimeId", "GenreId")
SELECT 'anime_open_' || movie.key, genre."Id" FROM open_movies movie JOIN "Genres" genre ON genre."Slug" = movie.genre
ON CONFLICT DO NOTHING;
COMMIT;
