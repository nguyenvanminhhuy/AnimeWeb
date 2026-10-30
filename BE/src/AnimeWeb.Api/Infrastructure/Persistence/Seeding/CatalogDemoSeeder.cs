using AnimeWeb.Api.Features.Anime;
using Microsoft.EntityFrameworkCore;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Infrastructure.Persistence.Seeding;

public static class CatalogDemoSeeder
{
    // Explicit Development command only. Never overwrite an existing catalog.
    public static async Task<bool> SeedAsync(AnimeWebDbContext database, CancellationToken cancellationToken = default)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        if (await database.Anime.AnyAsync(cancellationToken) || await database.Genres.AnyAsync(cancellationToken))
        {
            return false;
        }
        var adventure = new Genre { Id = "genre_adventure", Slug = "adventure", Name = "Phiêu lưu" };
        var fantasy = new Genre { Id = "genre_fantasy", Slug = "fantasy", Name = "Giả tưởng" };
        var romance = new Genre { Id = "genre_romance", Slug = "romance", Name = "Tình cảm" };
        var experimental = new Genre { Id = "genre_experimental", Slug = "experimental", Name = "Thử nghiệm" };
        database.Anime.AddRange(
            Create("001", "hanh-trinh-anh-sao", "Hành trình ánh sao", "Star Journey", 2026, "airing", "tv", [adventure, fantasy]),
            Create("002", "khu-vuon-mat-trang", "Khu vườn mặt trăng", "Moon Garden", 2026, "completed", "movie", [fantasy, romance]),
            Create("003", "chuyen-tau-binh-minh", "Chuyến tàu bình minh", "Dawn Train", 2025, "completed", "tv", [adventure]),
            Create("004", "mua-he-ben-bien", "Mùa hè bên biển", "Summer by the Sea", 2024, "completed", "movie", [romance]),
            Create("005", "nguoi-giu-bau-troi", "Người giữ bầu trời", "Sky Keeper", 2027, "upcoming", "tv", [fantasy]),
            Create("006", "la-thu-trong-mua", "Lá thư trong mưa", "Rain Letter", 2025, "completed", "ona", [romance]),
            Create("007", "ban-nhap-bi-mat", "Bản nháp bí mật", "Hidden Draft", 2028, "upcoming", "special", [experimental], "draft"));
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private static AnimeEntity Create(string suffix, string slug, string title, string alternativeTitle,
        int year, string status, string format, List<Genre> genres, string publicationStatus = "published") =>
        new()
        {
            Id = "anime_demo_" + suffix,
            Slug = slug,
            Title = title,
            AlternativeTitles = [alternativeTitle],
            Synopsis = "Anime hư cấu dùng để kiểm tra danh mục. Chưa có nguồn video.",
            PosterUrl = "/images/demo-poster.webp",
            Status = status,
            Format = format,
            ReleaseYear = year,
            PublicationStatus = publicationStatus,
            Genres = genres
        };
}
