using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Anime.Dtos;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace AnimeWeb.Api.Features.Anime;

public sealed class AdminAnimeInput : VersionInput
{
    [Required, StringLength(300)] public string Title { get; set; } = "";
    [Required, StringLength(200), RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$")] public string Slug { get; set; } = "";
    [StringLength(300)] public string Subtitle { get; set; } = "";
    [MaxLength(20)] public string[] AlternativeTitles { get; set; } = [];
    [StringLength(10000)] public string Synopsis { get; set; } = "";
    [Range(1, 9999)] public int ReleaseYear { get; set; }
    [Required, RegularExpression("^(upcoming|airing|completed)$")] public string Status { get; set; } = "upcoming";
    [Required, RegularExpression("^(tv|movie|ova|ona|special)$")] public string Format { get; set; } = "tv";
    [Required, RegularExpression("^(draft|published)$")] public string PublicationStatus { get; set; } = "draft";
    [MaxLength(50)] public string[] GenreIds { get; set; } = [];
    [Required, StringLength(2048)] public string PosterUrl { get; set; } = "";
    [StringLength(2048)] public string? BannerUrl { get; set; }
}
public sealed class GenreInput : VersionInput
{
    [Required, StringLength(100)] public string Name { get; set; } = "";
    [Required, StringLength(100), RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$")] public string Slug { get; set; } = "";
}
public sealed record AdminAnimeDto(AnimeCardDto Anime, string[] AlternativeTitles, string PublicationStatus,
    string? PublicSlug, int PublishedEpisodes, long Version);
public sealed record AdminGenreDto(string Id, string Name, string Slug, int AnimeCount, long Version);
public sealed record AdminAnimeResult(IReadOnlyList<AdminAnimeDto> Data, PageMeta Meta, List<AdminGenreDto> GenreOptions, int[] Years);
public sealed record AnimeOptionDto(string Id, string Title, string Status, string PublicationStatus, string? PublicSlug);

public sealed class AdminCatalogService(AnimeWebDbContext db)
{
    public async Task<AdminAnimeResult> ListAsync(AdminQuery filters, CancellationToken ct)
    {
        var query = db.Anime.AsNoTracking();
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Title.ToLower().Contains(search)
            || x.Subtitle.ToLower().Contains(search) || x.AlternativeTitles.Any(t => t.ToLower().Contains(search)));
        if (filters.Genre is not null) query = query.Where(x => x.Genres.Any(g => g.Slug == filters.Genre));
        if (filters.Status is not null)
        {
            var status = FeatureRules.Choice(filters.Status, "status", "airing", "completed", "upcoming");
            query = query.Where(x => x.Status == status);
        }
        if (filters.PublicationStatus is not null) query = query.Where(x => x.PublicationStatus == filters.PublicationStatus);
        if (filters.Format is not null) query = query.Where(x => x.Format == filters.Format);
        if (filters.Year.HasValue) query = query.Where(x => x.ReleaseYear == filters.Year);
        var sort = FeatureRules.Choice(filters.Sort ?? "newest", "sort", "newest", "title");
        query = sort == "title" ? query.OrderBy(x => x.Title.ToLower()).ThenBy(x => x.Id)
            : query.OrderByDescending(x => x.ReleaseYear).ThenBy(x => x.Id);
        var page = await query.Select(x => new
        {
            x.Id,
            x.AlternativeTitles,
            x.PublicationStatus,
            x.Version,
            PublishedEpisodes = db.Episodes.Count(e => e.Season.AnimeId == x.Id && e.Status == "published")
        }).PageAsync(filters, ct);
        var ids = page.Data.Select(x => x.Id).ToArray();
        var cards = await db.Anime.AsNoTracking().Where(x => ids.Contains(x.Id)).Select(CatalogProjection.Card).ToDictionaryAsync(x => x.Id, ct);
        var options = await GenreOptionsAsync(ct);
        var years = await db.Anime.Select(x => x.ReleaseYear).Distinct().OrderByDescending(x => x).ToArrayAsync(ct);
        return new(page.Data.Select(x => new AdminAnimeDto(cards[x.Id], x.AlternativeTitles, x.PublicationStatus,
            x.PublicationStatus == "published" ? cards[x.Id].Slug : null, x.PublishedEpisodes, x.Version)).ToArray(), page.Meta, options, years);
    }
    public async Task<AdminAnimeDto> GetAsync(string id, CancellationToken ct)
    {
        var row = await db.Anime.AsNoTracking().Where(x => x.Id == id).Select(x => new
        {
            x.AlternativeTitles,
            x.PublicationStatus,
            x.Version,
            Count = db.Episodes.Count(e => e.Season.AnimeId == x.Id && e.Status == "published")
        }).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
        var card = await db.Anime.AsNoTracking().Where(x => x.Id == id).Select(CatalogProjection.Card).SingleAsync(ct);
        return new(card, row.AlternativeTitles, row.PublicationStatus, row.PublicationStatus == "published" ? card.Slug : null, row.Count, row.Version);
    }
    public Task<PagedResponse<AnimeOptionDto>> OptionsAsync(AdminQuery filters, CancellationToken ct)
    {
        var query = db.Anime.AsNoTracking();
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Title.ToLower().Contains(search));
        return query.OrderBy(x => x.Title).ThenBy(x => x.Id)
            .Select(x => new AnimeOptionDto(x.Id, x.Title, x.Status, x.PublicationStatus, x.PublicationStatus == "published" ? x.Slug : null))
            .PageAsync(filters, ct);
    }
    public async Task<AdminAnimeDto> SaveAsync(string? id, AdminAnimeInput input, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        Anime anime;
        if (id is null)
        {
            FeatureRules.NewVersion(input.Version);
            anime = new() { Id = FeatureRules.Id(), Title = "", Slug = "", PosterUrl = "" };
            db.Anime.Add(anime);
        }
        else
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({id}, 0))", ct);
            anime = await db.Anime.Include(x => x.Genres).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
            FeatureRules.Version(anime, input.Version);
            if (input.Format == "movie" && (await db.Seasons.CountAsync(x => x.AnimeId == id, ct) > 1
                || await db.Episodes.CountAsync(x => x.Season.AnimeId == id, ct) > 1)) throw ApiFailure.Conflict();
        }
        if (input.GenreIds.Any(x => string.IsNullOrWhiteSpace(x) || x.Length > 100) || input.GenreIds.Distinct().Count() != input.GenreIds.Length)
            throw ApiFailure.Invalid("genreIds");
        var genres = await db.Genres.Where(x => input.GenreIds.Contains(x.Id)).ToListAsync(ct);
        if (genres.Count != input.GenreIds.Length) throw ApiFailure.Invalid("genreIds");
        if (input.AlternativeTitles.Any(x => string.IsNullOrWhiteSpace(x) || x.Length > 300)) throw ApiFailure.Invalid("alternativeTitles");
        anime.Title = FeatureRules.Text(input.Title, "title", 1, 300);
        anime.Slug = input.Slug;
        anime.Subtitle = input.Subtitle.Trim();
        anime.AlternativeTitles = input.AlternativeTitles.Select(x => x.Trim()).Distinct().ToArray();
        anime.Synopsis = input.Synopsis;
        anime.ReleaseYear = input.ReleaseYear;
        anime.Status = input.Status;
        anime.Format = input.Format;
        anime.PublicationStatus = input.PublicationStatus;
        anime.PosterUrl = input.PosterUrl;
        anime.BannerUrl = input.BannerUrl;
        anime.Genres = genres;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await GetAsync(anime.Id, ct);
    }
    public async Task DeleteAsync(string id, long version, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({id}, 0))", ct);
        var anime = await db.Anime.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        if (anime.Version != version)
            throw new ApiFailure(409, "STALE_VERSION", "The anime changed. Reload before confirming deletion.");
        if (anime.PublicationStatus == "published")
            throw new ApiFailure(409, "ANIME_PUBLISHED", "Unpublish the anime before deleting it.");
        if (await db.Seasons.AnyAsync(x => x.AnimeId == id, ct)
            || await db.LibraryEntries.AnyAsync(x => x.AnimeId == id, ct)
            || await db.Comments.AnyAsync(x => x.AnimeId == id, ct)
            || await db.ViewEvents.AnyAsync(x => x.AnimeId == id, ct))
            throw new ApiFailure(409, "ANIME_IN_USE", "The anime is referenced by related content, personal data or view records.");
        await db.AnimeGenres.Where(x => x.AnimeId == id).ExecuteDeleteAsync(ct);
        db.Remove(anime);
        try { await db.SaveChangesAsync(ct); }
        // The database remains the final guard if a new reference is created after the precheck.
        catch (DbUpdateException error) when (error.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation })
        { throw new ApiFailure(409, "ANIME_IN_USE", "The anime has related data and cannot be deleted."); }
        catch (DbUpdateConcurrencyException)
        { throw new ApiFailure(409, "STALE_VERSION", "The anime changed. Reload before confirming deletion."); }
        await transaction.CommitAsync(ct);
    }
    public async Task<PagedResponse<AdminGenreDto>> GenresAsync(AdminQuery filters, CancellationToken ct)
    {
        var query = db.Genres.AsNoTracking();
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Name.ToLower().Contains(search) || x.Slug.Contains(search));
        if (filters.Usage == "used") query = query.Where(x => x.Anime.Any());
        if (filters.Usage == "unused") query = query.Where(x => !x.Anime.Any());
        var sort = FeatureRules.Choice(filters.Sort ?? "name", "sort", "name", "name-desc");
        query = sort == "name" ? query.OrderBy(x => x.Name.ToLower()).ThenBy(x => x.Id) : query.OrderByDescending(x => x.Name.ToLower()).ThenBy(x => x.Id);
        return await query.Select(x => new AdminGenreDto(x.Id, x.Name, x.Slug, x.Anime.Count, x.Version)).PageAsync(filters, ct);
    }
    public Task<List<AdminGenreDto>> GenreOptionsAsync(CancellationToken ct) => db.Genres.AsNoTracking().OrderBy(x => x.Name).ThenBy(x => x.Id)
        .Select(x => new AdminGenreDto(x.Id, x.Name, x.Slug, x.Anime.Count, x.Version)).ToListAsync(ct);
    public async Task<AdminGenreDto> GetGenreAsync(string id, CancellationToken ct) => await db.Genres.AsNoTracking().Where(x => x.Id == id)
        .Select(x => new AdminGenreDto(x.Id, x.Name, x.Slug, x.Anime.Count, x.Version)).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
    public async Task<AdminGenreDto> SaveGenreAsync(string? id, GenreInput input, CancellationToken ct)
    {
        Genre genre;
        if (id is null)
        {
            FeatureRules.NewVersion(input.Version);
            genre = new() { Id = FeatureRules.Id(), Name = "", Slug = "" };
            db.Genres.Add(genre);
        }
        else
        {
            genre = await db.Genres.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
            FeatureRules.Version(genre, input.Version);
        }
        genre.Name = FeatureRules.Text(input.Name, "name", 1, 100);
        genre.Slug = input.Slug;
        await db.SaveChangesAsync(ct);
        return await GetGenreAsync(genre.Id, ct);
    }
    public async Task DeleteGenreAsync(string id, long version, CancellationToken ct)
    {
        var genre = await db.Genres.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(genre, version);
        db.Remove(genre);
        await db.SaveChangesAsync(ct);
    }
}
