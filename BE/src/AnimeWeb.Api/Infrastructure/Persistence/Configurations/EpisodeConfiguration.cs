using AnimeWeb.Api.Features.Episodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AnimeWeb.Api.Infrastructure.Persistence.Configurations;

public sealed class EpisodeConfiguration : IEntityTypeConfiguration<Episode>
{
    public void Configure(EntityTypeBuilder<Episode> builder)
    {
        builder.ToTable("Episodes", table =>
        {
            table.HasCheckConstraint("CK_Episodes_Number", "\"Number\" >= 0");
            table.HasCheckConstraint("CK_Episodes_SortOrder", "\"SortOrder\" >= 0");
            table.HasCheckConstraint("CK_Episodes_Duration", "\"DurationSeconds\" IS NULL OR \"DurationSeconds\" >= 0");
            table.HasCheckConstraint("CK_Episodes_Status", "\"Status\" IN ('draft', 'published')");
            table.HasCheckConstraint("CK_Episodes_PublishedAt", "\"Status\" <> 'published' OR \"PublishedAt\" IS NOT NULL");
            table.HasCheckConstraint("CK_Episodes_Title", "length(btrim(\"Title\")) > 0");
        });
        builder.HasKey(episode => episode.Id);
        builder.Property(episode => episode.Id).HasMaxLength(100);
        builder.Property(episode => episode.SeasonId).HasMaxLength(100).IsRequired();
        builder.Property(episode => episode.Number).HasPrecision(8, 2);
        builder.Property(episode => episode.Title).HasMaxLength(300).IsRequired();
        builder.Property(episode => episode.ThumbnailUrl).HasMaxLength(2048).IsRequired();
        builder.Property(episode => episode.Status).HasMaxLength(20).HasDefaultValue("draft").IsRequired();
        builder.Property(episode => episode.PublishedAt).HasColumnType("timestamp with time zone");
        builder.HasOne(episode => episode.Season).WithMany().HasForeignKey(episode => episode.SeasonId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(episode => new { episode.SeasonId, episode.Status, episode.SortOrder, episode.Id });
    }
}
