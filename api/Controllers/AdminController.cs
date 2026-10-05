using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;
using OfficeHours.Api.Hubs;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Controllers;

// Admin-only endpoints for TA accounts. Routes start with /api/admin.
// The admin manages courses with the normal course endpoints, which let them into every course.
[ApiController]
[Route("api/admin")]
[Authorize(Policy = "Admin")]
public class AdminController(AppDbContext db, UserManager<IdentityUser> users, IHubContext<QueueHub> hub) : ControllerBase
{
    // GET /api/admin/tas: every TA account and the courses it runs.
    [HttpGet("tas")]
    public async Task<List<AdminTaItem>> GetTas()
    {
        return await db.Users
            .OrderBy(u => u.Email)
            .Select(u => new AdminTaItem(
                u.Id,
                u.Email!,
                db.Courses.Where(c => c.Tas.Any(t => t.UserId == u.Id)).Select(c => c.Code).ToList()))
            .ToListAsync();
    }

    // DELETE /api/admin/tas/{userId}: delete a TA account. Its course links go with it.
    [HttpDelete("tas/{userId}")]
    public async Task<IActionResult> DeleteTa(string userId)
    {
        var user = await users.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound();
        }
        if (user.UserName == User.Identity?.Name)
        {
            return Problem(title: "You can't delete the admin account.", statusCode: StatusCodes.Status409Conflict);
        }

        // Remember their courses first, so open TA pages there can refresh their TA list.
        var slugs = await db.Courses.Where(c => c.Tas.Any(t => t.UserId == userId)).Select(c => c.Slug).ToListAsync();

        await users.DeleteAsync(user);
        foreach (var slug in slugs)
        {
            await hub.NotifyCourseChangedAsync(slug);
        }

        return NoContent();
    }
}
