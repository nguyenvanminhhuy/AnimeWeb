using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.Extensions.DependencyInjection;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Tests.Integration;

[Trait("Category", "PostgreSQL")]
public sealed class CatalogOrderingTests(EpisodeDatabaseFixture fixture) : IClassFixture<EpisodeDatabaseFixture>
{
    [PostgreSqlFact]
    public async Task ActivePublishedPlaybackIsPrioritizedBeforePagingAndOnHomeAsync()
    {
        await using (var scope = fixture.Factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
            var now = fixture.Clock.GetUtcNow();
            for (var index = 0; index < 4; index++)
            {
                var anime = new AnimeEntity
                {
                    Id = $"ordering_{index}",
                    Slug = $"ordering-{index}",
                    Title = $"Ordering {(char)('A' + index)}",
                    PosterUrl = "/fixture.webp",
                    ReleaseYear = index == 2 ? 1907 : 9999 - index,
                    Status = "completed",
                    PublicationStatus = "published",
                };
                var season = new Season { Id = $"ordering_season_{index}", Anime = anime, AnimeId = anime.Id, Number = 1, Title = "Season", SortOrder = 1 };
                var episode = new Episode
                {
                    Id = $"ordering_episode_{index}",
                    Season = season,
                    SeasonId = season.Id,
                    Number = 1,
                    Title = "Episode",
                    SortOrder = 1,
                    Status = index == 3 ? "draft" : "published",
                    PublishedAt = index == 3 ? null : now,
                };
                db.PlaybackSources.Add(new PlaybackSource
                {
                    Id = $"ordering_source_{index}",
                    Episode = episode,
                    EpisodeId = episode.Id,
                    Label = "Fixture",
                    Language = "und",
                    Url = "https://media.example.invalid/movie.mp4",
                    Enabled = index != 0,
                    ExpiresAt = index == 1 ? now.AddSeconds(-1) : now.AddHours(1),
                });
            }
            await db.SaveChangesAsync();
        }
        var firstPage = await fixture.Client.GetFromJsonAsync<JsonElement>("/api/v1/common/anime?q=Ordering&pageSize=1");
        Assert.Equal(4, firstPage.GetProperty("meta").GetProperty("total").GetInt32());
        Assert.Equal("ordering_2", firstPage.GetProperty("data")[0].GetProperty("id").GetString());
        var all = await fixture.Client.GetFromJsonAsync<JsonElement>("/api/v1/common/anime?q=Ordering&pageSize=10");
        Assert.Equal(["ordering_2", "ordering_0", "ordering_1", "ordering_3"],
            all.GetProperty("data").EnumerateArray().Select(x => x.GetProperty("id").GetString()));
        var title = await fixture.Client.GetFromJsonAsync<JsonElement>("/api/v1/common/anime?q=Ordering&sort=title&pageSize=1");
        Assert.Equal("ordering_0", title.GetProperty("data")[0].GetProperty("id").GetString());
        var home = await fixture.Client.GetFromJsonAsync<JsonElement>("/api/v1/common/home");
        foreach (var section in new[] { "featured", "updated", "recommended" })
            Assert.Equal("ordering_2", home.GetProperty("data").GetProperty(section)[0].GetProperty("id").GetString());
    }
}
