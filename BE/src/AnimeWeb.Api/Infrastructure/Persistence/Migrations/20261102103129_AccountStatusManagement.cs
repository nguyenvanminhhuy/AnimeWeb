using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnimeWeb.Api.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AccountStatusManagement : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "Version",
            table: "Accounts",
            type: "bigint",
            nullable: false,
            defaultValue: 1L);

        migrationBuilder.InsertData(
            table: "AccessPermission",
            column: "Code",
            value: "admin:user:status:write");

        migrationBuilder.InsertData(
            table: "RolePermissions",
            columns: new[] { "PermissionCode", "RoleCode" },
            values: new object[] { "admin:user:status:write", "admin" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DeleteData(
            table: "RolePermissions",
            keyColumns: new[] { "PermissionCode", "RoleCode" },
            keyValues: new object[] { "admin:user:status:write", "admin" });

        migrationBuilder.DeleteData(
            table: "AccessPermission",
            keyColumn: "Code",
            keyValue: "admin:user:status:write");

        migrationBuilder.DropColumn(
            name: "Version",
            table: "Accounts");
    }
}
