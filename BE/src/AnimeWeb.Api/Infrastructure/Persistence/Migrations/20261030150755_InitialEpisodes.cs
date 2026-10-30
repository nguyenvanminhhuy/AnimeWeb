using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnimeWeb.Api.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class InitialEpisodes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Seasons",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                AnimeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Number = table.Column<int>(type: "integer", nullable: false),
                Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Seasons", x => x.Id);
                table.CheckConstraint("CK_Seasons_Number", "\"Number\" >= 0");
                table.CheckConstraint("CK_Seasons_SortOrder", "\"SortOrder\" >= 0");
                table.CheckConstraint("CK_Seasons_Title", "length(btrim(\"Title\")) > 0");
                table.ForeignKey(
                    name: "FK_Seasons_Anime_AnimeId",
                    column: x => x.AnimeId,
                    principalTable: "Anime",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Episodes",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                SeasonId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Number = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false),
                Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                ThumbnailUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                PublishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "draft")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Episodes", x => x.Id);
                table.CheckConstraint("CK_Episodes_Duration", "\"DurationSeconds\" IS NULL OR \"DurationSeconds\" >= 0");
                table.CheckConstraint("CK_Episodes_Number", "\"Number\" >= 0");
                table.CheckConstraint("CK_Episodes_PublishedAt", "\"Status\" <> 'published' OR \"PublishedAt\" IS NOT NULL");
                table.CheckConstraint("CK_Episodes_SortOrder", "\"SortOrder\" >= 0");
                table.CheckConstraint("CK_Episodes_Status", "\"Status\" IN ('draft', 'published')");
                table.CheckConstraint("CK_Episodes_Title", "length(btrim(\"Title\")) > 0");
                table.ForeignKey(
                    name: "FK_Episodes_Seasons_SeasonId",
                    column: x => x.SeasonId,
                    principalTable: "Seasons",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Episodes_SeasonId_Status_SortOrder_Id",
            table: "Episodes",
            columns: new[] { "SeasonId", "Status", "SortOrder", "Id" });

        migrationBuilder.CreateIndex(
            name: "IX_Seasons_AnimeId_SortOrder_Id",
            table: "Seasons",
            columns: new[] { "AnimeId", "SortOrder", "Id" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Episodes");

        migrationBuilder.DropTable(
            name: "Seasons");
    }
}
