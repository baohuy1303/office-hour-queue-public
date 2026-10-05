using System.ComponentModel.DataAnnotations;

namespace OfficeHours.Api.Models;

// What a TA sends to add a course to the directory.
public record CreateCourseRequest(
    [Required, RegularExpression("^[A-Za-z0-9-]{2,20}$", ErrorMessage = "Use 2-20 letters, numbers, or dashes, like CS315.")]
    string Code,
    [Required, MaxLength(100)] string Name);

public record CreatedCourseResponse(string Slug, string Code, string Name, string JoinCode);

// What a student sends to find a course from its join code alone.
public record LookupRequest([Required] string JoinCode);

public record CourseLookupResponse(string Slug, string Code, string Name);

// One row in the directory.
public record CourseListItem(string Slug, string Code, string Name, bool IsOpen, int WaitingCount);

// A course's public status: what the student page shows before joining.
public record CourseSummary(string Slug, string Code, string Name, bool IsOpen, int WaitingCount, int EstimatedWaitMinutes);

// What a student sends to join a course's queue.
public record JoinRequest(
    [Required, MaxLength(50)] string Name,
    [Required, MaxLength(100)] string Topic,
    [Required] string JoinCode);

public record JoinResponse(Guid Id);

// Position and EstimatedWaitMinutes are only set while the student is waiting.
public record TicketResponse(
    Guid Id,
    string Name,
    string Topic,
    QueueStatus Status,
    int? Position,
    int? EstimatedWaitMinutes);

// One row in the TA's list.
public record TaQueueEntry(
    Guid Id,
    string Name,
    string Topic,
    QueueStatus Status,
    DateTimeOffset JoinedAt,
    DateTimeOffset? CalledAt);

// Everything the TA page needs, including the join code to share with students.
// CanDelete is true for the TA who added the course, and for the admin.
public record TaQueueResponse(string Code, string Name, bool IsOpen, string JoinCode, bool CanDelete, List<TaQueueEntry> Entries);

public record JoinCodeResponse(string JoinCode);

// One of a course's TAs. IsYou marks the signed-in TA, who can't remove themselves.
public record CourseTaItem(string UserId, string Email, bool IsYou);

// What a TA sends to add a co-TA. The co-TA needs an account first.
public record AddTaRequest([Required, EmailAddress, MaxLength(256)] string Email);

public record ClearResponse(int Removed);

// The signed-in TA's courses. IsAdmin means the list is every course.
public record MyCoursesResponse(bool IsAdmin, List<CourseListItem> Courses);

// One TA account, for the admin: its id, email, and the courses it runs.
public record AdminTaItem(string UserId, string Email, List<string> Courses);
