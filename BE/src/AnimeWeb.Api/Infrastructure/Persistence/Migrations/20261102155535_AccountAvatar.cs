using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AnimeWeb.Api.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AccountAvatar : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "AvatarKey",
            table: "Accounts",
            type: "character varying(2048)",
            maxLength: 2048,
            nullable: true);

        migrationBuilder.CreateTable(
            name: "AccountAvatars",
            columns: table => new
            {
                UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Content = table.Column<byte[]>(type: "bytea", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AccountAvatars", x => x.UserId);
                table.ForeignKey(
                    name: "FK_AccountAvatars_Accounts_UserId",
                    column: x => x.UserId,
                    principalTable: "Accounts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.InsertData(
            table: "AccessPermission",
            column: "Code",
            value: "profile:avatar:write:own");

        migrationBuilder.InsertData(
            table: "RolePermissions",
            columns: new[] { "PermissionCode", "RoleCode" },
            values: new object[,]
            {
                { "profile:avatar:write:own", "admin" },
                { "profile:avatar:write:own", "manage" },
                { "profile:avatar:write:own", "user" }
            });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "AccountAvatars");

        migrationBuilder.DeleteData(
            table: "RolePermissions",
            keyColumns: new[] { "PermissionCode", "RoleCode" },
            keyValues: new object[] { "profile:avatar:write:own", "admin" });

        migrationBuilder.DeleteData(
            table: "RolePermissions",
            keyColumns: new[] { "PermissionCode", "RoleCode" },
            keyValues: new object[] { "profile:avatar:write:own", "manage" });

        migrationBuilder.DeleteData(
            table: "RolePermissions",
            keyColumns: new[] { "PermissionCode", "RoleCode" },
            keyValues: new object[] { "profile:avatar:write:own", "user" });

        migrationBuilder.DeleteData(
            table: "AccessPermission",
            keyColumn: "Code",
            keyValue: "profile:avatar:write:own");

        migrationBuilder.DropColumn(
            name: "AvatarKey",
            table: "Accounts");
    }
}
