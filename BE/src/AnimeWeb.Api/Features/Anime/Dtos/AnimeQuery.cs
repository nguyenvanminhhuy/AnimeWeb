using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Anime.Dtos;

public sealed class AnimeQuery : PageQuery
{
    [FromQuery(Name = "q")]
    [StringLength(200)]
    public string? Q { get; set; }

    [FromQuery(Name = "genre")]
    [StringLength(100)]
    [RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$")]
    public string? Genre { get; set; }

    [FromQuery(Name = "status")]
    [RegularExpression("^(upcoming|airing|completed)$")]
    public string? Status { get; set; }

    [FromQuery(Name = "year")]
    [Range(1, 9999)]
    public int? Year { get; set; }

    [FromQuery(Name = "format")]
    [RegularExpression("^(tv|movie|ova|ona|special)$")]
    public string? Format { get; set; }

    [FromQuery(Name = "sort")]
    [Required]
    [RegularExpression("^(newest|title)$")]
    public string Sort { get; set; } = "newest";

}
