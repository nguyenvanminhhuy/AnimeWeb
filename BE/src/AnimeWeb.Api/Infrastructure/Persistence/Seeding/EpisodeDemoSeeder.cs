using AnimeWeb.Api.Features.Episodes;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Infrastructure.Persistence.Seeding;

public static class EpisodeDemoSeeder
{
    public static async Task<bool> SeedAsync(AnimeWebDbContext database, CancellationToken cancellationToken = default)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        if (await database.Seasons.AnyAsync(cancellationToken) || await database.Episodes.AnyAsync(cancellationToken))
        {
            return false;
        }
        var matchingDemoParents = await database.Anime.CountAsync(anime =>
            (anime.Id == "anime_demo_001" && anime.Slug == "hanh-trinh-anh-sao")
            || (anime.Id == "anime_demo_002" && anime.Slug == "khu-vuon-mat-trang")
            || (anime.Id == "anime_demo_007" && anime.Slug == "ban-nhap-bi-mat"), cancellationToken);
        if (matchingDemoParents != 3)
        {
            return false;
        }

        var main = new Season { Id = "season_demo_main", AnimeId = "anime_demo_001", Number = 1, Title = "Mùa 1", SortOrder = 10 };
        var side = new Season { Id = "season_demo_side", AnimeId = "anime_demo_001", Number = 0, Title = "Ngoại truyện", SortOrder = 20 };
        var empty = new Season { Id = "season_demo_empty", AnimeId = "anime_demo_001", Number = 2, Title = "Mùa chưa có tập", SortOrder = 30 };
        var movie = new Season { Id = "season_demo_movie", AnimeId = "anime_demo_002", Number = 1, Title = "Bản điện ảnh", SortOrder = 10 };
        var hidden = new Season { Id = "season_demo_hidden", AnimeId = "anime_demo_007", Number = 1, Title = "Mùa thuộc anime draft", SortOrder = 10 };
        database.Seasons.AddRange(main, side, empty, movie, hidden);
        database.Episodes.AddRange(
            Create("episode_demo_main_z", main, 1, "Khởi đầu", 10, 1440),
            Create("episode_demo_main_special", main, 1.5m, "Tập đặc biệt", 15, 600),
            Create("episode_demo_main_a", main, 2, "Lời hứa", 20, 1440),
            Create("episode_demo_main_b", main, 3, "Đường chân trời", 20, 1440),
            Create("episode_demo_main_draft", main, 4, "Tập chưa công bố", 5, null, "draft"),
            Create("episode_demo_side", side, 0, "Ngoại truyện", 10, null),
            Create("episode_demo_movie", movie, 1, "Khu vườn mặt trăng", 10, 5400),
            Create("episode_demo_hidden", hidden, 1, "Tập thuộc anime draft", 10, 1440));
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private static Episode Create(string id, Season season, decimal number, string title,
        int sortOrder, int? durationSeconds, string status = "published") => new()
        {
            Id = id,
            Season = season,
            SeasonId = season.Id,
            Number = number,
            Title = title,
            SortOrder = sortOrder,
            DurationSeconds = durationSeconds,
            ThumbnailUrl = "/images/demo-episode.webp",
            Status = status,
            PublishedAt = status == "published"
                ? new DateTimeOffset(2026, 10, 30, 8, 0, 0, TimeSpan.Zero) : null
        };
}
