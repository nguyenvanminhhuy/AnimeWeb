using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Shared.Pagination;

public class PageQuery
{
    [FromQuery(Name = "page")]
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [FromQuery(Name = "pageSize")]
    [Range(1, 50)]
    public int PageSize { get; set; } = 20;
}
