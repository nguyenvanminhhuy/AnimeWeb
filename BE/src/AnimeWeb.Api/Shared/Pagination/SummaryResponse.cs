namespace AnimeWeb.Api.Shared.Pagination;

public sealed record CollectionSummary(int Total);
public sealed record SummaryResponse<T, TSummary>(IReadOnlyList<T> Data, PageMeta Meta, TSummary Summary);
