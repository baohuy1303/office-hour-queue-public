using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;
using OfficeHours.Api.Filters;
using OfficeHours.Api.Hubs;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Controllers;

// The course directory and each course's public status. Routes start with /api/courses.
[ApiController]
[Route("api/courses")]
public class CoursesController(AppDbContext db, IHubContext<QueueHub> hub, IAuthorizationService authorization) : ControllerBase
{
    // GET /api/courses: the directory. Every course, whether it's open, and how many are waiting.
    [HttpGet]
    public async Task<List<CourseListItem>> GetCourses()
    {
        return await db.Courses
            .OrderBy(c => c.Code)
            .Select(c => new CourseListItem(
                c.Slug,
                c.Code,
                c.Name,
                c.IsOpen,
                db.QueueEntries.Count(e => e.CourseId == c.Id && e.Status == QueueStatus.Waiting)))
            .ToListAsync();
    }

    // POST /api/courses: add a course and get its join code. Only signed-in TAs can, and they
    // become the course's first TA.
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CreatedCourseResponse>> CreateCourse(CreateCourseRequest request)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var slug = code.ToLowerInvariant();
        if (await db.Courses.AnyAsync(c => c.Slug == slug))
        {
            return Problem(title: $"{code} is already in the directory.", statusCode: StatusCodes.Status409Conflict);
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var course = new Course
        {
            Code = code,
            Name = request.Name.Trim(),
            Slug = slug,
            JoinCode = await db.NewJoinCodeAsync(),
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedByUserId = userId,
        };
        // Link the signed-in TA, whose account id is a claim in their token. EF saves the course
        // and the link in one transaction, and fills in the course's new Id for the link.
        course.Tas.Add(new CourseTa { UserId = userId });

        db.Courses.Add(course);
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return CreatedAtAction(nameof(GetCourse), new { slug = course.Slug },
            new CreatedCourseResponse(course.Slug, course.Code, course.Name, course.JoinCode));
    }

    // POST /api/courses/lookup: find the course a join code belongs to, for students who only
    // have the code. It's a POST so the code travels in the body, not the URL, which gets logged.
    [HttpPost("lookup")]
    public async Task<ActionResult<CourseLookupResponse>> Lookup(LookupRequest request)
    {
        // Codes are stored in uppercase, so "k7q2px" finds "K7Q2PX".
        var joinCode = request.JoinCode.Trim().ToUpperInvariant();
        var course = await db.Courses.SingleOrDefaultAsync(c => c.JoinCode == joinCode);
        if (course is null)
        {
            return Problem(title: "That join code isn't right. Ask a TA for it.", statusCode: StatusCodes.Status404NotFound);
        }

        return new CourseLookupResponse(course.Slug, course.Code, course.Name);
    }

    // GET /api/courses/{slug}: is the course's queue open, how many are waiting, and how long is the wait?
    [HttpGet("{slug}")]
    public async Task<ActionResult<CourseSummary>> GetCourse(string slug)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        var waitingCount = await db.QueueEntries.CountAsync(e => e.CourseId == course.Id && e.Status == QueueStatus.Waiting);
        var minutesPerStudent = await db.AverageHelpMinutesAsync(course.Id);

        return new CourseSummary(
            course.Slug, course.Code, course.Name, course.IsOpen, waitingCount, (int)Math.Round(waitingCount * minutesPerStudent));
    }

    // DELETE /api/courses/{slug}: delete the course and its queue. Only the TA who created it,
    // or the admin, can.
    [HttpDelete("{slug}")]
    [Authorize]
    [RequireCourseTa]
    public async Task<IActionResult> DeleteCourse(string slug)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }
        if (!await authorization.CanDeleteCourseAsync(User, course))
        {
            return Problem(title: $"Only the TA who added {course.Code} can delete it.", statusCode: StatusCodes.Status403Forbidden);
        }

        db.Courses.Remove(course);
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return NoContent();
    }
}
