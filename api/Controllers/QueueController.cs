using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;
using OfficeHours.Api.Hubs;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Controllers;

// Endpoints for students in one course's queue. Routes start with /api/courses/{slug}/queue.
[ApiController]
[Route("api/courses/{slug}/queue")]
public class QueueController(AppDbContext db, IHubContext<QueueHub> hub) : ControllerBase
{
    // POST /api/courses/{slug}/queue: join the course's queue with its join code.
    // Returns the student's ticket id.
    [HttpPost]
    public async Task<ActionResult<JoinResponse>> Join(string slug, JoinRequest request)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }
        // Join codes are case-insensitive, so "k7q2px" works for K7Q2PX.
        if (!string.Equals(request.JoinCode.Trim(), course.JoinCode, StringComparison.OrdinalIgnoreCase))
        {
            return Problem(title: "That join code isn't right. Ask a TA for it.", statusCode: StatusCodes.Status403Forbidden);
        }
        if (!course.IsOpen)
        {
            return Problem(title: "The queue is closed.", statusCode: StatusCodes.Status409Conflict);
        }

        var entry = new QueueEntry
        {
            CourseId = course.Id,
            Name = request.Name.Trim(),
            Topic = request.Topic.Trim(),
            JoinedAt = DateTimeOffset.UtcNow,
        };
        db.QueueEntries.Add(entry);
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        // 201 Created, with a Location header pointing at GET /api/courses/{slug}/queue/{id}.
        return CreatedAtAction(nameof(GetTicket), new { slug = course.Slug, id = entry.Id }, new JoinResponse(entry.Id));
    }

    // GET /api/courses/{slug}/queue/{id}: a student's status, place in line, and estimated wait.
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketResponse>> GetTicket(string slug, Guid id)
    {
        var entry = await FindEntryAsync(slug, id);
        if (entry is null)
        {
            return NotFound();
        }

        int? position = null;
        int? estimatedWaitMinutes = null;
        if (entry.Status == QueueStatus.Waiting)
        {
            var peopleAhead = await db.QueueEntries.CountAsync(e =>
                e.CourseId == entry.CourseId && e.Status == QueueStatus.Waiting && e.JoinedAt < entry.JoinedAt);
            position = peopleAhead + 1;
            estimatedWaitMinutes = (int)Math.Round(peopleAhead * await db.AverageHelpMinutesAsync(entry.CourseId));
        }

        return new TicketResponse(entry.Id, entry.Name, entry.Topic, entry.Status, position, estimatedWaitMinutes);
    }

    // DELETE /api/courses/{slug}/queue/{id}: the student leaves the queue.
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Leave(string slug, Guid id)
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

    // A ticket only counts if it belongs to the course in the URL.
    private async Task<QueueEntry?> FindEntryAsync(string slug, Guid id)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return null;
        }
        return await db.QueueEntries.SingleOrDefaultAsync(e => e.Id == id && e.CourseId == course.Id);
    }
}
