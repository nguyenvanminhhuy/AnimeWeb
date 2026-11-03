using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace AnimeWeb.Api.Tests.Unit;

public sealed class PlaybackAddressTests
{
    private sealed class EnvironmentFixture(string name) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = name;
        public string ApplicationName { get; set; } = "Fixture";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
    private static SourceDto Source(string url) => new("source", "mp4", "Fixture", "und", url, null,
        [new SubtitleDto("track", "vi", "Vietnamese", "vtt", "http://localhost:5173/media/subtitles/fixture.vtt", true)]);

    [Fact]
    public async Task PublicBaseRewritesOnlyLocalMediaAndNeverFetchesAnythingAsync()
    {
        var provider = new DirectPlaybackProvider(Options.Create(new PlaybackOptions { PublicMediaBaseUrl = "https://cdn.fixture.invalid/site/" }), new EnvironmentFixture("Production"));
        var input = Source("http://127.0.0.1:5173/media/open-movies/fixture.mp4");
        var result = await provider.ResolveAsync(input, CancellationToken.None);
        Assert.Equal("https://cdn.fixture.invalid/site/media/open-movies/fixture.mp4", result.Url);
        Assert.Equal("https://cdn.fixture.invalid/site/media/subtitles/fixture.vtt", result.Subtitles[0].Url);
        Assert.Equal("http://127.0.0.1:5173/media/open-movies/fixture.mp4", input.Url);
        var remote = "https://remote.fixture.invalid/movie.mp4?signature=fixture";
        Assert.Equal(remote, (await provider.ResolveAsync(Source(remote), CancellationToken.None)).Url);
    }
    [Fact]
    public async Task LocalMediaNeedsPublicAddressOutsideDevelopmentAsync()
    {
        var input = Source("http://127.0.0.1:5173/media/open-movies/fixture.mp4");
        var production = new DirectPlaybackProvider(Options.Create(new PlaybackOptions()), new EnvironmentFixture("Production"));
        var error = await Assert.ThrowsAsync<ApiFailure>(() => production.ResolveAsync(input, CancellationToken.None));
        Assert.Equal(503, error.Status);
        var dev = new DirectPlaybackProvider(Options.Create(new PlaybackOptions()), new EnvironmentFixture("Development"));
        Assert.Equal("/media/open-movies/fixture.mp4", (await dev.ResolveAsync(input, CancellationToken.None)).Url);
    }
    [Theory]
    [InlineData("https://cdn.fixture.invalid", false, true)]
    [InlineData("http://192.0.2.1:5173", true, true)]
    [InlineData("http://192.0.2.1:5173", false, false)]
    [InlineData("https://user:secret@cdn.fixture.invalid", false, false)]
    [InlineData("https://cdn.fixture.invalid?token=fixture", false, false)]
    [InlineData("https://cdn.fixture.invalid#fragment", false, false)]
    [InlineData("/media", true, false)]
    public void MediaBaseValidation(string value, bool development, bool valid) => Assert.Equal(valid, PlaybackOptions.IsValid(value, development));
}
