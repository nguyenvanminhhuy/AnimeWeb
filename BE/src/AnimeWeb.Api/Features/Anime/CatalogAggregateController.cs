using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Anime;

[ApiController, Route("api/v1")]
public sealed class CatalogAggregateController(CatalogAggregateService service, PublicCatalogCache cache) : ControllerBase
{
    [AllowAnonymous, HttpGet("common/home")]
    public async Task<ApiResponse<HomeDto>> Home([FromQuery, StringLength(100)] string? genre, CancellationToken ct) =>
        new(await cache.GetAsync("home:" + genre, (catalog, token) => catalog.HomeAsync(genre, token), ct));
    [AllowAnonymous, HttpGet("common/catalog/options")]
    public async Task<ApiResponse<CatalogOptionsDto>> Options(CancellationToken ct) =>
        new(await cache.GetAsync("options", (catalog, token) => catalog.OptionsAsync(token), ct));
    [AllowAnonymous, HttpGet("common/anime/{animeId}/related")]
    public async Task<ApiResponse<List<AnimeCardDto>>> Related([StringLength(100)] string animeId, CancellationToken ct) => new(await service.RelatedAsync(animeId, ct));
    [AllowAnonymous, HttpGet("common/rankings/anime")]
    public async Task<ApiResponse<List<RankingDto>>> Ranking([FromQuery, RegularExpression("^views$")] string metric = "views",
        [FromQuery, Range(1, 50)] int limit = 10, CancellationToken ct = default) =>
        new(await cache.GetAsync("ranking:" + limit, (catalog, token) => catalog.RankingAsync(limit, token), ct));
    [Permission("admin:dashboard:read"), HttpGet("admin/dashboard")]
    public async Task<ApiResponse<DashboardDto>> Dashboard(CancellationToken ct) => new(await service.DashboardAsync(ct));
}
