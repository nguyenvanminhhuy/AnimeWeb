using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnimeWeb.Api.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class InitialCatalog : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Anime",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                AlternativeTitles = table.Column<string[]>(type: "text[]", nullable: false),
                Synopsis = table.Column<string>(type: "text", nullable: false),
                PosterUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                BannerUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                Format = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                ReleaseYear = table.Column<int>(type: "integer", nullable: false),
                PublicationStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "draft")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Anime", x => x.Id);
                table.CheckConstraint("CK_Anime_Format", "\"Format\" IN ('tv', 'movie', 'ova', 'ona', 'special')");
                table.CheckConstraint("CK_Anime_Publication", "\"PublicationStatus\" IN ('draft', 'published')");
                table.CheckConstraint("CK_Anime_ReleaseYear", "\"ReleaseYear\" BETWEEN 1 AND 9999");
                table.CheckConstraint("CK_Anime_Slug", "\"Slug\" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                table.CheckConstraint("CK_Anime_Status", "\"Status\" IN ('upcoming', 'airing', 'completed')");
                table.CheckConstraint("CK_Anime_Title", "length(btrim(\"Title\")) > 0");
            });

        migrationBuilder.CreateTable(
            name: "Genres",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Genres", x => x.Id);
                table.CheckConstraint("CK_Genres_Name", "length(btrim(\"Name\")) > 0");
                table.CheckConstraint("CK_Genres_Slug", "\"Slug\" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
            });

        migrationBuilder.CreateTable(
            name: "AnimeGenres",
            columns: table => new
            {
                AnimeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                GenreId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AnimeGenres", x => new { x.AnimeId, x.GenreId });
                table.ForeignKey(
                    name: "FK_AnimeGenres_Anime_AnimeId",
                    column: x => x.AnimeId,
                    principalTable: "Anime",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_AnimeGenres_Genres_GenreId",
                    column: x => x.GenreId,
                    principalTable: "Genres",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Anime_PublicationStatus_ReleaseYear_Id",
            table: "Anime",
            columns: new[] { "PublicationStatus", "ReleaseYear", "Id" },
            descending: new[] { false, true, false });

        migrationBuilder.CreateIndex(
            name: "IX_Anime_Slug",
            table: "Anime",
            column: "Slug",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_AnimeGenres_GenreId",
            table: "AnimeGenres",
            column: "GenreId");

        migrationBuilder.CreateIndex(
            name: "IX_Genres_Slug",
            table: "Genres",
            column: "Slug",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "AnimeGenres");

        migrationBuilder.DropTable(
            name: "Anime");

        migrationBuilder.DropTable(
            name: "Genres");
    }
}
