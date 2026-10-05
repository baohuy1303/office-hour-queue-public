using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OfficeHours.Api.Migrations
{
    /// <inheritdoc />
    public partial class UniqueJoinCodes : Migration
    {
        // Up() runs when the migration is applied (`dotnet ef database update`).
        // EF wraps all of it in BEGIN TRANSACTION ... COMMIT, so it fully applies or not at all.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // UNIQUE means two courses can never share a join code, so a code alone finds its
            // course. The index also makes that lookup fast.
            // CREATE UNIQUE INDEX [IX_Courses_JoinCode] ON [Courses] ([JoinCode]);
            migrationBuilder.CreateIndex(
                name: "IX_Courses_JoinCode",
                table: "Courses",
                column: "JoinCode",
                unique: true);

            // After Up() succeeds, EF records the migration so it never runs twice:
            // INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
            // VALUES (N'20261004044301_UniqueJoinCodes', N'10.0.12');
        }

        // Down() undoes Up(). It runs when you roll back, e.g. `dotnet ef database update AddTaAccounts`.
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // DROP INDEX [IX_Courses_JoinCode] ON [Courses];
            migrationBuilder.DropIndex(
                name: "IX_Courses_JoinCode",
                table: "Courses");
        }
    }
}
