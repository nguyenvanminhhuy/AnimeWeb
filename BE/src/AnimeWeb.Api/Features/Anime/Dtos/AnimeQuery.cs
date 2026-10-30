using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Shared.Pagination;

namespace AnimeWeb.Api.Features.Anime.Dtos;

public sealed class AnimeQuery : PageQuery
{
    [StringLength(200)]
    public string? Q { get; set; }

    [StringLength(100)]
    [RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$")]
    public string? Genre { get; set; }

    [RegularExpression("^(upcoming|airing|completed)$")]
    public string? Status { get; set; }

    [Range(1, 9999)]
    public int? Year { get; set; }

    [RegularExpression("^(tv|movie|ova|ona|special)$")]
    public string? Format { get; set; }

    [Required]
    [RegularExpression("^(newest|title)$")]
    public string Sort { get; set; } = "newest";

}
