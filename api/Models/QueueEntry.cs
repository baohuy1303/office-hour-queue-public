using System.ComponentModel.DataAnnotations;

namespace OfficeHours.Api.Models;

public class QueueEntry
{
    // The student's ticket. It's random, so nobody can guess someone else's.
    public Guid Id { get; set; } = Guid.NewGuid();

    // The course whose queue this entry is in.
    public int CourseId { get; set; }

    [MaxLength(50)]
    public string Name { get; set; } = "";

    [MaxLength(100)]
    public string Topic { get; set; } = "";

    public QueueStatus Status { get; set; } = QueueStatus.Waiting;

    public DateTimeOffset JoinedAt { get; set; }
    public DateTimeOffset? CalledAt { get; set; }
    public DateTimeOffset? FinishedAt { get; set; }
}
