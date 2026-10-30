namespace AnimeWeb.Api.Shared.Pagination;

public sealed record PageMeta(int Page, int PageSize, int Total, int TotalPages);

public sealed record PagedResponse<T>(IReadOnlyList<T> Data, PageMeta Meta);
