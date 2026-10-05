namespace OfficeHours.Api.Models;

// Links a TA account to a course they run. A course can have several TAs, and a TA can
// have several courses. Together, CourseId and UserId are the primary key.
public class CourseTa
{
    public int CourseId { get; set; }

    // The TA's account id, from Identity's AspNetUsers table.
    public string UserId { get; set; } = "";
}
