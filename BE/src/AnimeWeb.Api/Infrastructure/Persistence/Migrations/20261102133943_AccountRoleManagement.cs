using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnimeWeb.Api.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AccountRoleManagement : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.InsertData(
            table: "AccessPermission",
            column: "Code",
            value: "admin:user:role:write");

        migrationBuilder.InsertData(
            table: "RolePermissions",
            columns: new[] { "PermissionCode", "RoleCode" },
            values: new object[] { "admin:user:role:write", "admin" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DeleteData(
            table: "RolePermissions",
            keyColumns: new[] { "PermissionCode", "RoleCode" },
            keyValues: new object[] { "admin:user:role:write", "admin" });

        migrationBuilder.DeleteData(
            table: "AccessPermission",
            keyColumn: "Code",
            keyValue: "admin:user:role:write");
    }
}
