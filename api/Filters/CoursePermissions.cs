using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OfficeHours.Api.Models;

namespace OfficeHours.Api.Filters;

public static class CoursePermissions
{
    // Only the TA who added a course, or the admin, can delete it.
    public static async Task<bool> CanDeleteCourseAsync(this IAuthorizationService authorization, ClaimsPrincipal user, Course course) =>
        course.CreatedByUserId == user.FindFirstValue(ClaimTypes.NameIdentifier)
        || (await authorization.AuthorizeAsync(user, "Admin")).Succeeded;
}
