using System.Net;
using System.Security.Claims;
using System.Threading.RateLimiting;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;

namespace AnimeWeb.Api.Shared.Configuration;

public static class TrafficConfiguration
{
    public static IServiceCollection AddTrafficControls(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            var proxies = configuration.GetSection("Proxy:KnownProxies").Get<string[]>() ?? ["127.0.0.1", "::1"];
            if (proxies.Any(value => !IPAddress.TryParse(value, out _)))
                throw new InvalidOperationException("Proxy:KnownProxies must contain IP addresses.");
            var forwardLimit = configuration.GetValue("Proxy:ForwardLimit", 1);
            if (forwardLimit is < 1 or > 5) throw new InvalidOperationException("Proxy:ForwardLimit must be between 1 and 5.");
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = forwardLimit;
            options.KnownProxies.Clear();
            options.KnownIPNetworks.Clear();
            foreach (var proxy in proxies) options.KnownProxies.Add(IPAddress.Parse(proxy));
            // An empty trust list must never mean trust every remote address.
            if (proxies.Length == 0) options.KnownProxies.Add(IPAddress.None);
        });
        int Limit(string name, int fallback)
        {
            var value = configuration.GetValue<int?>("RateLimits:" + name)
                ?? configuration.GetValue<int?>("RateLimits:Global") ?? fallback;
            if (value is < 1 or > 1000000) throw new InvalidOperationException("RateLimits must be between 1 and 1000000.");
            return value;
        }
        services.AddRateLimiter(options =>
        {
            var limits = new Dictionary<string, int>
            {
                ["public"] = Limit("PublicRead", 600),
                ["read"] = Limit("UserRead", 240),
                ["write"] = Limit("UserWrite", 60),
                ["progress"] = Limit("Progress", 30),
                ["view"] = Limit("View", 120),
                ["telemetry"] = Limit("Telemetry", 20),
                ["auth"] = Limit("Auth", 10)
            };
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var user = context.User.Identity?.IsAuthenticated == true && context.User.FindFirstValue("accountStatus") == "active"
                    ? context.User.FindFirstValue(ClaimTypes.NameIdentifier) : null;
                var ip = context.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "unknown";
                var identity = user is null ? "ip:" + ip : "user:" + user;
                var path = context.Request.Path.Value ?? "";
                var read = HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method);
                var group = read ? user is null ? "public" : "read"
                    : path.EndsWith("/playback-reports", StringComparison.OrdinalIgnoreCase) ? "telemetry"
                    : path.StartsWith("/api/v1/me/progress/", StringComparison.OrdinalIgnoreCase) ? "progress"
                    : path.StartsWith("/api/v1/common/", StringComparison.OrdinalIgnoreCase) && path.Contains("view-sessions", StringComparison.OrdinalIgnoreCase) ? "view"
                    : "write";
                return RateLimitPartition.GetFixedWindowLimiter(group + ":" + identity, _ => Window(limits[group]));
            });
            // Login/register/password attempts remain IP limited, even for an authenticated caller.
            options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "unknown", _ => Window(limits["auth"])));
            options.OnRejected = async (context, ct) =>
            {
                context.HttpContext.Response.StatusCode = 429;
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retry))
                    context.HttpContext.Response.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(retry.TotalSeconds)).ToString(System.Globalization.CultureInfo.InvariantCulture);
                await context.HttpContext.Response.WriteAsJsonAsync(ApiErrors.Create(context.HttpContext, 429), ct);
            };
        });
        return services;
    }

    private static FixedWindowRateLimiterOptions Window(int limit) => new()
    { PermitLimit = limit, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true };
}
