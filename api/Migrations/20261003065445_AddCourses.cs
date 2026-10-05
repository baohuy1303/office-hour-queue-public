using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OfficeHours.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCourses : Migration
    {
        // Up() runs when the migration is applied (`dotnet ef database update`).
        // EF wraps all of it in BEGIN TRANSACTION ... COMMIT, so it fully applies or not at all.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Added by hand: existing entries belong to no course, so the foreign key below
            // would reject them. Nothing is deployed yet, so they're only local test data.
            // DELETE FROM [QueueEntries];
            migrationBuilder.Sql("DELETE FROM [QueueEntries];");

            // Each course now has its own IsOpen, so the single settings row goes away.
            // DROP TABLE [QueueSettings];
            migrationBuilder.DropTable(
                name: "QueueSettings");

            // ALTER TABLE [QueueEntries] ADD [CourseId] int NOT NULL DEFAULT 0;
            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "QueueEntries",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // CREATE TABLE [Courses] (
            migrationBuilder.CreateTable(
                name: "Courses",
                columns: table => new
                {
                    //     [Id] int NOT NULL IDENTITY,   -- IDENTITY = auto-increment: 1, 2, 3...
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    //     [Code] nvarchar(20) NOT NULL,
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    //     [Name] nvarchar(100) NOT NULL,
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    //     [Slug] nvarchar(20) NOT NULL,
                    Slug = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    //     [IsOpen] bit NOT NULL,
                    IsOpen = table.Column<bool>(type: "bit", nullable: false),
                    //     [JoinCode] nvarchar(6) NOT NULL,
                    JoinCode = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    //     [TaPasscodeHash] nvarchar(200) NOT NULL,
                    TaPasscodeHash = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    //     [CreatedAt] datetimeoffset NOT NULL,
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    //     CONSTRAINT [PK_Courses] PRIMARY KEY ([Id])
                    table.PrimaryKey("PK_Courses", x => x.Id);
                });
            // );

            // An index makes "all entries for this course" fast.
            // CREATE INDEX [IX_QueueEntries_CourseId] ON [QueueEntries] ([CourseId]);
            migrationBuilder.CreateIndex(
                name: "IX_QueueEntries_CourseId",
                table: "QueueEntries",
                column: "CourseId");

            // UNIQUE means two courses can never share a slug.
            // CREATE UNIQUE INDEX [IX_Courses_Slug] ON [Courses] ([Slug]);
            migrationBuilder.CreateIndex(
                name: "IX_Courses_Slug",
                table: "Courses",
                column: "Slug",
                unique: true);

            // Every entry must point at a real course. ON DELETE CASCADE: deleting a course deletes its entries.
            // ALTER TABLE [QueueEntries] ADD CONSTRAINT [FK_QueueEntries_Courses_CourseId]
            //     FOREIGN KEY ([CourseId]) REFERENCES [Courses] ([Id]) ON DELETE CASCADE;
            migrationBuilder.AddForeignKey(
                name: "FK_QueueEntries_Courses_CourseId",
                table: "QueueEntries",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // After Up() succeeds, EF records the migration so it never runs twice:
            // INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
            // VALUES (N'20261003065445_AddCourses', N'10.0.12');
        }

        // Down() undoes Up(). It runs when you roll back, e.g. `dotnet ef database update InitialCreate`.
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ALTER TABLE [QueueEntries] DROP CONSTRAINT [FK_QueueEntries_Courses_CourseId];
            migrationBuilder.DropForeignKey(
                name: "FK_QueueEntries_Courses_CourseId",
                table: "QueueEntries");

            // DROP TABLE [Courses];
            migrationBuilder.DropTable(
                name: "Courses");

            // DROP INDEX [IX_QueueEntries_CourseId] ON [QueueEntries];
            migrationBuilder.DropIndex(
                name: "IX_QueueEntries_CourseId",
                table: "QueueEntries");

            // ALTER TABLE [QueueEntries] DROP COLUMN [CourseId];
            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "QueueEntries");

            // CREATE TABLE [QueueSettings] (
            //     [Id] int NOT NULL IDENTITY,
            //     [IsOpen] bit NOT NULL,
            //     CONSTRAINT [PK_QueueSettings] PRIMARY KEY ([Id])
            // );
            migrationBuilder.CreateTable(
                name: "QueueSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsOpen = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QueueSettings", x => x.Id);
                });

            // INSERT INTO [QueueSettings] ([Id], [IsOpen]) VALUES (1, 0);
            migrationBuilder.InsertData(
                table: "QueueSettings",
                columns: new[] { "Id", "IsOpen" },
                values: new object[] { 1, false });
        }
    }
}
