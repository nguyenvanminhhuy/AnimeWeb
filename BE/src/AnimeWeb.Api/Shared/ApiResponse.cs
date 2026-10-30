namespace AnimeWeb.Api.Shared;

public sealed record ApiResponse<T>(T Data);
