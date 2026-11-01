using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AnimeWeb.Api.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class CompleteBackendFeatures : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "Version",
            table: "Seasons",
            type: "bigint",
            nullable: false,
            defaultValue: 1L);

        migrationBuilder.AddColumn<long>(
            name: "Version",
            table: "Genres",
            type: "bigint",
            nullable: false,
            defaultValue: 1L);

        migrationBuilder.AddColumn<long>(
            name: "Version",
            table: "Episodes",
            type: "bigint",
            nullable: false,
            defaultValue: 1L);

        migrationBuilder.AddColumn<string>(
            name: "Subtitle",
            table: "Anime",
            type: "character varying(300)",
            maxLength: 300,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<long>(
            name: "Version",
            table: "Anime",
            type: "bigint",
            nullable: false,
            defaultValue: 1L);

        migrationBuilder.AddColumn<string>(
            name: "NormalizedName",
            table: "Genres",
            type: "text",
            nullable: true,
            computedColumnSql: "upper(btrim(\"Name\"))",
            stored: true);

        migrationBuilder.CreateTable(
            name: "AccessPermission",
            columns: table => new
            {
                Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AccessPermission", x => x.Code);
            });

        migrationBuilder.CreateTable(
            name: "AccessRole",
            columns: table => new
            {
                Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AccessRole", x => x.Code);
            });

        migrationBuilder.CreateTable(
            name: "Accounts",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                DisplayName = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                Email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                NormalizedEmail = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                PasswordHash = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                Status = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Accounts", x => x.Id);
                table.CheckConstraint("CK_Accounts_Status", "\"Status\" IN ('active','blocked')");
            });

        migrationBuilder.CreateTable(
            name: "PlaybackSources",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                EpisodeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ProviderKey = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Label = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Language = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Type = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Enabled = table.Column<bool>(type: "boolean", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlaybackSources", x => x.Id);
                table.CheckConstraint("CK_Source_Type", "\"Type\" IN ('mp4','hls')");
                table.ForeignKey(
                    name: "FK_PlaybackSources_Episodes_EpisodeId",
                    column: x => x.EpisodeId,
                    principalTable: "Episodes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "ViewEvents",
            columns: table => new
            {
                AnimeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ViewerHash = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Bucket = table.Column<long>(type: "bigint", nullable: false),
                RecordedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ViewEvents", x => new { x.AnimeId, x.ViewerHash, x.Bucket });
                table.ForeignKey(
                    name: "FK_ViewEvents_Anime_AnimeId",
                    column: x => x.AnimeId,
                    principalTable: "Anime",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "ViewSessions",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                EpisodeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ViewerHash = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                StartPosition = table.Column<int>(type: "integer", nullable: false),
                StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ViewSessions", x => x.Id);
                table.ForeignKey(
                    name: "FK_ViewSessions_Episodes_EpisodeId",
                    column: x => x.EpisodeId,
                    principalTable: "Episodes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "RolePermissions",
            columns: table => new
            {
                RoleCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                PermissionCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RolePermissions", x => new { x.RoleCode, x.PermissionCode });
                table.ForeignKey(
                    name: "FK_RolePermissions_AccessPermission_PermissionCode",
                    column: x => x.PermissionCode,
                    principalTable: "AccessPermission",
                    principalColumn: "Code",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_RolePermissions_AccessRole_RoleCode",
                    column: x => x.RoleCode,
                    principalTable: "AccessRole",
                    principalColumn: "Code",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Comments",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                AnimeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                Status = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Comments", x => x.Id);
                table.CheckConstraint("CK_Comments_Body", "(\"Status\"='deleted' AND \"Body\" IS NULL) OR (\"Status\"<>'deleted' AND length(btrim(\"Body\")) BETWEEN 1 AND 2000)");
                table.CheckConstraint("CK_Comments_Status", "\"Status\" IN ('visible','hidden','deleted')");
                table.ForeignKey(
                    name: "FK_Comments_Accounts_UserId",
                    column: x => x.UserId,
                    principalTable: "Accounts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Comments_Anime_AnimeId",
                    column: x => x.AnimeId,
                    principalTable: "Anime",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "LibraryEntries",
            columns: table => new
            {
                UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                AnimeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Status = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                IsFavorite = table.Column<bool>(type: "boolean", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LibraryEntries", x => new { x.UserId, x.AnimeId });
                table.CheckConstraint("CK_Library_Status", "\"Status\" IN ('plan_to_watch','watching','completed','on_hold','dropped')");
                table.ForeignKey(
                    name: "FK_LibraryEntries_Accounts_UserId",
                    column: x => x.UserId,
                    principalTable: "Accounts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_LibraryEntries_Anime_AnimeId",
                    column: x => x.AnimeId,
                    principalTable: "Anime",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "LoginSessions",
            columns: table => new
            {
                TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LoginSessions", x => x.TokenHash);
                table.ForeignKey(
                    name: "FK_LoginSessions_Accounts_UserId",
                    column: x => x.UserId,
                    principalTable: "Accounts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "UserRoles",
            columns: table => new
            {
                UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                RoleCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleCode });
                table.ForeignKey(
                    name: "FK_UserRoles_AccessRole_RoleCode",
                    column: x => x.RoleCode,
                    principalTable: "AccessRole",
                    principalColumn: "Code",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_UserRoles_Accounts_UserId",
                    column: x => x.UserId,
                    principalTable: "Accounts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "WatchProgress",
            columns: table => new
            {
                UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                EpisodeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                PositionSeconds = table.Column<int>(type: "integer", nullable: false),
                Completed = table.Column<bool>(type: "boolean", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WatchProgress", x => new { x.UserId, x.EpisodeId });
                table.CheckConstraint("CK_Progress_Position", "\"PositionSeconds\" >= 0");
                table.ForeignKey(
                    name: "FK_WatchProgress_Accounts_UserId",
                    column: x => x.UserId,
                    principalTable: "Accounts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_WatchProgress_Episodes_EpisodeId",
                    column: x => x.EpisodeId,
                    principalTable: "Episodes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "SubtitleTracks",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                PlaybackSourceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Label = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Language = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Format = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                Version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SubtitleTracks", x => x.Id);
                table.CheckConstraint("CK_Track_Format", "\"Format\" IN ('vtt','srt')");
                table.ForeignKey(
                    name: "FK_SubtitleTracks_PlaybackSources_PlaybackSourceId",
                    column: x => x.PlaybackSourceId,
                    principalTable: "PlaybackSources",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "CommentModerations",
            columns: table => new
            {
                Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                CommentId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ModeratorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Action = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                Reason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                ModeratedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CommentModerations", x => x.Id);
                table.CheckConstraint("CK_Moderation_Action", "\"Action\" IN ('hide','restore')");
                table.ForeignKey(
                    name: "FK_CommentModerations_Accounts_ModeratorId",
                    column: x => x.ModeratorId,
                    principalTable: "Accounts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_CommentModerations_Comments_CommentId",
                    column: x => x.CommentId,
                    principalTable: "Comments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.InsertData(
            table: "AccessPermission",
            column: "Code",
            values: new object[]
            {
                "admin:anime:read",
                "admin:anime:write",
                "admin:comment:moderate",
                "admin:comment:read",
                "admin:dashboard:read",
                "admin:episode:read",
                "admin:episode:write",
                "admin:genre:read",
                "admin:genre:write",
                "admin:playback:read",
                "admin:playback:write",
                "admin:user:read",
                "catalog:read",
                "comment:create",
                "comment:delete:own",
                "comment:read",
                "comment:update:own",
                "library:read:own",
                "library:write:own",
                "playback:read",
                "progress:read:own",
                "progress:write:own"
            });

        migrationBuilder.InsertData(
            table: "AccessRole",
            column: "Code",
            values: new object[]
            {
                "admin",
                "manage",
                "user"
            });

        migrationBuilder.InsertData(
            table: "RolePermissions",
            columns: new[] { "PermissionCode", "RoleCode" },
            values: new object[,]
            {
                { "admin:anime:read", "admin" },
                { "admin:anime:write", "admin" },
                { "admin:comment:moderate", "admin" },
                { "admin:comment:read", "admin" },
                { "admin:dashboard:read", "admin" },
                { "admin:episode:read", "admin" },
                { "admin:episode:write", "admin" },
                { "admin:genre:read", "admin" },
                { "admin:genre:write", "admin" },
                { "admin:playback:read", "admin" },
                { "admin:playback:write", "admin" },
                { "admin:user:read", "admin" },
                { "catalog:read", "admin" },
                { "comment:create", "admin" },
                { "comment:delete:own", "admin" },
                { "comment:read", "admin" },
                { "comment:update:own", "admin" },
                { "library:read:own", "admin" },
                { "library:write:own", "admin" },
                { "playback:read", "admin" },
                { "progress:read:own", "admin" },
                { "progress:write:own", "admin" },
                { "admin:anime:read", "manage" },
                { "admin:comment:read", "manage" },
                { "admin:dashboard:read", "manage" },
                { "admin:episode:read", "manage" },
                { "admin:genre:read", "manage" },
                { "admin:playback:read", "manage" },
                { "admin:user:read", "manage" },
                { "catalog:read", "manage" },
                { "comment:create", "manage" },
                { "comment:delete:own", "manage" },
                { "comment:read", "manage" },
                { "comment:update:own", "manage" },
                { "library:read:own", "manage" },
                { "library:write:own", "manage" },
                { "playback:read", "manage" },
                { "progress:read:own", "manage" },
                { "progress:write:own", "manage" },
                { "catalog:read", "user" },
                { "comment:create", "user" },
                { "comment:delete:own", "user" },
                { "comment:read", "user" },
                { "comment:update:own", "user" },
                { "library:read:own", "user" },
                { "library:write:own", "user" },
                { "playback:read", "user" },
                { "progress:read:own", "user" },
                { "progress:write:own", "user" }
            });

        migrationBuilder.CreateIndex(
            name: "IX_Genres_NormalizedName",
            table: "Genres",
            column: "NormalizedName",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Accounts_NormalizedEmail",
            table: "Accounts",
            column: "NormalizedEmail",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_CommentModerations_CommentId",
            table: "CommentModerations",
            column: "CommentId");

        migrationBuilder.CreateIndex(
            name: "IX_CommentModerations_ModeratorId",
            table: "CommentModerations",
            column: "ModeratorId");

        migrationBuilder.CreateIndex(
            name: "IX_Comments_AnimeId_Status_CreatedAt_Id",
            table: "Comments",
            columns: new[] { "AnimeId", "Status", "CreatedAt", "Id" });

        migrationBuilder.CreateIndex(
            name: "IX_Comments_UserId",
            table: "Comments",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_LibraryEntries_AnimeId",
            table: "LibraryEntries",
            column: "AnimeId");

        migrationBuilder.CreateIndex(
            name: "IX_LibraryEntries_UserId_UpdatedAt",
            table: "LibraryEntries",
            columns: new[] { "UserId", "UpdatedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_LoginSessions_UserId_ExpiresAt",
            table: "LoginSessions",
            columns: new[] { "UserId", "ExpiresAt" });

        migrationBuilder.CreateIndex(
            name: "IX_PlaybackSources_EpisodeId_Enabled",
            table: "PlaybackSources",
            columns: new[] { "EpisodeId", "Enabled" });

        migrationBuilder.CreateIndex(
            name: "IX_RolePermissions_PermissionCode",
            table: "RolePermissions",
            column: "PermissionCode");

        migrationBuilder.CreateIndex(
            name: "IX_SubtitleTracks_PlaybackSourceId",
            table: "SubtitleTracks",
            column: "PlaybackSourceId",
            unique: true,
            filter: "\"IsDefault\" = TRUE");

        migrationBuilder.CreateIndex(
            name: "IX_UserRoles_RoleCode",
            table: "UserRoles",
            column: "RoleCode");

        migrationBuilder.CreateIndex(
            name: "IX_ViewSessions_EpisodeId",
            table: "ViewSessions",
            column: "EpisodeId");

        migrationBuilder.CreateIndex(
            name: "IX_ViewSessions_StartedAt",
            table: "ViewSessions",
            column: "StartedAt");

        migrationBuilder.CreateIndex(
            name: "IX_WatchProgress_EpisodeId",
            table: "WatchProgress",
            column: "EpisodeId");

        migrationBuilder.CreateIndex(
            name: "IX_WatchProgress_UserId_UpdatedAt",
            table: "WatchProgress",
            columns: new[] { "UserId", "UpdatedAt" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "CommentModerations");

        migrationBuilder.DropTable(
            name: "LibraryEntries");

        migrationBuilder.DropTable(
            name: "LoginSessions");

        migrationBuilder.DropTable(
            name: "RolePermissions");

        migrationBuilder.DropTable(
            name: "SubtitleTracks");

        migrationBuilder.DropTable(
            name: "UserRoles");

        migrationBuilder.DropTable(
            name: "ViewEvents");

        migrationBuilder.DropTable(
            name: "ViewSessions");

        migrationBuilder.DropTable(
            name: "WatchProgress");

        migrationBuilder.DropTable(
            name: "Comments");

        migrationBuilder.DropTable(
            name: "AccessPermission");

        migrationBuilder.DropTable(
            name: "PlaybackSources");

        migrationBuilder.DropTable(
            name: "AccessRole");

        migrationBuilder.DropTable(
            name: "Accounts");

        migrationBuilder.DropIndex(
            name: "IX_Genres_NormalizedName",
            table: "Genres");

        migrationBuilder.DropColumn(
            name: "NormalizedName",
            table: "Genres");

        migrationBuilder.DropColumn(
            name: "Version",
            table: "Seasons");

        migrationBuilder.DropColumn(
            name: "Version",
            table: "Genres");

        migrationBuilder.DropColumn(
            name: "Version",
            table: "Episodes");

        migrationBuilder.DropColumn(
            name: "Subtitle",
            table: "Anime");

        migrationBuilder.DropColumn(
            name: "Version",
            table: "Anime");

    }
}
