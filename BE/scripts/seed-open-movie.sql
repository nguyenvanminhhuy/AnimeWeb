-- Big Buck Bunny: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org
-- CC BY 3.0: https://creativecommons.org/licenses/by/3.0/
-- Explicit local setup only. Add this film separately; never attach it to imported anime.
BEGIN;
SELECT pg_advisory_xact_lock(736184216);

INSERT INTO "Anime" ("Id", "Slug", "Title", "Subtitle", "AlternativeTitles", "Synopsis", "PosterUrl",
    "BannerUrl", "Status", "Format", "ReleaseYear", "PublicationStatus", "Version")
VALUES ('anime_open_bbb', 'big-buck-bunny', 'Big Buck Bunny', 'Phim hoạt hình ngắn · Blender Foundation',
    ARRAY[]::text[],
    'Một chú thỏ hiền lành tìm cách đối phó với ba kẻ hay bắt nạt trong khu rừng. Phim hoạt hình ngắn năm 2008 của Blender Foundation, dùng để trải nghiệm chức năng xem phim. Bản gốc 180p, không có phụ đề tiếng Việt. Nguồn và ghi công: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org. Giấy phép CC BY 3.0: https://creativecommons.org/licenses/by/3.0/.',
    '/images/big-buck-bunny-poster.png', NULL, 'completed', 'movie', 2008, 'published', 1)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Seasons" ("Id", "AnimeId", "Number", "Title", "SortOrder", "Version")
VALUES ('season_open_bbb', 'anime_open_bbb', 1, 'Phim ngắn', 10, 1)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Episodes" ("Id", "SeasonId", "Number", "Title", "SortOrder", "DurationSeconds",
    "ThumbnailUrl", "PublishedAt", "Status", "Version")
VALUES ('episode_open_bbb', 'season_open_bbb', 1, 'Big Buck Bunny — bản đầy đủ', 10, 597,
    '/images/big-buck-bunny-poster.png', CURRENT_TIMESTAMP, 'published', 1)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "PlaybackSources" ("Id", "EpisodeId", "ProviderKey", "Label", "Language", "Type", "Url",
    "Enabled", "CreatedAt", "ExpiresAt", "Version")
VALUES ('source_open_bbb_mp4', 'episode_open_bbb', 'direct', 'MP4 180p · Blender Foundation', 'und', 'mp4',
    'http://127.0.0.1:5173/media/open-movies/big-buck-bunny.mp4', TRUE, CURRENT_TIMESTAMP, NULL, 1)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "AnimeGenres" ("AnimeId", "GenreId")
SELECT 'anime_open_bbb', "Id" FROM "Genres" WHERE "Slug" = 'comedy'
ON CONFLICT DO NOTHING;

COMMIT;
