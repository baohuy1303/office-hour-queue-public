using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;

namespace OfficeHours.Api.Models;

// One course in the directory. Each course has its own queue.
public class Course
{
    public int Id { get; set; }

    // What people see, like "CS315".
    [MaxLength(20)]
    public string Code { get; set; } = "";

    [MaxLength(100)]
    public string Name { get; set; } = "";

    // The code in lowercase, used in links like /c/cs315. No two courses share one.
    [MaxLength(20)]
    public string Slug { get; set; } = "";

    public bool IsOpen { get; set; }

    // What students type to join the queue. TAs can see it, so they can share it.
    [MaxLength(6)]
    public string JoinCode { get; set; } = "";

    public DateTimeOffset CreatedAt { get; set; }

    // The TA account that added the course. Only they (or the admin) can delete it.
    // Null for courses added before we tracked this.
    [MaxLength(450)]
    public string? CreatedByUserId { get; set; }

    // The TAs who run this course.
    public List<CourseTa> Tas { get; set; } = [];

    // A random 6-character join code. It skips look-alike characters (0/O, 1/I/L),
    // so it's easy to read off a board.
    public static string NewJoinCode() =>
        RandomNumberGenerator.GetString("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);
}
