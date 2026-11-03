using System.Diagnostics;
using Microsoft.AspNetCore.Routing;

namespace AnimeWeb.Api.Features.Operations;

public sealed class RequestDiagnosticsMiddleware(RequestDelegate next, RuntimeDiagnostics diagnostics, ILogger<RequestDiagnosticsMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var watch = Stopwatch.StartNew(); diagnostics.Begin();
        try { await next(context); }
        finally
        {
            var route = context.GetEndpoint() is RouteEndpoint endpoint ? endpoint.RoutePattern.RawText ?? "matched" : "unmatched";
            route = context.Request.Method + " " + route;
            var status = context.RequestAborted.IsCancellationRequested ? 499 : context.Response.StatusCode;
            diagnostics.End(route, watch.Elapsed.TotalMilliseconds, status);
            if (status >= 500 || watch.ElapsedMilliseconds >= 1000)
                logger.LogWarning("Request {RequestId} {Route} returned {Status} in {ElapsedMs} ms.", context.TraceIdentifier, route, status, watch.ElapsedMilliseconds);
        }
    }
}
