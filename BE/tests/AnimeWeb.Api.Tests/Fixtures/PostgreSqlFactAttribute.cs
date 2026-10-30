namespace AnimeWeb.Api.Tests.Fixtures;

public sealed class PostgreSqlFactAttribute : FactAttribute
{
    public PostgreSqlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ANIMEWEB_TEST_DATABASE")))
        {
            Skip = "Run scripts/test-database.ps1 to supply the isolated PostgreSQL fixture.";
        }
    }
}
