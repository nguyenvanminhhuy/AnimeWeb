using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AnimeWeb.Api.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class ArchiveSearchAudit : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE FUNCTION aw_fold_search(value text) RETURNS text
            LANGUAGE sql IMMUTABLE PARALLEL SAFE
            AS $fn$ SELECT translate(lower(regexp_replace(normalize(coalesce(value, ''), NFD),
                U&'[\0300-\036F]', '', 'g')), U&'\0111\0110', 'dd') $fn$;
            """);
        migrationBuilder.DropCheckConstraint(
            name: "CK_Anime_Publication",
            table: "Anime");

        migrationBuilder.CreateTable(
            name: "AuditEntries",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ActorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ActorName = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Action = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                ResourceType = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                ResourceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                TargetLabel = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                ChangedFields = table.Column<string[]>(type: "text[]", nullable: false),
                OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditEntries", x => x.Id);
            });

        migrationBuilder.InsertData(
            table: "AccessPermission",
            column: "Code",
            value: "admin:audit:read");

        migrationBuilder.InsertData(
            table: "RolePermissions",
            columns: new[] { "PermissionCode", "RoleCode" },
            values: new object[,]
            {
                { "admin:audit:read", "admin" },
                { "admin:audit:read", "manage" }
            });

        migrationBuilder.AddCheckConstraint(
            name: "CK_Anime_Publication",
            table: "Anime",
            sql: "\"PublicationStatus\" IN ('draft', 'published', 'archived')");

        migrationBuilder.CreateIndex(
            name: "IX_AuditEntries_OccurredAt_Id",
            table: "AuditEntries",
            columns: new[] { "OccurredAt", "Id" },
            descending: new bool[0]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP FUNCTION aw_fold_search(text);");
        migrationBuilder.Sql("UPDATE \"Anime\" SET \"PublicationStatus\" = 'draft' WHERE \"PublicationStatus\" = 'archived';");
        migrationBuilder.DropTable(
            name: "AuditEntries");

        migrationBuilder.DropCheckConstraint(
            name: "CK_Anime_Publication",
            table: "Anime");

        migrationBuilder.DeleteData(
            table: "RolePermissions",
            keyColumns: new[] { "PermissionCode", "RoleCode" },
            keyValues: new object[] { "admin:audit:read", "admin" });

        migrationBuilder.DeleteData(
            table: "RolePermissions",
            keyColumns: new[] { "PermissionCode", "RoleCode" },
            keyValues: new object[] { "admin:audit:read", "manage" });

        migrationBuilder.DeleteData(
            table: "AccessPermission",
            keyColumn: "Code",
            keyValue: "admin:audit:read");

        migrationBuilder.AddCheckConstraint(
            name: "CK_Anime_Publication",
            table: "Anime",
            sql: "\"PublicationStatus\" IN ('draft', 'published')");
    }
}
