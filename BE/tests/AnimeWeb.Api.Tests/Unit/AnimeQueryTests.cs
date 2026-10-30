using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Anime.Dtos;

namespace AnimeWeb.Api.Tests.Unit;

public sealed class AnimeQueryTests
{
    [Fact]
    public void DefaultQueryIsValid()
    {
        var query = new AnimeQuery();
        Assert.True(Validator.TryValidateObject(query, new ValidationContext(query), [], true));
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(1, 0)]
    [InlineData(1, 51)]
    public void InvalidPaginationIsRejected(int page, int pageSize)
    {
        var query = new AnimeQuery { Page = page, PageSize = pageSize };
        Assert.False(Validator.TryValidateObject(query, new ValidationContext(query), [], true));
    }

    [Fact]
    public void UnsupportedSortAndOverlongSearchAreRejected()
    {
        var query = new AnimeQuery { Sort = "popular", Q = new string('a', 201) };
        var errors = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(query, new ValidationContext(query), errors, true));
        Assert.Contains(errors, error => error.MemberNames.Contains("Sort"));
        Assert.Contains(errors, error => error.MemberNames.Contains("Q"));
    }
}
