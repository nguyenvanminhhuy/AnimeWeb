using AnimeWeb.Api.Features.Anime;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Infrastructure.Persistence.Configurations;

public sealed class AnimeConfiguration : IEntityTypeConfiguration<AnimeEntity>
{
    public void Configure(EntityTypeBuilder<AnimeEntity> builder)
    {
        builder.ToTable("Anime", table =>
        {
            table.HasCheckConstraint("CK_Anime_Status", "\"Status\" IN ('upcoming', 'airing', 'completed')");
            table.HasCheckConstraint("CK_Anime_Format", "\"Format\" IN ('tv', 'movie', 'ova', 'ona', 'special')");
            table.HasCheckConstraint("CK_Anime_Publication", "\"PublicationStatus\" IN ('draft', 'published')");
            table.HasCheckConstraint("CK_Anime_ReleaseYear", "\"ReleaseYear\" BETWEEN 1 AND 9999");
            table.HasCheckConstraint("CK_Anime_Slug", "\"Slug\" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
            table.HasCheckConstraint("CK_Anime_Title", "length(btrim(\"Title\")) > 0");
        });
        builder.HasKey(anime => anime.Id);
        builder.Property(anime => anime.Id).HasMaxLength(100);
        builder.Property(anime => anime.Slug).HasMaxLength(200).IsRequired();
        builder.Property(anime => anime.Title).HasMaxLength(300).IsRequired();
        builder.Property(anime => anime.AlternativeTitles).HasColumnType("text[]").IsRequired();
        builder.Property(anime => anime.Synopsis).IsRequired();
        builder.Property(anime => anime.PosterUrl).HasMaxLength(2048).IsRequired();
        builder.Property(anime => anime.BannerUrl).HasMaxLength(2048);
        builder.Property(anime => anime.Status).HasMaxLength(20).IsRequired();
        builder.Property(anime => anime.Format).HasMaxLength(20).IsRequired();
        builder.Property(anime => anime.PublicationStatus).HasMaxLength(20).HasDefaultValue("draft").IsRequired();
        builder.HasIndex(anime => anime.Slug).IsUnique();
        builder.HasIndex(anime => new { anime.PublicationStatus, anime.ReleaseYear, anime.Id })
            .IsDescending(false, true, false);

        builder.HasMany(anime => anime.Genres).WithMany(genre => genre.Anime)
            .UsingEntity<AnimeGenre>(
                right => right.HasOne<Genre>().WithMany().HasForeignKey(link => link.GenreId)
                    .OnDelete(DeleteBehavior.Restrict),
                left => left.HasOne<AnimeEntity>().WithMany().HasForeignKey(link => link.AnimeId)
                    .OnDelete(DeleteBehavior.Restrict),
                join =>
                {
                    join.ToTable("AnimeGenres");
                    join.HasKey(link => new { link.AnimeId, link.GenreId });
                    join.Property(link => link.AnimeId).HasMaxLength(100);
                    join.Property(link => link.GenreId).HasMaxLength(100);
                });
    }
}
