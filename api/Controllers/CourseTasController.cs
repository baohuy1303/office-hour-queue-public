using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;
using OfficeHours.Api.Filters;
using OfficeHours.Api.Hubs;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Controllers;

// A course's TAs. Routes start with /api/courses/{slug}/ta/tas, and only the course's own TAs
// get in. All TAs are equal: any of them can add or remove another. Changes send QueueChanged,
// so open TA pages refresh their list of TAs.
[ApiController]
[Route("api/courses/{slug}/ta/tas")]
[Authorize]
[RequireCourseTa]
public class CourseTasController(AppDbContext db, UserManager<IdentityUser> users, IHubContext<QueueHub> hub) : ControllerBase
{
    // GET /api/courses/{slug}/ta/tas: the course's TAs, by email.
    [HttpGet]
    public async Task<ActionResult<List<CourseTaItem>>> GetTas(string slug)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await db.Users
            .Where(u => db.CourseTas.Any(t => t.CourseId == course.Id && t.UserId == u.Id))
            .OrderBy(u => u.Email)
            .Select(u => new CourseTaItem(u.Id, u.Email!, u.Id == userId))
            .ToListAsync();
    }

    // POST /api/courses/{slug}/ta/tas: add a co-TA by email. They need an account first.
    [HttpPost]
    public async Task<ActionResult<CourseTaItem>> AddTa(string slug, AddTaRequest request)
    {
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        // UserManager is Identity's service for accounts. Its lookups ignore case,
        // so "Sam@School.edu" finds "sam@school.edu".
        var user = await users.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return Problem(title: "No account uses that email. Ask them to create one first.", statusCode: StatusCodes.Status404NotFound);
        }
        if (await db.CourseTas.AnyAsync(t => t.CourseId == course.Id && t.UserId == user.Id))
        {
            return Problem(title: $"{user.Email} is already a TA for {course.Code}.", statusCode: StatusCodes.Status409Conflict);
        }

        db.CourseTas.Add(new CourseTa { CourseId = course.Id, UserId = user.Id });
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return new CourseTaItem(user.Id, user.Email!, IsYou: false);
    }

    // DELETE /api/courses/{slug}/ta/tas/{userId}: take a TA off the course. You can't remove
    // yourself, so every course always keeps at least one TA.
    [HttpDelete("{userId}")]
    public async Task<IActionResult> RemoveTa(string slug, string userId)
    {
        if (userId == User.FindFirstValue(ClaimTypes.NameIdentifier))
        {
            return Problem(title: "You can't remove yourself from a course.", statusCode: StatusCodes.Status409Conflict);
        }

        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            return NotFound();
        }

        // FindAsync looks a row up by its primary key: here the (CourseId, UserId) pair.
        var link = await db.CourseTas.FindAsync(course.Id, userId);
        if (link is null)
        {
            return NotFound();
        }

        db.CourseTas.Remove(link);
        await db.SaveChangesAsync();
        await hub.NotifyCourseChangedAsync(slug);

        return NoContent();
    }
}
