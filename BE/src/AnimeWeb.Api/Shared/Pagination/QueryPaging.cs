using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Shared.Pagination;

public static class QueryPaging
{
    public static async Task<PagedResponse<T>> PageAsync<T>(this IQueryable<T> query, PageQuery page, CancellationToken ct)
    {
        var total = await query.CountAsync(ct);
        var offset = ((long)page.Page - 1) * page.PageSize;
        var data = offset >= total ? [] : await query.Skip((int)offset).Take(page.PageSize).ToListAsync(ct);
        return new(data, new(page.Page, page.PageSize, total, (int)Math.Ceiling(total / (double)page.PageSize)));
    }
}
