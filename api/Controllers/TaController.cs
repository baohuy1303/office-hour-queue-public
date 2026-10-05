using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;
using OfficeHours.Api.Filters;
using OfficeHours.Api.Hubs;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Controllers;

// Endpoints for one course's TAs. Routes start with /api/courses/{slug}/ta.
// Only a signed-in TA of this course gets in. After every change, the pages watching
// this course (and the directory) get a QueueChanged message.
[ApiController]
[Route("api/courses/{slug}/ta")]
[Authorize]
[RequireCourseTa]
public class TaController(AppDbContext db, IHubContext<QueueHub> hub, IAuthorizationService authorization) : ControllerBase
{
    // GET /api/courses/{slug}/ta/queue: everyone being helped or waiting, oldest first,
    // plus the join code to share with students.
    [HttpGet("queue")]
    public async Task<ActionResult<TaQueueResponse>> GetQueue(string slug)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        var entries = await ActiveEntries(course.Id)
            .OrderBy(e => e.JoinedAt)
            .ToListAsync();

        var canDelete = await authorization.CanDeleteCourseAsync(User, course);
        return new TaQueueResponse(
            course.Code, course.Name, course.IsOpen, course.JoinCode, canDelete, entries.Select(ToTaEntry).ToList());
    }

    // POST /api/courses/{slug}/ta/join-code: replace the join code, in case the old one got out.
    // Students already in line keep their spot.
    [HttpPost("join-code")]
    public async Task<ActionResult<JoinCodeResponse>> NewJoinCode(string slug)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        course.JoinCode = await db.NewJoinCodeAsync();
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return new JoinCodeResponse(course.JoinCode);
    }

    // POST /api/courses/{slug}/ta/queue/open: let students join.
    [HttpPost("queue/open")]
    public Task<IActionResult> Open(string slug) => SetOpen(slug, true);

    // POST /api/courses/{slug}/ta/queue/close: stop new students from joining. People already in line stay.
    [HttpPost("queue/close")]
    public Task<IActionResult> Close(string slug) => SetOpen(slug, false);

    // POST /api/courses/{slug}/ta/queue/next: call the student who has waited the longest.
    [HttpPost("queue/next")]
    public async Task<ActionResult<TaQueueEntry>> CallNext(string slug)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        var next = await db.QueueEntries
            .Where(e => e.CourseId == course.Id && e.Status == QueueStatus.Waiting)
            .OrderBy(e => e.JoinedAt)
            .FirstOrDefaultAsync();
        if (next is null)
        {
            return Problem(title: "Nobody is waiting.", statusCode: StatusCodes.Status404NotFound);
        }

        next.Status = QueueStatus.Helping;
        next.CalledAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return ToTaEntry(next);
    }

    // POST /api/courses/{slug}/ta/queue/{id}/done: the TA finished helping this student.
    [HttpPost("queue/{id:guid}/done")]
    public async Task<IActionResult> MarkDone(string slug, Guid id)
    {
        var entry = await FindEntryAsync(slug, id);
        if (entry is null)
        {
            return NotFound();
        }
        if (entry.Status != QueueStatus.Helping)
        {
            return Problem(title: "Only a student being helped can be marked done.", statusCode: StatusCodes.Status409Conflict);
        }

        entry.Status = QueueStatus.Done;
        entry.FinishedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return NoContent();
    }

    // DELETE /api/courses/{slug}/ta/queue/{id}: take a student out of the queue.
    [HttpDelete("queue/{id:guid}")]
    public async Task<IActionResult> Remove(string slug, Guid id)
    {
        var entry = await FindEntryAsync(slug, id);
        if (entry is null)
        {
            return NotFound();
        }

        if (entry.Status is QueueStatus.Waiting or QueueStatus.Helping)
        {
            entry.Status = QueueStatus.Removed;
            entry.FinishedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            await hub.NotifyCourseChangedAsync(slug);
        }

        return NoContent();
    }

    // POST /api/courses/{slug}/ta/queue/clear: remove everyone still waiting or being helped.
    [HttpPost("queue/clear")]
    public async Task<ActionResult<ClearResponse>> Clear(string slug)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        var entries = await ActiveEntries(course.Id).ToListAsync();
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in entries)
        {
            entry.Status = QueueStatus.Removed;
            entry.FinishedAt = now;
        }
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return new ClearResponse(entries.Count);
    }

    private async Task<IActionResult> SetOpen(string slug, bool isOpen)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        course.IsOpen = isOpen;
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return NoContent();
    }

    // Everyone in the course's queue who is still waiting or being helped.
    private IQueryable<QueueEntry> ActiveEntries(int courseId) =>
        db.QueueEntries.Where(e => e.CourseId == courseId && (e.Status == QueueStatus.Waiting || e.Status == QueueStatus.Helping));

    // An entry only counts if it belongs to the course in the URL.
    private async Task<QueueEntry?> FindEntryAsync(string slug, Guid id)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return null;
        }
        return await db.QueueEntries.SingleOrDefaultAsync(e => e.Id == id && e.CourseId == course.Id);
    }

    private static TaQueueEntry ToTaEntry(QueueEntry e) =>
        new(e.Id, e.Name, e.Topic, e.Status, e.JoinedAt, e.CalledAt);
}
