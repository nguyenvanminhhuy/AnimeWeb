using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace AnimeWeb.Api.Shared.Errors;

public sealed class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            context.Abort();
        }
        catch (ApiFailure failure) when (!context.Response.HasStarted)
        {
            context.Response.Clear();
            context.Response.StatusCode = failure.Status;
            await context.Response.WriteAsJsonAsync(new ApiErrorResponse(new ApiError(
                failure.Code, failure.Message, context.TraceIdentifier, failure.Fields)), context.RequestAborted);
        }
        catch (Exception exception) when (!context.Response.HasStarted && IsConflict(exception))
        {
            context.Response.Clear();
            context.Response.StatusCode = 409;
            await context.Response.WriteAsJsonAsync(ApiErrors.Create(context, 409), context.RequestAborted);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            // Exception messages may contain provider URLs or connection details.
            logger.LogError("Request {RequestId} failed with {ExceptionType}.",
                context.TraceIdentifier, exception.GetType().Name);
            context.Response.Clear();
            context.Response.StatusCode = exception is BadHttpRequestException badRequest
                ? badRequest.StatusCode : StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(
                ApiErrors.Create(context, context.Response.StatusCode), context.RequestAborted);
        }
    }

    private static bool IsConflict(Exception error) => error is DbUpdateConcurrencyException
        || (error is DbUpdateException update ? update.InnerException : error) is PostgresException postgres
        && postgres.SqlState is PostgresErrorCodes.UniqueViolation or PostgresErrorCodes.ForeignKeyViolation or PostgresErrorCodes.RestrictViolation
            or PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.DeadlockDetected;
}
