using AnimeWeb.Api.Features.Episodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AnimeWeb.Api.Infrastructure.Persistence.Configurations;

public sealed class SeasonConfiguration : IEntityTypeConfiguration<Season>
{
    public void Configure(EntityTypeBuilder<Season> builder)
    {
        builder.ToTable("Seasons", table =>
        {
            table.HasCheckConstraint("CK_Seasons_Number", "\"Number\" >= 0");
            table.HasCheckConstraint("CK_Seasons_SortOrder", "\"SortOrder\" >= 0");
            table.HasCheckConstraint("CK_Seasons_Title", "length(btrim(\"Title\")) > 0");
        });
        builder.HasKey(season => season.Id);
        builder.Property(season => season.Id).HasMaxLength(100);
        builder.Property(season => season.AnimeId).HasMaxLength(100).IsRequired();
        builder.Property(season => season.Title).HasMaxLength(300).IsRequired();
        builder.HasOne(season => season.Anime).WithMany().HasForeignKey(season => season.AnimeId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(season => new { season.AnimeId, season.SortOrder, season.Id });
    }
}
