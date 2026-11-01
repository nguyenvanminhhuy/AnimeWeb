namespace AnimeWeb.Api.Shared.Errors;

public sealed class ApiFailure(int status, string code, string message,
    IReadOnlyDictionary<string, string[]>? fields = null) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
    public IReadOnlyDictionary<string, string[]>? Fields { get; } = fields;

    public static ApiFailure NotFound() => new(404, "NOT_FOUND", "Resource not found.");
    public static ApiFailure Conflict() => new(409, "CONFLICT", "The resource changed or is still in use.");
    public static ApiFailure Invalid(string field, string message = "Invalid value.") =>
        new(400, "VALIDATION_ERROR", "The request contains invalid data.", new Dictionary<string, string[]> { [field] = [message] });
}
