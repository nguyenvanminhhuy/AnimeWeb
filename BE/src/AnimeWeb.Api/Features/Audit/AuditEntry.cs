namespace AnimeWeb.Api.Features.Audit;

public sealed class AuditEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ActorId { get; set; } = "";
    public string ActorName { get; set; } = "";
    public string Action { get; set; } = "";
    public string ResourceType { get; set; } = "";
    public string ResourceId { get; set; } = "";
    public string TargetLabel { get; set; } = "";
    public string[] ChangedFields { get; set; } = [];
    public DateTimeOffset OccurredAt { get; set; }
}
