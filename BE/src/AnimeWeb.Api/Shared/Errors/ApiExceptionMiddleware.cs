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
}
