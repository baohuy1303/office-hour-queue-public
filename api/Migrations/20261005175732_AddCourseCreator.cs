using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OfficeHours.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseCreator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Who added each course. Existing courses get NULL, so only the admin can delete them.
            // ALTER TABLE [Courses] ADD [CreatedByUserId] nvarchar(450) NULL;
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Courses",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            // After Up() succeeds, EF records the migration so it never runs twice:
            // INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
            // VALUES (N'20261005175732_AddCourseCreator', N'10.0.12');
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ALTER TABLE [Courses] DROP COLUMN [CreatedByUserId];
            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Courses");
        }
    }
}
