using System.ComponentModel.DataAnnotations;

namespace AnimeWeb.Api.Features.Anime.Dtos;

public sealed class AnimeQuery
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

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 50)]
    public int PageSize { get; set; } = 20;
}
