using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Infrastructure.Persistence;

// Add DbSets and feature configurations with the first domain module.
public sealed class AnimeWebDbContext(DbContextOptions<AnimeWebDbContext> options) : DbContext(options);
