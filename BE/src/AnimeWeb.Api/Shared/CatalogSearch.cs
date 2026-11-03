using System.Globalization;
using System.Text;

namespace AnimeWeb.Api.Shared;

public static class CatalogSearch
{
    public static string Normalize(string? value) => new string((value ?? "").Normalize(NormalizationForm.FormD)
        .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
        .Select(c => c is 'đ' or 'Đ' ? 'd' : char.ToLowerInvariant(c)).ToArray()).Trim();

    // Translated by EF; the PostgreSQL implementation is installed by migration.
    public static string Fold(string value) => throw new NotSupportedException("SQL function only.");
}
