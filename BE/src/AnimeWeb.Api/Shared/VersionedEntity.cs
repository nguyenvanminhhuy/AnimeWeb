namespace AnimeWeb.Api.Shared;

public abstract class VersionedEntity
{
    public long Version { get; set; } = 1;
}
