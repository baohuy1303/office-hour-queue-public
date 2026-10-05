using Microsoft.AspNetCore.SignalR;

namespace OfficeHours.Api.Hubs;

// Browsers connect here to hear about queue changes. Right after connecting, each page says
// what it wants to watch, and SignalR puts its connection in that group (like a Socket.IO room).
public class QueueHub : Hub
{
    // The one message the server sends. It means "something changed, fetch again".
    public const string QueueChanged = "QueueChanged";

    public const string DirectoryGroup = "directory";

    public static string CourseGroup(string slug) => $"course:{slug.ToLowerInvariant()}";

    // A course's student or TA page calls this, to hear only about that course.
    public Task WatchCourse(string slug) => Groups.AddToGroupAsync(Context.ConnectionId, CourseGroup(slug));

    // The directory page calls this, to hear about every course.
    public Task WatchDirectory() => Groups.AddToGroupAsync(Context.ConnectionId, DirectoryGroup);
}

public static class QueueHubExtensions
{
    // Tells the pages watching this course, and the directory, that something changed.
    public static Task NotifyCourseChangedAsync(this IHubContext<QueueHub> hub, string slug) =>
        hub.Clients.Groups(QueueHub.CourseGroup(slug), QueueHub.DirectoryGroup).SendAsync(QueueHub.QueueChanged);
}
