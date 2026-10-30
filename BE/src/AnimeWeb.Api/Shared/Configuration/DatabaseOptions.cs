using Npgsql;

namespace AnimeWeb.Api.Shared.Configuration;

public sealed class DatabaseOptions
{
    public string AnimeWeb { get; set; } = string.Empty;

    public static bool IsValid(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return false;
        }
        try
        {
            var parsed = new NpgsqlConnectionStringBuilder(connectionString);
            return !string.IsNullOrWhiteSpace(parsed.Host)
                && !string.IsNullOrWhiteSpace(parsed.Database)
                && !string.IsNullOrWhiteSpace(parsed.Username);
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
