using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Data;

// IdentityUserContext adds ASP.NET Core Identity's tables for TA accounts: AspNetUsers plus a
// few small ones. It's the users-only version, because we don't need Identity's roles.
public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityUserContext<IdentityUser>(options)
{
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseTa> CourseTas => Set<CourseTa>();
    public DbSet<QueueEntry> QueueEntries => Set<QueueEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Let Identity set up its tables first.
        base.OnModelCreating(modelBuilder);

        // No two courses can share a slug, so every course gets its own link.
        modelBuilder.Entity<Course>()
            .HasIndex(c => c.Slug)
            .IsUnique();

        // No two courses can share a join code either, so a code alone finds its course.
        modelBuilder.Entity<Course>()
            .HasIndex(c => c.JoinCode)
            .IsUnique();

        // A TA can only be linked to a course once, so the pair is the primary key.
        modelBuilder.Entity<CourseTa>()
            .HasKey(t => new { t.CourseId, t.UserId });

        // Deleting a course deletes its TA links.
        modelBuilder.Entity<Course>()
            .HasMany(c => c.Tas)
            .WithOne()
            .HasForeignKey(t => t.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Every link points at a real TA account. Deleting the account deletes its links.
        modelBuilder.Entity<CourseTa>()
            .HasOne<IdentityUser>()
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Every queue entry belongs to a course. Deleting a course deletes its entries.
        modelBuilder.Entity<QueueEntry>()
            .HasOne<Course>()
            .WithMany()
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Store the status as readable text ("Waiting") instead of a number.
        modelBuilder.Entity<QueueEntry>()
            .Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20);
    }

    // Finds a course by the slug in its link ("cs315"), or returns null.
    public Task<Course?> FindCourseAsync(string slug)
    {
        var key = slug.ToLowerInvariant();
        return Courses.SingleOrDefaultAsync(c => c.Slug == key);
    }

    // A join code no other course uses. There are about 887 million possible codes, so the
    // first try is almost always free.
    public async Task<string> NewJoinCodeAsync()
    {
        while (true)
        {
            var code = Course.NewJoinCode();
            if (!await Courses.AnyAsync(c => c.JoinCode == code))
            {
                return code;
            }
        }
    }

    // Average minutes a TA spent on each of the course's last 10 students. 5 until there's data.
    public async Task<double> AverageHelpMinutesAsync(int courseId)
    {
        var recent = await QueueEntries
            .Where(e => e.CourseId == courseId && e.Status == QueueStatus.Done && e.CalledAt != null && e.FinishedAt != null)
            .OrderByDescending(e => e.FinishedAt)
            .Take(10)
            .Select(e => new { e.CalledAt, e.FinishedAt })
            .ToListAsync();

        if (recent.Count == 0)
        {
            return 5;
        }

        return recent.Average(e => (e.FinishedAt!.Value - e.CalledAt!.Value).TotalMinutes);
    }
}
