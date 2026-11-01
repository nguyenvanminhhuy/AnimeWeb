using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Auth;

public sealed class AdminBootstrap(AnimeWebDbContext db, IPasswordHasher<Account> hasher, TimeProvider time)
{
    public async Task<bool> CreateAsync(RegisterInput input, CancellationToken ct = default)
    {
        var errors = new List<ValidationResult>();
        if (!Validator.TryValidateObject(input, new ValidationContext(input), errors, true)
            || string.IsNullOrWhiteSpace(input.Password) || input.DisplayName.Trim().Length < 2)
            throw new InvalidOperationException("Bootstrap account requires a valid email, display name and password (8-128 characters).");
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var lockKey = "animeweb-bootstrap-admin";
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({lockKey}, 0))", ct);
        if (await db.UserRoles.AnyAsync(x => x.RoleCode == "admin", ct)) return false;
        var user = new Account
        {
            DisplayName = input.DisplayName.Trim(),
            Email = input.Email.Trim(),
            NormalizedEmail = input.Email.Trim().ToUpperInvariant(),
            CreatedAt = time.GetUtcNow()
        };
        user.PasswordHash = hasher.HashPassword(user, input.Password);
        db.Accounts.Add(user);
        db.UserRoles.Add(new() { UserId = user.Id, RoleCode = "admin" });
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return true;
    }
}
