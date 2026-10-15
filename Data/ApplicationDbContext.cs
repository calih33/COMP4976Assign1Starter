using Microsoft.EntityFrameworkCore;
using RazorProfiles.Models;

namespace RazorProfiles.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Seed();
    }

    public DbSet<Profile>? Profiles { get; set; }
    public DbSet<Post>? Posts { get; set; }
}
