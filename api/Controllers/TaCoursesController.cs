using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Controllers;

// The signed-in TA's own courses, for their "Your courses" page.
[ApiController]
[Route("api/ta/courses")]
[Authorize]
public class TaCoursesController(AppDbContext db, IAuthorizationService authorization) : ControllerBase
{
    // GET /api/ta/courses: every course the signed-in TA runs. The admin gets every course.
    [HttpGet]
    public async Task<MyCoursesResponse> GetMyCourses()
    {
        var isAdmin = (await authorization.AuthorizeAsync(User, "Admin")).Succeeded;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var courses = await db.Courses
            .Where(c => isAdmin || c.Tas.Any(t => t.UserId == userId))
            .OrderBy(c => c.Code)
            .Select(c => new CourseListItem(
                c.Slug,
                c.Code,
                c.Name,
                c.IsOpen,
                db.QueueEntries.Count(e => e.CourseId == c.Id && e.Status == QueueStatus.Waiting)))
            .ToListAsync();

        return new MyCoursesResponse(isAdmin, courses);
    }
}
