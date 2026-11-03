using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Shared;

public sealed class AdminQuery : PageQuery
{
    [FromQuery(Name = "q"), StringLength(200)] public string? Q { get; set; }
    [FromQuery(Name = "sort"), StringLength(30)] public string? Sort { get; set; }
    [FromQuery(Name = "status"), StringLength(30)] public string? Status { get; set; }
    [FromQuery(Name = "publicationStatus"), RegularExpression("^(draft|published|archived)$")] public string? PublicationStatus { get; set; }
    [FromQuery(Name = "genre"), StringLength(100)] public string? Genre { get; set; }
    [FromQuery(Name = "format"), RegularExpression("^(tv|movie|ova|ona|special)$")] public string? Format { get; set; }
    [FromQuery(Name = "year"), Range(1, 9999)] public int? Year { get; set; }
    [FromQuery(Name = "animeId"), StringLength(100)] public string? AnimeId { get; set; }
    [FromQuery(Name = "seasonId"), StringLength(100)] public string? SeasonId { get; set; }
    [FromQuery(Name = "episodeId"), StringLength(100)] public string? EpisodeId { get; set; }
    [FromQuery(Name = "usage"), RegularExpression("^(used|unused)$")] public string? Usage { get; set; }
    [FromQuery(Name = "enabled")] public bool? Enabled { get; set; }
}
