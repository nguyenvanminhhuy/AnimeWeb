using System.Text.Json.Serialization;

namespace AnimeWeb.Api.Shared.Errors;

public sealed record ApiErrorResponse(ApiError Error);

public sealed record ApiError(
    string Code,
    string Message,
    string RequestId,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    IReadOnlyDictionary<string, string[]>? Fields = null);

public static class ApiErrors
{
    public static ApiErrorResponse Create(HttpContext context, int statusCode,
        IReadOnlyDictionary<string, string[]>? fields = null)
    {
        var (code, message) = statusCode switch
        {
            400 => ("VALIDATION_ERROR", "The request contains invalid data."),
            401 => ("UNAUTHORIZED", "Authentication is required."),
            403 => ("FORBIDDEN", "The operation is not allowed."),
            404 => ("NOT_FOUND", "The requested resource was not found."),
            405 => ("METHOD_NOT_ALLOWED", "The HTTP method is not allowed."),
            415 => ("UNSUPPORTED_MEDIA_TYPE", "The content type is not supported."),
            429 => ("TOO_MANY_REQUESTS", "Too many requests."),
            503 => ("SERVICE_UNAVAILABLE", "The service is temporarily unavailable."),
            _ => ("INTERNAL_ERROR", "An unexpected error occurred.")
        };
        return new(new(code, message, context.TraceIdentifier, fields));
    }
}
