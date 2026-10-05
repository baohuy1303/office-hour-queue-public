using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using OfficeHours.Api.Data;

namespace OfficeHours.Api.Filters;

// Put [RequireCourseTa] next to [Authorize], on a controller or endpoint whose route has {slug}.
// [Authorize] runs first and answers 401 if nobody is signed in. This filter then answers 403
// if the signed-in TA isn't one of the course's TAs, and the endpoint never runs.
public class RequireCourseTaAttribute : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

        var slug = context.RouteData.Values["slug"] as string ?? "";
        var course = await db.FindCourseAsync(slug);
        if (course is null)
        {
            context.Result = new NotFoundResult();
            return;
        }

        // The admin can manage every course.
        var authorization = context.HttpContext.RequestServices.GetRequiredService<IAuthorizationService>();
        if ((await authorization.AuthorizeAsync(context.HttpContext.User, "Admin")).Succeeded)
        {
            await next();
            return;
        }

        // The signed-in TA's account id. Identity put it in their token as a claim.
        var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isCourseTa = await db.CourseTas.AnyAsync(t => t.CourseId == course.Id && t.UserId == userId);
        if (!isCourseTa)
        {
            context.Result = new ForbidResult();
            return;
        }

        // They're one of this course's TAs: run the endpoint.
        await next();
    }
}
