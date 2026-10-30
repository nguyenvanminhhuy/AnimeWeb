using AnimeWeb.Api.Features.Anime;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AnimeWeb.Api.Infrastructure.Persistence.Configurations;

public sealed class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.ToTable("Genres", table =>
        {
            table.HasCheckConstraint("CK_Genres_Slug", "\"Slug\" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
            table.HasCheckConstraint("CK_Genres_Name", "length(btrim(\"Name\")) > 0");
        });
        builder.HasKey(genre => genre.Id);
        builder.Property(genre => genre.Id).HasMaxLength(100);
        builder.Property(genre => genre.Slug).HasMaxLength(100).IsRequired();
        builder.Property(genre => genre.Name).HasMaxLength(100).IsRequired();
        builder.HasIndex(genre => genre.Slug).IsUnique();
    }
}
