using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Audit;

public sealed class AuditQuery : PageQuery
{
    [StringLength(200)] public string? Q { get; set; }
    [StringLength(40)] public string? Action { get; set; }
    [StringLength(40)] public string? ResourceType { get; set; }
}
public sealed record AuditDto(string Id, string ActorId, string ActorName, string Action, string ResourceType,
    string ResourceId, string TargetLabel, string[] ChangedFields, DateTimeOffset OccurredAt);

[ApiController, Route("api/v1/admin/audit-logs"), Permission("admin:audit:read")]
public sealed class AuditController(AnimeWebDbContext db) : ControllerBase
{
    [HttpGet]
    public Task<PagedResponse<AuditDto>> List([FromQuery] AuditQuery filters, CancellationToken ct)
    {
        var query = db.AuditEntries.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filters.Q))
        {
            var search = filters.Q.Trim().ToLower();
            query = query.Where(x => x.ActorName.ToLower().Contains(search) || x.TargetLabel.ToLower().Contains(search)
                || x.ResourceId.Contains(search));
        }
        if (filters.Action is not null) query = query.Where(x => x.Action == filters.Action);
        if (filters.ResourceType is not null) query = query.Where(x => x.ResourceType == filters.ResourceType);
        return query.OrderByDescending(x => x.OccurredAt).ThenByDescending(x => x.Id)
            .Select(x => new AuditDto(x.Id, x.ActorId, x.ActorName, x.Action, x.ResourceType, x.ResourceId, x.TargetLabel, x.ChangedFields, x.OccurredAt))
            .PageAsync(filters, ct);
    }
}
